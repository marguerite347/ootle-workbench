import { randomUUID } from 'node:crypto'
import { Problem, hash, now, validateFiles } from './store.mjs'
export const JOB_SECONDS = 20 * 60
export const RETENTION_SECONDS = 7 * 86400
const terminal = (job) => ['succeeded', 'failed', 'canceled', 'timed_out'].includes(job.status)
export const snapshotDigest = (files) =>
  hash(
    JSON.stringify(
      Object.keys(files)
        .sort()
        .map((path) => [path, files[path]]),
    ),
  )
export function publicJob(job) {
  const { owner, sandbox, command, artifact, files, ...visible } = job
  return { ...visible, artifact: artifact ? { filename: artifact.filename, sha256: artifact.sha256, bytes: artifact.bytes } : null }
}
export class Jobs {
  constructor(store, driver) {
    this.store = store
    this.driver = driver
  }
  get configured() {
    return Boolean(this.driver)
  }
  async owned(id, owner, project) {
    const job = await this.store.get('job', id)
    if (!job || job.owner !== owner || (project && job.project !== project)) throw new Problem(404, 'Build job not found or expired.')
    return job
  }
  async save(job) {
    await this.store.put('job', job.id, job, job.created + RETENTION_SECONDS)
  }
  async list(owner) {
    const rows = (await this.store.query("SELECT value FROM ootle_agents.records WHERE kind='job' AND value->>'owner'=$1 AND expires>$2 ORDER BY (value->>'created')::bigint DESC LIMIT 30", [owner, now()])).rows
    return rows.map((r) => publicJob(r.value))
  }
  async start(owner, project, version, action, agent = 'You') {
    if (!this.driver) throw new Problem(503, 'Hosted builds are not configured yet.')
    if (!['build', 'test'].includes(action)) throw new Problem(400, 'Choose build or test.')
    const job = await this.store.transaction(async () => {
      // One database lock makes both per-account and whole-pilot quotas atomic across instances.
      await this.store.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['ootle-hosted-build-quota'])
      const p = await this.store.project(project, owner)
      if (p.version !== version) throw new Problem(409, 'Workspace changed. Refresh before starting a build.')
      validateFiles(p.files)
      if (!p.files['Cargo.toml'] || !p.files['Cargo.lock']) throw new Problem(400, 'A root Cargo.toml and Cargo.lock are required.')
      // Cargo config can replace the trusted compiler; the initial hosted runner supports standard projects only.
      if (Object.keys(p.files).some((path) => path.startsWith('.cargo/') || /(^|\/)rust-toolchain(?:\.toml)?$/.test(path))) throw new Problem(400, 'Hosted builds use the pinned Workbench toolchain; remove custom Cargo/toolchain configuration.')
      const rows = (await this.store.query("SELECT value FROM ootle_agents.records WHERE kind='job' AND (value->>'created')::bigint>$1", [now() - 86400])).rows.map((r) => r.value)
      const active = rows.filter((j) => !terminal(j) && j.deadline > now())
      if (active.some((j) => j.owner === owner)) throw new Problem(429, 'One build at a time. Finish or cancel your running job.')
      if (active.length >= 2) throw new Problem(429, 'Both build workers are busy. Try again shortly.')
      if (rows.filter((j) => j.owner === owner).length >= 6 || rows.length >= 12) throw new Problem(429, 'Daily pilot build allowance reached. Try again tomorrow.')
      const id = randomUUID(),
        created = now()
      const job = { id, owner, project, projectName: p.name, version, action, status: 'starting', created, deadline: created + JOB_SECONDS, digest: snapshotDigest(p.files), files: p.files, sandbox: `ootle-job-${id}`, logs: '', exitCode: null, artifact: null }
      await this.save(job)
      await this.store.log(owner, project, agent, `Started ${action} of version ${version}`)
      return job
    })
    try {
      const started = await this.driver.start(job)
      return await this.store.transaction(async () => {
        await this.store.lock('job', job.id)
        const current = await this.owned(job.id, owner)
        if (terminal(current)) {
          await this.driver.stop(job)
          return publicJob(current)
        }
        Object.assign(current, started, { status: 'running', files: undefined })
        await this.save(current)
        return publicJob(current)
      })
    } catch {
      await this.driver.stop(job).catch(() => {})
      return this.store.transaction(async () => {
        await this.store.lock('job', job.id)
        const current = await this.owned(job.id, owner)
        if (!terminal(current)) {
          Object.assign(current, { status: 'failed', finished: now(), files: undefined, logs: 'Could not start the isolated build worker. Retry later or contact the operator.' })
          await this.save(current)
        }
        return publicJob(current)
      })
    }
  }
  async inspect(id, owner, project) {
    return this.store.transaction(async () => {
      await this.store.lock('job', id)
      const job = await this.owned(id, owner, project)
      if (terminal(job)) return publicJob(job)
      if (job.status === 'starting' && job.created < now() - 90) {
        await this.driver?.stop(job).catch(() => {})
        Object.assign(job, { status: 'timed_out', finished: now(), files: undefined, logs: job.logs + '\nBuild worker timed out or was interrupted. Start a new job.' })
      } else if (job.status === 'running') {
        const result = await this.driver.inspect(job)
        if (result.exitCode === null && job.deadline <= now()) {
          await this.driver.stop(job)
          job.status = 'timed_out'
          job.finished = now()
          job.logs += '\nBuild exceeded the 20 minute limit.'
          await this.save(job)
          return publicJob(job)
        }
        job.logs = String(result.logs || '').slice(-100000)
        if (result.exitCode !== null) {
          job.exitCode = result.exitCode
          job.status = result.exitCode === 0 ? 'succeeded' : 'failed'
          job.finished = now()
          if (job.status === 'succeeded' && job.action === 'build') {
            const artifact = result.artifact
            if (!artifact || artifact.length > 8 * 1024 * 1024 || !WebAssembly.validate(artifact)) {
              job.status = 'failed'
              job.logs += '\nCompiler did not return a valid WASM artifact (maximum 8 MiB).'
            } else job.artifact = { filename: 'template.wasm', bytes: artifact.length, sha256: hash(artifact), base64: Buffer.from(artifact).toString('base64') }
          }
          // Persist result before resource cleanup so a provider error cannot lose a completed artifact.
          await this.save(job)
          await this.driver.stop(job).catch(() => {})
          await this.store.log(owner, job.project, 'Build worker', `${job.action}: ${job.status} (version ${job.version})`)
        }
      }
      await this.save(job)
      return publicJob(job)
    })
  }
  async cancel(id, owner, project) {
    return this.store.transaction(async () => {
      await this.store.lock('job', id)
      const job = await this.owned(id, owner, project)
      if (!terminal(job)) {
        await this.driver.stop(job)
        Object.assign(job, { status: 'canceled', finished: now(), files: undefined })
        await this.save(job)
        await this.store.log(owner, job.project, 'You', 'Canceled build')
      }
      return publicJob(job)
    })
  }
  async artifact(id, owner, project) {
    const job = await this.owned(id, owner, project)
    if (job.status !== 'succeeded' || !job.artifact) throw new Problem(409, 'No successful WASM artifact for this job.')
    return { ...job.artifact, sourceDigest: job.digest, version: job.version }
  }
}
