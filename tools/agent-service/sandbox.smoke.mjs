// Opt-in integration test: real Vercel Sandbox resources and a disposable local database.
import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from './store.mjs'
import { Jobs } from './jobs.mjs'
import { Sandbox } from '@vercel/sandbox'
import { sandboxDriver } from './sandbox-driver.mjs'
if (process.env.RUN_SANDBOX_SMOKE !== '1' || !process.env.BUILD_SNAPSHOT_ID) throw new Error('Set RUN_SANDBOX_SMOKE=1 and BUILD_SNAPSHOT_ID to run the real hosted test.')
const dir = await mkdtemp(join(tmpdir(), 'ootle-sandbox-smoke-'))
const store = await Store.embedded(join(dir, 'db'))
const driver = sandboxDriver(process.env.BUILD_SNAPSHOT_ID),
  jobs = new Jobs(store, driver)
const files = Object.fromEntries(await Promise.all(['Cargo.toml', 'Cargo.lock', 'src/lib.rs', 'tests/counter.rs'].map(async (path) => [path, await readFile(new URL(`../../templates/tari-counter/${path}`, import.meta.url), 'utf8')])))
const project = await store.createProject('smoke', 'Disposable Counter acceptance', files)
let current
async function wait(job) {
  for (let i = 0; i < 150; i++) {
    if (i === 0) console.log('Inspecting', (await jobs.owned(job.id, 'smoke')).command)
    const value = await jobs.inspect(job.id, 'smoke')
    if (i < 2) console.log('Poll', value.status)
    if (!['starting', 'running'].includes(value.status)) return value
    await new Promise((resolve) => setTimeout(resolve, 4000))
  }
  throw new Error('Smoke test wait limit')
}
try {
  current = await jobs.start('smoke', project.id, 1, 'build')
  console.log('Real build started', current.id, current.status)
  const build = await wait(current)
  console.log('Real build result', build.status, build.logs.slice(-800))
  assert.equal(build.status, 'succeeded')
  const artifact = await jobs.artifact(build.id, 'smoke')
  assert.ok(WebAssembly.validate(Buffer.from(artifact.base64, 'base64')))
  console.log('Verified WASM', artifact.bytes, artifact.sha256)
  current = await jobs.start('smoke', project.id, 1, 'test')
  console.log('Real tests started', current.id, current.status)
  const tests = await wait(current)
  console.log('Real test result', tests.status, tests.logs.slice(-1600))
  assert.equal(tests.status, 'succeeded')
  await store.updateProject(project.id, 'smoke', 1, { ...files, 'src/lib.rs': 'this is an intentional syntax error' })
  current = await jobs.start('smoke', project.id, 2, 'build')
  const bad = await wait(current)
  console.log('Intentional compiler error', bad.status, bad.exitCode, bad.logs.slice(-1000))
  assert.equal(bad.status, 'failed')
  assert.equal(bad.exitCode, 101)
  current = await jobs.start('smoke', project.id, 2, 'test')
  assert.equal((await jobs.cancel(current.id, 'smoke')).status, 'canceled')
  console.log('Real cancellation passed')
  await store.updateProject(project.id, 'smoke', 2, files)
  current = await jobs.start('smoke', project.id, 3, 'build')
  const raw = await jobs.owned(current.id, 'smoke')
  const vm = await Sandbox.get({ name: raw.sandbox })
  const command = await vm.currentSession().getCommand(raw.command)
  assert.equal((await command.wait()).exitCode, 0)
  await vm.stop() // Simulate closing the browser and the worker stopping before collection.
  const recovered = await new Jobs(store, driver).inspect(current.id, 'smoke')
  assert.equal(recovered.status, 'succeeded')
  assert.ok(recovered.artifact.bytes > 0)
  console.log('Stopped-worker recovery passed', recovered.artifact.bytes)
} finally {
  if (current) await jobs.cancel(current.id, 'smoke').catch(() => {})
  await store.close()
  await rm(dir, { recursive: true, force: true })
}
