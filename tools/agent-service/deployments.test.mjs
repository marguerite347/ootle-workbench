import test from 'node:test'
import assert from 'node:assert/strict'
import { Store, hash, now } from './store.mjs'
import { Jobs, snapshotDigest } from './jobs.mjs'
import { Deployments, publicationResult } from './deployments.mjs'

const tx = 'a'.repeat(64), address = 'b'.repeat(64)
const wasm = Buffer.from('0061736d01000000', 'hex')
function result({ decision = 'Commit', outcome = 'Accept', publication = true, transaction = tx } = {}) {
  return { result: { Finalized: { final_decision: decision, execution_result: { finalize: { transaction_hash: transaction, fee_receipt: { total_fees_paid: 100 }, result: { [outcome]: { up_substates: publication ? [[`template_${address}`, { version: 0, substate: { Template: {} } }]] : [] } } } } } } }
}
test('publication classification never treats pending, fee-only, or unrelated commits as successful publication', () => {
  assert.equal(publicationResult(null, tx).status, 'pending')
  assert.equal(publicationResult(result(), tx).status, 'indexing')
  assert.equal(publicationResult(result({ outcome: 'AcceptFeeRejectRest' }), tx).status, 'rejected')
  assert.equal(publicationResult(result({ decision: 'Abort' }), tx).status, 'rejected')
  assert.equal(publicationResult(result({ publication: false }), tx).status, 'not_a_publication')
  assert.throws(() => publicationResult(result({ transaction: address }), tx), /different transaction/)
})
test('durable owner-scoped publication: matching tests, stale source, recoverable network failure, ABI and artifact identity', async t => {
  const store = await Store.embedded()
  t.after(() => store.close())
  const project = await store.createProject('alice', 'Counter', { 'src/lib.rs': 'counter' })
  const jobs = new Jobs(store, null)
  const job = { id: 'build', owner: 'alice', project: project.id, projectName: project.name, version: 1, action: 'build', created: now(), status: 'succeeded', exitCode: 0, digest: snapshotDigest(project.files), artifact: { filename: 'counter.wasm', base64: wasm.toString('base64'), sha256: hash(wasm), bytes: wasm.length } }
  await jobs.save(job)
  let mode = 'good', reads = 0
  const network = async url => {
    reads++
    if (mode === 'offline') throw new Error('timeout')
    const path = new URL(url).pathname
    let value
    if (path === '/network') value = { network: 'esmeralda', network_byte: mode === 'wrong-network' ? 0 : 38 }
    else if (path.endsWith('/result')) value = result({ outcome: mode === 'fee-only' ? 'AcceptFeeRejectRest' : 'Accept' })
    else if (path.startsWith('/transactions/')) value = { transaction: { transaction_id: tx, transaction: { V1: { body: { transaction: { network: 38 } } } } } }
    else if (path.startsWith('/templates/catalogue/')) value = { template_address: address, binary_hash: mode === 'optimized' ? 'c'.repeat(64) : hash(wasm) }
    else if (path.startsWith('/templates/')) value = mode === 'indexing' ? null : { name: 'Counter', definition: { V1: { functions: [] } }, code_size: wasm.length }
    else throw new Error(`Unexpected path ${path}`)
    return new Response(JSON.stringify(value), { status: value ? 200 : 404 })
  }
  const deployments = new Deployments(store, jobs, network)
  await assert.rejects(deployments.prepare('bob', job.id), /not found/)
  await assert.rejects(deployments.prepare('alice', job.id), /passing tests/)
  await jobs.save({ ...job, id: 'test', action: 'test', artifact: null })
  const prepared = await deployments.prepare('alice', job.id)
  assert.equal(prepared.status, 'prepared')
  assert.equal(prepared.owner, undefined)
  assert.equal((await deployments.prepare('alice', job.id)).id, prepared.id)
  assert.deepEqual(await deployments.list('bob'), [])
  await assert.rejects(deployments.artifact(prepared.id, 'bob'), /not found/)
  await assert.rejects(deployments.verify(prepared.id, 'alice', '../../network'), /64-character/)
  assert.equal(reads, 0)
  mode = 'offline'
  assert.equal((await deployments.verify(prepared.id, 'alice', tx)).status, 'pending')
  const reopened = new Deployments(store, jobs, network)
  assert.equal((await reopened.list('alice'))[0].transactionId, tx)
  await assert.rejects(reopened.verify(prepared.id, 'alice', address), /another transaction/)
  mode = 'wrong-network'
  assert.match((await reopened.verify(prepared.id, 'alice', tx)).message, /unexpected network/)
  mode = 'indexing'
  assert.equal((await reopened.verify(prepared.id, 'alice', tx)).status, 'indexing')
  mode = 'good'
  const verified = await reopened.verify(prepared.id, 'alice', tx)
  assert.equal(verified.status, 'verified')
  assert.equal(verified.artifactMatches, true)
  assert.equal(verified.templateAddress, address)
  assert.ok(verified.definition)
  await store.delete('job', job.id)
  assert.equal((await reopened.artifact(prepared.id, 'alice')).sha256, hash(wasm))
  await jobs.save({ ...job, id: 'optimized' })
  const optimized = await reopened.prepare('alice', 'optimized')
  mode = 'optimized'
  const unmatched = await reopened.verify(optimized.id, 'alice', tx)
  assert.equal(unmatched.status, 'published_unmatched')
  assert.equal(unmatched.artifactMatches, false)
  await jobs.save({ ...job, id: 'fee-only' })
  const feeOnly = await reopened.prepare('alice', 'fee-only')
  mode = 'fee-only'
  assert.equal((await reopened.verify(feeOnly.id, 'alice', tx)).status, 'rejected')
  await store.updateProject(project.id, 'alice', 1, { 'src/lib.rs': 'changed' })
  await jobs.save({ ...job, id: 'stale' })
  await assert.rejects(reopened.prepare('alice', 'stale'), /source changed/)
})
