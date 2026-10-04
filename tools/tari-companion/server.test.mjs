import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCompanion, validateFiles } from './server.mjs'

const files = { 'Cargo.toml': '[package]\nname="test"', 'Cargo.lock': 'version = 4', 'src/lib.rs': 'pub fn value() -> u64 { 1 }' }
const token = 'a'.repeat(64)
const origin = 'http://127.0.0.1:8080'
async function fixture(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'ootle-test-'))
  const server = createCompanion({ token, origins: [origin], root, ...options })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }) })
  const url = `http://127.0.0.1:${server.address().port}`
  return (path, body, extra = {}) => fetch(url + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, Origin: origin, 'Content-Type': 'application/json', ...extra }, body: body ? JSON.stringify(body) : undefined })
}

test('rejects escaping paths, binary data, oversized files and missing lockfiles', () => {
  for (const name of ['../outside', '/etc/file', 'src/../../file', 'src\\outside', 'C:/outside', 'a//b', '.git/config', 'target/file']) {
    assert.throws(() => validateFiles({ ...files, [name]: 'x' }), /Unsafe/)
  }
  assert.throws(() => validateFiles({ ...files, 'x.rs': 12 }), /text/)
  assert.throws(() => validateFiles({ ...files, 'x.rs': 'x'.repeat(1024 * 1024 + 1) }), /text/)
  assert.throws(() => validateFiles({ 'Cargo.toml': '' }), /Cargo.lock/)
})
test('requires exact origin and a bearer token, never advertises missing integrations', async t => {
  const request = await fixture(t)
  assert.equal((await request('/capabilities', null, { Origin: 'https://untrusted.example' })).status, 403)
  assert.equal((await request('/capabilities', null, { Authorization: '' })).status, 401)
  const response = await request('/capabilities')
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.deepEqual(await response.json(), { version: 1, execution: 'trusted-local', build: false, test: false, assistant: false, model: null, deploy: false, publish: false })
  assert.equal((await request('/run', { action: 'build', files, trusted: true })).status, 403)
  assert.equal((await request('/assistant', { messages: [] })).status, 503)
  assert.equal((await request('/deploy', {})).status, 404)
})
test('requires trust and enum action; reports Cargo failures without claiming success', async t => {
  let calls = 0
  const request = await fixture(t, { allowRun: true, run: async () => { calls++; return { success: false, exitCode: 101, output: 'compile error' } } })
  assert.equal((await request('/run', { action: 'build', files })).status, 403)
  assert.equal((await request('/run', { action: 'sh', trusted: true, files })).status, 400)
  assert.equal(calls, 0)
  const result = await (await request('/run', { action: 'build', trusted: true, files })).json()
  assert.equal(calls, 1); assert.equal(result.success, false); assert.equal(result.exitCode, 101)
  assert.deepEqual(result.artifacts, []); assert.match(result.sourceDigest, /^[a-f0-9]{64}$/)
})
test('only returns real artifact bytes from successful runs and rejects overlapping runs', async t => {
  let finish
  let started
  const running = new Promise(resolve => { started = resolve })
  const request = await fixture(t, { allowRun: true, run: async (_action, _cwd, targetDir) => {
    const dir = join(targetDir, 'wasm32-unknown-unknown/release')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'counter.wasm'), Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]))
    started()
    await new Promise(resolve => { finish = resolve })
    return { success: true, exitCode: 0, output: 'test fixture' }
  } })
  const first = request('/run', { action: 'build', files, trusted: true })
  await running
  assert.equal((await request('/run', { action: 'test', files, trusted: true })).status, 409)
  finish()
  const result = await (await first).json()
  assert.equal(result.artifacts[0].name, 'counter.wasm')
  assert.equal(result.artifacts[0].size, 8)
  assert.match(result.artifacts[0].sha256, /^[a-f0-9]{64}$/)
})
