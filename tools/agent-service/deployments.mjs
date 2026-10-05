import { Problem, hash, now } from './store.mjs'
import { snapshotDigest } from './jobs.mjs'

export const TESTNET = { name: 'esmeralda', byte: 38, indexer: 'https://ootle-indexer-a.tari.com' }
const hex = /^[a-f0-9]{64}$/
const visible = ({ owner, ...record }) => record

// Only an accepted main intent can publish a template. A fee-only commit is not success.
export function publicationResult(data, transactionId) {
  const finalized = data?.result?.Finalized
  if (!finalized) return { status: 'pending', message: 'Awaiting a finalized network result. Recheck this transaction before publishing again.' }
  const result = finalized.execution_result?.finalize
  if (result?.transaction_hash !== transactionId) throw new Problem(502, 'The indexer returned a different transaction.')
  const fees = result.fee_receipt?.total_fees_paid ?? null
  if (finalized.final_decision !== 'Commit' || !result.result?.Accept) {
    return { status: 'rejected', fees, message: 'The main transaction was not accepted. Fees may still have been paid; inspect the wallet before retrying.' }
  }
  const templates = (result.result.Accept.up_substates || []).filter(([id, state]) => /^template_[a-f0-9]{64}$/.test(id) && state?.version === 0 && state?.substate?.Template)
  if (templates.length !== 1) return { status: 'not_a_publication', fees, message: 'This transaction did not create exactly one template. It cannot verify this publication.' }
  return { status: 'indexing', fees, templateAddress: templates[0][0].slice(9), message: 'Publication accepted. Checking the published template and ABI.' }
}

export class Deployments {
  constructor(store, jobs, networkFetch = fetch) { Object.assign(this, { store, jobs, networkFetch }) }
  async list(owner) {
    return (await this.store.query("SELECT value FROM ootle_agents.records WHERE kind='deployment' AND value->>'owner'=$1 ORDER BY (value->>'created')::bigint DESC LIMIT 30", [owner])).rows.map(({ value }) => visible(value))
  }
  async owned(id, owner) {
    const record = await this.store.get('deployment', id)
    if (!record || record.owner !== owner) throw new Problem(404, 'Publication not found.')
    return record
  }
  async prepare(owner, jobId) {
    return this.store.transaction(async () => {
      await this.store.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`deployments:${owner}`])
      const id = hash(`${owner}:${jobId}`)
      const existing = await this.store.get('deployment', id)
      if (existing) return visible(existing)
      if ((await this.list(owner)).length >= 20) throw new Problem(409, 'Pilot limit: 20 prepared publications per account.')
      const job = await this.jobs.owned(jobId, owner)
      const project = await this.store.project(job.project, owner)
      if (job.action !== 'build' || job.status !== 'succeeded' || !job.artifact) throw new Problem(409, 'Select a successful WASM build.')
      if (snapshotDigest(project.files) !== job.digest) throw new Problem(409, 'The shared source changed after this build. Compile and test the current source first.')
      const tests = (await this.jobs.list(owner)).find(test => test.project === job.project && test.action === 'test' && test.status === 'succeeded' && test.exitCode === 0 && test.digest === job.digest)
      if (!tests) throw new Problem(409, 'Run passing tests for this exact source before preparing publication.')
      const bytes = Buffer.from(job.artifact.base64, 'base64')
      if (bytes.length > 1024 * 1024 || hash(bytes) !== job.artifact.sha256 || !WebAssembly.validate(bytes)) throw new Problem(409, 'The build artifact failed validation or exceeds the 1 MiB publication limit.')
      const record = { id, owner, project: project.id, projectName: project.name, version: job.version, buildJob: job.id, testJob: tests.id, sourceDigest: job.digest, artifactSha256: job.artifact.sha256, artifactBytes: bytes.length, network: TESTNET.name, networkByte: TESTNET.byte, indexer: TESTNET.indexer, created: now(), status: 'prepared', transactionId: null, templateAddress: null, publishedBinaryHash: null, artifactMatches: null, checkedAt: null, message: 'Ready for publication in the official wallet. No transaction has been submitted.' }
      // Retain this immutable artifact with its receipt after the build job expires.
      await this.store.put('deployment-artifact', id, { owner, ...job.artifact })
      await this.store.put('deployment', id, record)
      await this.store.log(owner, project.id, 'You', `Prepared template publication of version ${job.version}`)
      return visible(record)
    })
  }
  async artifact(id, owner) {
    await this.owned(id, owner)
    const artifact = await this.store.get('deployment-artifact', id)
    if (!artifact || artifact.owner !== owner) throw new Problem(404, 'Publication artifact is unavailable.')
    return artifact
  }
  async read(path) {
    const response = await this.networkFetch(`${TESTNET.indexer}${path}`, { headers: { Accept: 'application/json', 'User-Agent': 'ootle-workbench/1.0' }, redirect: 'error', signal: AbortSignal.timeout(12000) })
    if (response.status === 404) return null
    if (!response.ok) throw new Problem(502, 'The testnet indexer is unavailable. Your transaction is saved; check again later.')
    // Bound JSON responses, including WASM in transaction results.
    const reader = response.body.getReader()
    const chunks = []; let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 8 * 1024 * 1024) { await reader.cancel(); throw new Problem(502, 'Indexer response exceeded the supported size.') }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  async verify(id, owner, transactionId) {
    if (typeof transactionId !== 'string' || !hex.test(transactionId)) throw new Problem(400, 'Enter the 64-character hexadecimal publication transaction ID from your wallet.')
    // Save the ID before any network request, so timeouts/reloads cannot lose it.
    await this.store.transaction(async () => {
      await this.store.lock('deployment', id)
      const record = await this.owned(id, owner)
      if (record.transactionId && record.transactionId !== transactionId) throw new Problem(409, 'This receipt already tracks another transaction. Reconcile it before retrying publication.')
      await this.store.put('deployment', id, { ...record, transactionId, status: record.transactionId ? record.status : 'pending' })
    })
    const record = await this.owned(id, owner)
    if (record.status === 'verified') return visible(record)
    let update
    try {
      const network = await this.read('/network')
      if (network?.network !== TESTNET.name || network?.network_byte !== TESTNET.byte) throw new Problem(502, 'The indexer is on an unexpected network. Verification stopped.')
      const tx = await this.read(`/transactions/${transactionId}`)
      if (tx && (tx.transaction?.transaction_id !== transactionId || tx.transaction?.transaction?.V1?.body?.transaction?.network !== TESTNET.byte)) throw new Problem(502, 'The transaction identity or network could not be verified.')
      update = publicationResult(tx ? await this.read(`/transactions/${transactionId}/result`) : null, transactionId)
      if (update.templateAddress) {
        const address = update.templateAddress
        const [catalogue, definition] = await Promise.all([this.read(`/templates/catalogue/${address}`), this.read(`/templates/${address}`)])
        if (catalogue?.template_address === address && hex.test(catalogue.binary_hash) && definition?.definition && typeof definition.name === 'string') {
          const matches = catalogue.binary_hash === record.artifactSha256
          update = { ...update, status: matches ? 'verified' : 'published_unmatched', publishedBinaryHash: catalogue.binary_hash, artifactMatches: matches, templateName: definition.name, definition: definition.definition, publishedBytes: definition.code_size, message: matches ? 'Publication and exact build artifact verified on Esmeralda.' : 'Publication confirmed on Esmeralda, but its binary differs from this build. Wallet optimization can change the bytes. The build-to-publication match is not verified.' }
        } else update.message = 'Publication accepted; template catalogue or ABI is not available yet. Check this transaction again.'
      }
    } catch (error) {
      update = { message: error instanceof Problem ? error.message : 'Network verification could not finish. Your transaction is saved; check again later.' }
    }
    return this.store.transaction(async () => {
      await this.store.lock('deployment', id)
      const current = await this.owned(id, owner)
      // A slower check must not overwrite stronger final evidence.
      if (['verified', 'published_unmatched'].includes(current.status)) return visible(current)
      const result = { ...current, ...update, checkedAt: now() }
      await this.store.put('deployment', id, result)
      return visible(result)
    })
  }
}
