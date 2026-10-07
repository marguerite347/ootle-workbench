import http from 'node:http'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, readdir, stat, realpath, chmod, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCompanion, validateFiles, sourceDigest, secureRoot, boundedLog, auditJournal } from './server.mjs'
import { companionRequest, pairingKey, seal, open, validateResult, validateCapabilities } from '../../apps/remix-ide/src/app/plugins/ootle/companion-protocol.mjs'
const files = { 'Cargo.toml': '[package]\nname="test"', 'Cargo.lock': 'version = 4', 'src/lib.rs': 'pub fn value() -> u64 { 1 }' }
const token = 'a'.repeat(64); const origin = 'http://127.0.0.1:8080'
const wasm = Buffer.from([0, 97, 115, 109, 1, 0, 0, 0])
async function fixture(t, options = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'ootle-test-')))
  const events = []
  const server = createCompanion({ token, origins: [origin], root, audit: e => events.push(e), ...options })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }) })
  const url = `http://127.0.0.1:${server.address().port}`
  const request = (path, body = {}) => companionRequest(url, token, origin, path, body, (url, init) => fetch(url, { ...init, headers: { ...init.headers, Origin: origin } }))
  return { request, url, root, events }
}
const failedRun = async () => ({ success: false, exitCode: 101, output: 'compile error', command: 'cargo build' })
test('rejects escaping paths, normalization aliases, overrides, binary data and missing lockfiles', () => {
  for (const name of ['../outside', '/etc/file', 'src/../../file', 'src\\outside', 'C:/outside', 'a//b', '.git/config', 'target/file', 'e\u0301.rs', 'src/\n.rs']) assert.throws(() => validateFiles({ ...files, [name]: 'x' }), /Unsafe/)
  for (const name of ['.cargo/config.toml', 'nested/.cargo/config', 'rust-toolchain', 'rust-toolchain.toml', '.CARGO/config.toml', 'RUST-TOOLCHAIN']) assert.throws(() => validateFiles({ ...files, [name]: 'x' }), /overrides/)
  assert.throws(() => validateFiles({ ...files, 'x.rs': 12 }), /text/)
  assert.throws(() => validateFiles({ ...files, 'x.rs': 'x'.repeat(1024 * 1024 + 1) }), /text/)
  assert.throws(() => validateFiles({ 'Cargo.toml': '' }), /Cargo.lock/)
  assert.throws(() => validateFiles({ ...files, 'cargo.toml': 'duplicate' }), /collide/)
  assert.throws(() => validateFiles(null), /file map/)
  assert.equal(sourceDigest(files), sourceDigest(Object.fromEntries(Object.entries(files).reverse())))
})
test('requires local origins at startup and on every endpoint, checks Host and preflight', async t => {
  assert.throws(() => createCompanion({ token, origins: ['https://ootle-workbench.vercel.app'], root: '/tmp/x' }), /local/)
  const { request, url } = await fixture(t)
  for (const headers of [{}, { Origin: 'https://evil.example' }]) assert.equal((await fetch(url + '/rpc', { method: 'POST', headers })).status, 403)
  const badHost = await new Promise(resolve => { const req = http.request(url + '/rpc', { method: 'POST', headers: { Origin: origin, Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode) }); req.end() })
  assert.equal(badHost, 403)
  assert.equal((await fetch(url + '/rpc', { method: 'OPTIONS' })).status, 403)
  assert.equal((await fetch(url + '/rpc', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } })).status, 204)
  assert.equal(validateCapabilities(await request('/capabilities')).build, false)
  await assert.rejects(request('/run', { trusted: true, action: 'build', files }), /disabled/)
  await assert.rejects(request('/assistant'), /configured/)
})
test('client boolean and prototype actions never authorize native execution', async t => {
  let calls = 0
  const { request } = await fixture(t, { allowRun: true, approve: async () => false, run: async () => { calls++; return failedRun() } })
  await assert.rejects(request('/run', { trusted: true, action: 'build', files }), /approval/)
  for (const action of ['__proto__', 'constructor', 'toString', 'sh']) await assert.rejects(request('/approve', { action, files }), /Unsupported/)
  await assert.rejects(request('/approve', { action: 'build', files }), /declined/)
  await assert.rejects(request('/approve', null), /object/)
  assert.equal(calls, 0)
})
test('approval binds immutable files/action, rotates grant and cannot be reused or changed', async t => {
  const approved = []; const ran = []
  const { request, events } = await fixture(t, { allowRun: true, approve: async data => { approved.push(data); return true }, run: async (action, cwd) => { ran.push(action); return failedRun() } })
  const first = await request('/approve', { action: 'build', files })
  const second = await request('/approve', { action: 'test', files })
  assert.notEqual(first.approvalToken, second.approvalToken)
  await assert.rejects(request('/run', { approvalToken: first.approvalToken }), /approval/)
  await assert.rejects(request('/run', { approvalToken: second.approvalToken, files: { ...files, 'build.rs': 'evil' } }), /approval/)
  const result = await request('/run', { approvalToken: second.approvalToken })
  assert.equal(result.success, false); assert.deepEqual(ran, ['test'])
  await assert.rejects(request('/run', { approvalToken: second.approvalToken }), /approval/)
  assert.equal(approved[1].digest, sourceDigest(files)); assert.notEqual(approved[0].identity, approved[1].identity)
  assert.ok(events.some(e => e.event === 'approval'))
  assert.equal(JSON.stringify(events).includes(second.approvalToken), false)
})
test('serializes terminal approvals and execution, disposes all run state', async t => {
  let finish; let started
  const running = new Promise(resolve => { started = resolve }); const dirs = []
  const { request, root } = await fixture(t, { allowRun: true, approve: async () => true, run: async (_action, cwd, targetDir, signal, cargoHome) => {
    dirs.push([cwd, targetDir, cargoHome])
    const dir = join(targetDir, 'wasm32-unknown-unknown/release')
    await mkdir(dir, { recursive: true }); await writeFile(join(dir, 'counter.wasm'), wasm)
    started(); await new Promise(resolve => { finish = resolve })
    return { success: true, exitCode: 0, output: 'fixture', command: 'cargo build' }
  } })
  const approval = await request('/approve', { action: 'build', files })
  const first = request('/run', { approvalToken: approval.approvalToken }); await running
  await assert.rejects(request('/approve', { action: 'test', files }), /Another/)
  finish(); const result = await first
  await validateResult(result, sourceDigest(files), 'build')
  await new Promise(resolve => setTimeout(resolve, 30))
  assert.deepEqual(await readdir(root), [])
  assert.equal(new Set(dirs[0]).size, 3)
})
test('encrypted transport conceals content, rejects fake listeners, tampering and replay', async t => {
  const { url } = await fixture(t)
  const key = await pairingKey(token)
  const envelope = await seal(key, { path: '/capabilities', body: {}, issuedAt: Date.now() }, `request:${origin}`)
  assert.equal(JSON.stringify(envelope).includes('capabilities'), false)
  const send = e => fetch(url + '/rpc', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(e) })
  const response = await send(envelope)
  assert.equal(response.status, 200)
  assert.equal((await open(key, await response.json(), `response:${origin}:${envelope.iv}`)).version, 2)
  assert.equal((await send(envelope)).status, 409)
  assert.equal((await send({ ...envelope, iv: '0'.repeat(24) })).status, 401)
  const old = await seal(key, { path: '/capabilities', body: {}, issuedAt: 1 }, `request:${origin}`)
  assert.equal((await send(old)).status, 401)
  await assert.rejects(companionRequest(url, token, origin, '/capabilities', {}, async () => new Response(JSON.stringify({ version: 1, output: { value: '<p><iframe srcdoc="evil">' } }))), /authenticated/)
  await assert.rejects(companionRequest(url, token, 'https://ootle-workbench.vercel.app', '/capabilities'), /locally served/)
})
test('browser rejects object logs, renamed executables, forged hashes and malformed WASM', async () => {
  const digest = sourceDigest(files)
  const good = { success: true, exitCode: 0, output: '<p>plain text', command: 'cargo build', sourceDigest: digest, artifacts: [{ name: 'counter.wasm', size: 8, sha256: '93a44bbb96c751218e4c00d479e4c14358122a389acca16205b1e4d0dc5f9476', base64: wasm.toString('base64') }] }
  await validateResult(good, digest, 'build')
  await assert.rejects(validateResult({ ...good, output: { value: '<p><iframe srcdoc="evil">' } }, digest, 'build'), /response/)
  for (const patch of [{ name: 'anything.exe' }, { name: '../x.wasm' }, { sha256: '0'.repeat(64) }, { base64: 'ZXZpbA==' }]) await assert.rejects(validateResult({ ...good, artifacts: [{ ...good.artifacts[0], ...patch }] }, digest, 'build'))
  await assert.rejects(validateResult(good, '0'.repeat(64), 'build'), /response/)
  assert.throws(() => validateCapabilities({ version: 2, build: 'yes' }), /capabilities/)
})
test('private existing root is repaired; symlink roots are rejected', async t => {
  const { root } = await fixture(t)
  await chmod(root, 0o755); await secureRoot(root)
  assert.equal((await stat(root)).mode & 0o777, 0o700)
  const link = root + '-link'; await symlink(root, link); t.after(() => rm(link))
  await assert.rejects(secureRoot(link), /Unsafe/)
})

test('expired approvals cannot run and a run failure still removes all disk state', async t => {
  let now = Date.now(); let called = 0
  const { request, root } = await fixture(t, { allowRun: true, now: () => now, approve: async () => true, run: async () => { called++; throw new Error('/Users/private-name/secrets failed') } })
  const first = await request('/approve', { action: 'test', files })
  now += 60001
  await assert.rejects(request('/run', { approvalToken: first.approvalToken }), /fresh/)
  assert.equal(called, 0)
  const second = await request('/approve', { action: 'test', files })
  await assert.rejects(request('/run', { approvalToken: second.approvalToken }), e => !e.message.includes('private-name') && /operation failed/.test(e.message))
  assert.equal(called, 1); assert.deepEqual(await readdir(root), [])
})
test('ancestor Cargo configuration is refused, including hidden global wrappers', async t => {
  const { root } = await fixture(t)
  await mkdir(join(root, '.cargo')); await writeFile(join(root, '.cargo/config.toml'), '[build]\nrustc-wrapper="unexpected"')
  await assert.rejects(secureRoot(join(root, 'child')), /ancestor Cargo/)
})
test('headless production approval fails closed', async t => {
  if (process.stdin.isTTY) return t.skip('This regression specifically exercises non-TTY execution')
  const { request } = await fixture(t, { allowRun: true, run: () => { throw new Error('Must never execute') } })
  await assert.rejects(request('/approve', { action: 'build', files }), /declined/)
})

test('log ring retains the bounded tail without repeated whole-log copies', () => {
  const log = boundedLog(16)
  log.append(Buffer.from('0123456789')); log.append(Buffer.from('abcdefghij'))
  assert.equal(log.text(), '456789abcdefghij')
  log.append(Buffer.from('x'.repeat(32))); assert.equal(log.text(), 'x'.repeat(16))
  for (let i = 0; i < 10000; i++) log.append(Buffer.from('y'))
  assert.equal(log.text(), 'y'.repeat(16))
})
test('audit journal is private and rotates at its disk limit', async t => {
  const { root } = await fixture(t)
  const log = auditJournal(root)
  log({ event: 'fixture', id: 'one' })
  assert.equal((await stat(join(root, 'audit.jsonl'))).mode & 0o777, 0o600)
  await writeFile(join(root, 'audit.jsonl'), 'x'.repeat(2 * 1024 * 1024))
  log({ event: 'fixture', id: 'two' })
  assert.ok((await stat(join(root, 'audit.jsonl'))).size < 1024)
  assert.equal((await stat(join(root, 'audit.jsonl.previous'))).size, 2 * 1024 * 1024)
})
test('assistant requests are serialized and model text stays bounded', async t => {
  const realFetch = globalThis.fetch
  let entered; let release
  const started = new Promise(resolve => { entered = resolve })
  globalThis.fetch = (url, init) => {
    if (String(url) === 'http://127.0.0.1:11434/api/chat') { entered(); return new Promise(resolve => { release = resolve }) }
    return realFetch(url, init)
  }
  t.after(() => { globalThis.fetch = realFetch })
  const { request } = await fixture(t, { model: 'test-fixture-model' })
  const first = request('/assistant', { messages: [{ role: 'user', content: 'test' }] })
  await started
  await assert.rejects(request('/assistant', { messages: [{ role: 'user', content: 'overlap' }] }), /Another assistant/)
  release(new Response(JSON.stringify({ message: { content: 'Fixture advice only' } })))
  assert.equal((await first).content, 'Fixture advice only')
  await assert.rejects(request('/assistant', { messages: [null] }), /Invalid conversation/)
})
test('companion rejects too many artifacts, oversized artifacts and artifact symlinks', async t => {
  let mode = 'count'
  const { request, root } = await fixture(t, { allowRun: true, approve: async () => true, run: async (_action, cwd, targetDir) => {
    const dir = join(targetDir, 'wasm32-unknown-unknown/release'); await mkdir(dir, { recursive: true })
    if (mode === 'count') for (let i = 0; i < 5; i++) await writeFile(join(dir, `${i}.wasm`), wasm)
    if (mode === 'size') await writeFile(join(dir, 'large.wasm'), Buffer.alloc(8 * 1024 * 1024 + 1))
    if (mode === 'symlink') await symlink(join(cwd, 'Cargo.toml'), join(dir, 'link.wasm'))
    return { success: true, exitCode: 0, output: 'artifact validation fixture', command: 'fixture' }
  } })
  for (mode of ['count', 'size', 'symlink']) {
    const approval = await request('/approve', { action: 'build', files })
    await assert.rejects(request('/run', { approvalToken: approval.approvalToken }), /artifact|Artifact/)
    assert.deepEqual(await readdir(root), [])
  }
})
