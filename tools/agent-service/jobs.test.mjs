import test from 'node:test'
import assert from 'node:assert/strict'
import { Store, now } from './store.mjs'
import { Jobs, snapshotDigest } from './jobs.mjs'
const wasm = Buffer.from('0061736d01000000', 'hex')
async function fixture(t) {
  const store = await Store.embedded()
  t.after(() => store.close())
  const events = [],
    pending = new Map()
  const driver = {
    async start(job) {
      events.push(['start', job])
      pending.set(job.id, { exitCode: null, logs: 'Compiling…' })
      return { command: 'test-command' }
    },
    async inspect(job) {
      return pending.get(job.id)
    },
    async stop(job) {
      events.push(['stop', job.id])
    },
  }
  const jobs = new Jobs(store, driver)
  const p = await store.createProject('owner', 'Counter', { 'Cargo.toml': '[package]\nname="counter"', 'Cargo.lock': 'version=4', 'src/lib.rs': '// version one' })
  return { store, jobs, p, driver, events, pending }
}
test('build snapshot, real status boundary, artifact persistence, owner isolation and cancel', async (t) => {
  const f = await fixture(t)
  await assert.rejects(f.jobs.start('other', f.p.id, 1, 'build'), { status: 404 })
  await assert.rejects(f.jobs.start('owner', f.p.id, 2, 'build'), { status: 409 })
  const j = await f.jobs.start('owner', f.p.id, 1, 'build')
  assert.equal(j.status, 'running')
  assert.equal(j.owner, undefined)
  assert.equal(j.files, undefined)
  assert.equal(j.sandbox, undefined)
  await f.store.updateProject(f.p.id, 'owner', 1, { ...f.p.files, 'src/lib.rs': '// edited later' })
  assert.equal(j.digest, snapshotDigest(f.p.files))
  assert.equal(f.events[0][1].files['src/lib.rs'], '// version one')
  await assert.rejects(f.jobs.inspect(j.id, 'other'), { status: 404 })
  await assert.rejects(f.jobs.inspect(j.id, 'owner', 'wrong-project'), { status: 404 })
  await assert.rejects(f.jobs.artifact(j.id, 'owner'), { status: 409 })
  assert.equal((await f.jobs.inspect(j.id, 'owner')).status, 'running')
  f.pending.set(j.id, { exitCode: 0, logs: 'Compiled', artifact: wasm })
  assert.equal((await f.jobs.inspect(j.id, 'owner')).status, 'succeeded')
  const reopened = new Jobs(f.store, null)
  assert.equal((await reopened.inspect(j.id, 'owner')).artifact.bytes, 8)
  assert.equal((await reopened.artifact(j.id, 'owner')).base64, wasm.toString('base64'))
  assert.ok(f.events.some((e) => e[0] === 'stop'))
  const j2 = await f.jobs.start('owner', f.p.id, 2, 'test')
  assert.equal((await f.jobs.cancel(j2.id, 'owner')).status, 'canceled')
  assert.equal((await f.jobs.inspect(j2.id, 'owner')).status, 'canceled')
})
test('concurrent build allowance, daily quota, timeout and false-success rejection', async (t) => {
  const f = await fixture(t)
  const starts = await Promise.allSettled([f.jobs.start('owner', f.p.id, 1, 'build'), f.jobs.start('owner', f.p.id, 1, 'test')])
  assert.equal(starts.filter((x) => x.status === 'fulfilled').length, 1)
  assert.equal(starts.find((x) => x.status === 'rejected').reason.status, 429)
  const j = starts.find((x) => x.status === 'fulfilled').value
  f.pending.set(j.id, { exitCode: 0, logs: 'Not WASM', artifact: Buffer.from('not wasm') })
  assert.equal((await f.jobs.inspect(j.id, 'owner')).status, 'failed')
  const j2 = await f.jobs.start('owner', f.p.id, 1, 'test')
  const raw = await f.jobs.owned(j2.id, 'owner')
  raw.deadline = now() - 1
  await f.jobs.save(raw)
  assert.equal((await f.jobs.inspect(j2.id, 'owner')).status, 'timed_out')
  for (let i = 0; i < 4; i++) {
    const j = await f.jobs.start('owner', f.p.id, 1, 'test')
    await f.jobs.cancel(j.id, 'owner')
  }
  await assert.rejects(f.jobs.start('owner', f.p.id, 1, 'test'), { status: 429 })
})
test('missing runner/config, compiler failure and restoring a completed result after its deadline', async (t) => {
  const f = await fixture(t)
  await assert.rejects(new Jobs(f.store, null).start('owner', f.p.id, 1, 'build'), { status: 503 })
  const j = await f.jobs.start('owner', f.p.id, 1, 'test')
  f.pending.set(j.id, { exitCode: 101, logs: 'error: expected expression' })
  assert.equal((await f.jobs.inspect(j.id, 'owner')).status, 'failed')
  const j2 = await f.jobs.start('owner', f.p.id, 1, 'build')
  const raw = await f.jobs.owned(j2.id, 'owner')
  raw.deadline = now() - 1
  await f.jobs.save(raw)
  f.pending.set(j2.id, { exitCode: 0, logs: 'Finished', artifact: wasm })
  assert.equal((await f.jobs.inspect(j2.id, 'owner')).status, 'succeeded')
})
