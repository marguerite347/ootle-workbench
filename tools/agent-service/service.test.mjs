import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { Store, random, hash, now, validateFiles } from './store.mjs'
import { createService } from './server.mjs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ootle-agent-test-')),
    store = await Store.embedded(join(dir, 'test-pg'))
  // Bind an ephemeral port before setting the exact issuer/host. No public test-login route exists.
  const { createServer } = await import('node:http')
  let app
  const http = createServer((req, res) => app(req, res))
  await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${http.address().port}`
  const created = createService({ store, origin, ideOrigins: ['http://127.0.0.1:8080'], githubClientId: 'test-id', githubClientSecret: 'test-secret', githubFetch: async (url) => new Response(JSON.stringify(url.includes('access_token') ? { access_token: 'fixture-github-token' } : { id: 12, login: 'fixture' }), { status: 200 }) })
  app = created.app
  const a = await store.session({ id: 'github:1', login: 'alice' }),
    b = await store.session({ id: 'github:2', login: 'bob' })
  const request = async (path, { user = a, method = 'GET', body, headers = {}, form, redirect = 'manual' } = {}) => fetch(`${origin}${path}`, { method, redirect, headers: { ...(user ? { Cookie: `ootle_session=${user.token}`, 'X-CSRF-Token': user.csrf } : {}), ...(body || form ? { Origin: origin, 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' } : {}), ...headers }, body: form ? new URLSearchParams(form).toString() : body ? JSON.stringify(body) : undefined })
  t.after(async () => {
    await new Promise((resolve) => http.close(resolve))
    await store.close()
    rmSync(dir, { recursive: true, force: true })
  })
  const project = await (await request('/api/projects', { method: 'POST', body: { name: 'Counter', files: { 'src/lib.rs': 'pub fn value() -> u64 { 1 }' } } })).json()
  async function authorize({ write = true, client, projectId = project.id, user = a } = {}) {
    client ||= await (await request('/register', { user: null, method: 'POST', body: { client_name: 'Integration test agent', redirect_uris: ['http://127.0.0.1:9876/callback'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] } })).json()
    const verifier = random(),
      challenge = createHash('sha256').update(verifier).digest('base64url')
    const query = new URLSearchParams({ client_id: client.client_id, redirect_uri: client.redirect_uris[0], response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', state: 'test-state', scope: write ? 'workspace:read workspace:write' : 'workspace:read', resource: `${origin}/mcp` })
    const start = await request(`/authorize?${query}`, { user })
    assert.equal(start.status, 302)
    const consentPath = start.headers.get('location')
    const consent = await request(consentPath, { user })
    assert.equal(consent.status, 200)
    const pending = new URL(consentPath, origin).searchParams.get('request')
    const approved = await request('/consent', { user, method: 'POST', form: { request: pending, csrf: user.csrf, decision: 'allow', project: projectId, ...(write ? { write: 'yes' } : {}) } })
    if (approved.status !== 302) return { approved, client, pending, verifier }
    const callback = new URL(approved.headers.get('location'))
    assert.equal(callback.searchParams.get('state'), 'test-state')
    const code = callback.searchParams.get('code')
    const exchange = (data) => request('/token', { user: null, method: 'POST', form: { client_id: client.client_id, resource: `${origin}/mcp`, ...data } })
    return { client, code, verifier, exchange, pending }
  }
  return { store, origin, request, a, b, project, authorize, filename: join(dir, 'test-pg') }
}

test('OAuth + official SDK client: read/edit/conflict, account isolation and immediate revoke', async (t) => {
  const f = await fixture(t),
    flow = await f.authorize()
  const bad = await flow.exchange({ grant_type: 'authorization_code', code: flow.code, code_verifier: random(), redirect_uri: flow.client.redirect_uris[0] })
  assert.equal(bad.status, 400)
  const exchanged = await flow.exchange({ grant_type: 'authorization_code', code: flow.code, code_verifier: flow.verifier, redirect_uri: flow.client.redirect_uris[0] })
  assert.equal(exchanged.status, 200)
  const tokens = await exchanged.json()
  assert.equal((await flow.exchange({ grant_type: 'authorization_code', code: flow.code, code_verifier: flow.verifier, redirect_uri: flow.client.redirect_uris[0] })).status, 400)
  const client = new Client({ name: 'acceptance-client', version: '1.0.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(`${f.origin}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${tokens.access_token}` } } }))
  t.after(() => client.close())
  assert.deepEqual((await client.listTools()).tools.map((t) => t.name).sort(), ['list_files', 'list_projects', 'read_file', 'write_file'])
  const call = async (name, args = {}) => client.callTool({ name, arguments: args })
  assert.equal(JSON.parse((await call('list_projects')).content[0].text).projects[0].id, f.project.id)
  assert.match((await call('read_file', { project_id: f.project.id, path: 'src/lib.rs' })).content[0].text, /value/)
  const edit = await call('write_file', { project_id: f.project.id, path: 'src/lib.rs', content: 'pub fn value() -> u64 { 2 }', expected_version: 1 })
  assert.equal(JSON.parse(edit.content[0].text).version, 2)
  assert.equal((await call('write_file', { project_id: f.project.id, path: 'src/lib.rs', content: 'lost update', expected_version: 1 })).isError, true)
  const other = await f.store.createProject('github:2', 'Private', { 'private.txt': 'secret-project' })
  assert.equal((await call('read_file', { project_id: other.id, path: 'private.txt' })).isError, true)
  assert.equal((await f.request(`/api/projects/${f.project.id}`, { user: f.b })).status, 404)
  assert.equal((await f.request(`/api/projects/${f.project.id}`, { user: f.b, method: 'PUT', body: { version: 2, files: { 'bad.txt': 'bad' } } })).status, 404)
  const grant = (await f.store.grants('github:1'))[0]
  assert.equal((await f.request(`/api/connections/${grant.id}/revoke`, { user: f.b, method: 'POST', body: {} })).status, 404)
  assert.match((await f.store.project(f.project.id, 'github:1')).files['src/lib.rs'], /2/)
  assert.equal((await f.request(`/api/connections/${grant.id}/revoke`, { method: 'POST', body: {} })).status, 200)
  const revoked = await f.request('/mcp', { user: null, method: 'POST', body: { jsonrpc: '2.0', id: 1, method: 'tools/list' }, headers: { Authorization: `Bearer ${tokens.access_token}` } })
  assert.equal(revoked.status, 401)
})

test('read-only grants, resource binding, refresh rotation and replay revocation', async (t) => {
  const f = await fixture(t),
    flow = await f.authorize({ write: false })
  const form = { grant_type: 'authorization_code', code: flow.code, code_verifier: flow.verifier, redirect_uri: flow.client.redirect_uris[0] }
  assert.equal((await flow.exchange({ ...form, resource: 'https://wrong.example/mcp' })).status, 400)
  const tokens = await (await flow.exchange(form)).json()
  const client = new Client({ name: 'read-only-client', version: '1.0.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(`${f.origin}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${tokens.access_token}` } } }))
  t.after(() => client.close())
  assert.equal(
    (await client.listTools()).tools.some((t) => t.name === 'write_file'),
    false,
  )
  assert.equal((await client.callTool({ name: 'write_file', arguments: { project_id: f.project.id, path: 'bad.txt', content: 'bad', expected_version: 1 } })).isError, true)
  const refresh = { grant_type: 'refresh_token', refresh_token: tokens.refresh_token }
  assert.equal((await flow.exchange({ ...refresh, scope: 'workspace:read workspace:write' })).status, 400)
  const rotated = await (await flow.exchange(refresh)).json()
  assert.ok(rotated.access_token)
  assert.equal((await flow.exchange(refresh)).status, 400)
  assert.equal(await f.store.getGrant((await f.store.grants('github:1'))[0].id), undefined)
})

test('consent ownership, CSRF, redirects, missing auth, path/size validation and canceled sign-in', async (t) => {
  const f = await fixture(t)
  assert.equal((await f.request('/api/me', { user: null })).status, 401)
  assert.equal((await f.request('/mcp', { user: null, method: 'POST', body: {} })).status, 401)
  assert.equal((await f.request('/api/projects', { method: 'POST', body: {}, headers: { Origin: 'https://evil.example' } })).status, 403)
  assert.equal((await f.request('/api/projects', { method: 'POST', body: {}, headers: { 'X-CSRF-Token': 'wrong' } })).status, 403)
  assert.equal((await f.request('/register', { user: null, method: 'POST', body: { redirect_uris: ['javascript:alert(1)'], token_endpoint_auth_method: 'none' } })).status, 400)
  const flow = await f.authorize({ projectId: (await f.store.createProject('github:2', 'Bob', { 'b.txt': 'b' })).id })
  assert.equal(flow.approved.status, 404)
  assert.equal((await f.request('/consent', { user: f.b, method: 'POST', form: { request: flow.pending, csrf: f.b.csrf, decision: 'allow', project: f.project.id } })).status, 400)
  assert.equal((await f.request('/authorize?' + new URLSearchParams({ client_id: flow.client.client_id, redirect_uri: 'https://evil.example', response_type: 'code' }), { user: null })).status, 400)
  for (const path of ['../secrets', '/etc/passwd', '.env', '.env.production', '.git/config', 'x/../../y', 'x\\y', 'key.pem']) assert.throws(() => validateFiles({ [path]: 'secret' }))
  assert.throws(() => validateFiles({ 'big.txt': 'a'.repeat(3 * 1024 * 1024 + 1) }))
  assert.equal((await f.request('/login/callback?state=invalid&error=access_denied', { user: null })).status, 400)
  const login = await f.request('/login', { user: null })
  const state = new URL(login.headers.get('location')).searchParams.get('state')
  const cookie = login.headers.get('set-cookie').split(';')[0]
  const signed = await f.request(`/login/callback?state=${state}&code=fixture`, { user: null, headers: { Cookie: cookie } })
  assert.equal(signed.status, 302)
  assert.match(signed.headers.get('set-cookie'), /HttpOnly/)
  assert.equal((await f.request(`/login/callback?state=${state}&code=fixture`, { user: null, headers: { Cookie: cookie } })).status, 400)
})

test('authorization codes can be consumed only once under concurrent requests', async (t) => {
  const f = await fixture(t),
    flow = await f.authorize()
  const form = { grant_type: 'authorization_code', code: flow.code, code_verifier: flow.verifier, redirect_uri: flow.client.redirect_uris[0] }
  const responses = await Promise.all([flow.exchange(form), flow.exchange(form)])
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400])
})

test('durable embedded PostgreSQL survives a close and reopen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ootle-persistence-'))
  let store = await Store.embedded(join(dir, 'pg'))
  try {
    const p = await store.createProject('test-owner', 'Recovery', { 'README.md': 'Saved' })
    await store.close()
    store = await Store.embedded(join(dir, 'pg'))
    assert.equal((await store.project(p.id, 'test-owner')).files['README.md'], 'Saved')
  } finally {
    await store.close()
    rmSync(dir, { recursive: true, force: true })
  }
})
