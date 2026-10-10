import test from 'node:test'
import assert from 'node:assert/strict'
import { projectProfile, NODE_PROFILE } from './node-profile.mjs'
import { Store } from './store.mjs'
import { Jobs } from './jobs.mjs'
const files = {
  'ootle-workbench.json': JSON.stringify({ profile: NODE_PROFILE }),
  'package.json': JSON.stringify({ private: true }),
  'package-lock.json': JSON.stringify({ lockfileVersion: 3, packages: { '': {} } }),
  'test/round.test.mjs': "import test from 'node:test'; test('real test',()=>{})",
}
test('explicit Node target, locked registry dependencies and no silent app-build success', () => {
  assert.equal(projectProfile(files, 'test'), NODE_PROFILE)
  assert.equal(projectProfile({}, 'build'), 'rust-wasm-v1')
  assert.throws(() => projectProfile(files, 'build'), /tests only/)
  assert.throws(() => projectProfile({ ...files, '.npmrc': 'registry=https://evil.invalid' }, 'test'), /configuration/)
  assert.throws(() => projectProfile({ ...files, 'package-lock.json': JSON.stringify({ lockfileVersion: 3, packages: { '': {}, 'node_modules/evil': { resolved: 'file:/etc/passwd' } } }) }, 'test'), /integrity-pinned/)
  assert.throws(() => projectProfile({ ...files, 'ootle-workbench.json': '{"profile":"shell"}' }, 'test'), /profile/)
})
test('Node job retains snapshot and profile, uses actual exit code, and has no WASM artifact', async t => {
  const store = await Store.embedded(); t.after(() => store.close())
  let result = { exitCode: 1, logs: 'assertion failed' }, captured
  const driver = { async start(j) { captured = j; return { command: 'fixture-command' } }, async inspect() { return result }, async stop() {} }
  const jobs = new Jobs(store, driver), p = await store.createProject('owner', 'Node trial', files)
  const j = await jobs.start('owner', p.id, 1, 'test')
  assert.equal(captured.profile, NODE_PROFILE); assert.deepEqual(captured.files, files)
  assert.equal((await jobs.inspect(j.id, 'owner')).status, 'failed')
  result = { exitCode: 0, logs: 'tests passed' }
  const second = await jobs.start('owner', p.id, 1, 'test')
  assert.equal((await jobs.inspect(second.id, 'owner')).status, 'succeeded')
  await assert.rejects(jobs.artifact(second.id, 'owner'), { status: 409 })
  await assert.rejects(jobs.start('owner', p.id, 1, 'build'), { status: 400 })
})
