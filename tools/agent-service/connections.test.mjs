import test from 'node:test'
import assert from 'node:assert/strict'
import { Store, hash, now } from './store.mjs'
import { provider } from './oauth.mjs'

async function fixture(t) {
  const store = await Store.embedded()
  t.after(() => store.close())
  const project = await store.createProject('alice', 'Counter', { 'README.md': 'unchanged' })
  return { store, project }
}

test('connections survive months, access tokens expire, refresh rotates, disconnect and replay still revoke', async (t) => {
  const { store, project } = await fixture(t)
  const auth = provider(store, 'https://workbench.example'),
    client = { client_id: 'test' },
    resource = new URL('https://workbench.example/mcp')
  const grant = await store.grant('alice', project.id, 'test', 'Cursor', ['workspace:read'])
  assert.equal((await store.getGrant(grant)).expires, null)
  await store.put('code', hash('code'), { grant, client: 'test', redirectUri: 'https://client.example' }, now() + 120)
  const tokens = await auth.exchangeAuthorizationCode(client, 'code', null, 'https://client.example', resource)
  assert.equal(tokens.expires_in, 3600)
  assert.equal((await store.query("SELECT expires FROM ootle_agents.records WHERE kind='refresh'")).rows[0].expires, null)
  const future = Date.now() + 180 * 86400000
  t.mock.method(Date, 'now', () => future)
  await store.cleanup()
  await assert.rejects(auth.verifyAccessToken(tokens.access_token), /expired/)
  const rotated = await auth.exchangeRefreshToken(client, tokens.refresh_token, undefined, resource)
  assert.deepEqual((await auth.verifyAccessToken(rotated.access_token)).scopes, ['workspace:read'])
  await assert.rejects(auth.exchangeRefreshToken(client, tokens.refresh_token, undefined, resource), /reuse/)
  await assert.rejects(auth.verifyAccessToken(rotated.access_token), /revoked/)
  const another = await store.grant('alice', project.id, 'test', 'Claude', ['workspace:read'])
  await store.revoke(another, 'alice')
  assert.equal(await store.getGrant(another), undefined)
})

test('duration migration preserves scopes, owner boundaries and expired/revoked credentials; it is idempotent', async (t) => {
  const { store, project } = await fixture(t)
  const active = await store.grant('alice', project.id, 'test', 'Cursor', ['workspace:read'])
  const revoked = await store.grant('alice', project.id, 'test', 'Old', ['workspace:read'])
  const expired = await store.grant('alice', project.id, 'test', 'Expired', ['workspace:read'])
  const other = await store.createProject('bob', 'Private', { 'README.md': 'private' })
  const bob = await store.grant('bob', other.id, 'test', 'Bob', ['workspace:read'])
  await store.query('UPDATE ootle_agents.grants SET expires=$1', [now() + 86400])
  await store.query('UPDATE ootle_agents.grants SET expires=$1 WHERE id=$2', [now() - 1, expired])
  await store.revoke(revoked, 'alice')
  await store.put('refresh', 'active', { grant: active }, now() + 86400)
  await store.put('refresh', 'used', { grant: active, used: true }, now() + 86400)
  await store.put('refresh', 'expired', { grant: active }, now() - 1)
  await store.put('access', 'access', { grant: active }, now() + 3600)
  await store.put('openrouter-key', 'alice', { value: 'encrypted', expires: now() + 86400 }, now() + 86400)
  await store.put('openrouter-key', 'bob', { value: 'encrypted', expires: now() + 86400 }, now() + 86400)
  assert.deepEqual(await store.keepConnectionsUntilDisconnected('alice'), { agents: 1, openrouter: 1 })
  assert.deepEqual(await store.keepConnectionsUntilDisconnected('alice'), { agents: 0, openrouter: 0 })
  assert.equal((await store.getGrant(active)).expires, null)
  assert.deepEqual((await store.getGrant(active)).scopes, ['workspace:read'])
  assert.equal(await store.getGrant(revoked), undefined)
  assert.equal(await store.getGrant(expired), undefined)
  assert.ok((await store.getGrant(bob)).expires > now())
  assert.equal((await store.get('openrouter-key', 'alice')).expires, null)
  assert.ok((await store.get('openrouter-key', 'bob')).expires > now())
  const future = Date.now() + 180 * 86400000
  t.mock.method(Date, 'now', () => future)
  await store.cleanup()
  assert.ok(await store.get('refresh', 'active'))
  assert.equal((await store.get('refresh', 'used')).used, true)
  assert.equal(await store.get('refresh', 'expired'), undefined)
  assert.equal(await store.get('access', 'access'), undefined)
  assert.ok(await store.get('openrouter-key', 'alice'))
  assert.equal((await store.project(project.id, 'alice')).version, 1)
})
