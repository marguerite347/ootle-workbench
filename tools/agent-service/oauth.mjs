import { InvalidClientMetadataError, InvalidGrantError, InvalidTokenError, InvalidScopeError, InvalidTargetError, InvalidRequestError } from '@modelcontextprotocol/sdk/server/auth/errors.js'
import { random, hash, now } from './store.mjs'
export const SCOPES = ['workspace:read', 'workspace:write', 'workspace:build']
export function provider(store, origin) {
  const resource = `${origin}/mcp`
  function checkResource(value) {
    if (value?.href !== resource) throw new InvalidTargetError('The resource must be this Workbench MCP endpoint.')
  }
  function checkScopes(scopes) {
    if (scopes.some((s) => !SCOPES.includes(s))) throw new InvalidScopeError('Unsupported permission.')
  }
  async function credential(kind, token, client) {
    const row = await store.get(kind, hash(token))
    if (!row || row.client !== client.client_id || !(await store.getGrant(row.grant))) throw new InvalidGrantError('Credential is expired, revoked or invalid.')
    return row
  }
  async function mint(grant) {
    const access = random(),
      refresh = random(),
      g = await store.getGrant(grant)
    if (!g) throw new InvalidGrantError('Connection no longer authorized.')
    const record = { grant, client: g.client, resource }
    await store.put('access', hash(access), { ...record, expiresAt: now() + 3600 }, now() + 3600)
    await store.put('refresh', hash(refresh), record, g.expires)
    return { access_token: access, refresh_token: refresh, token_type: 'Bearer', expires_in: 3600, scope: g.scopes.join(' ') }
  }
  return {
    clientsStore: {
      getClient: async (id) => await store.get('client', id),
      registerClient: async (client) => {
        if (client.token_endpoint_auth_method !== 'none') throw new InvalidClientMetadataError('Use a public client with PKCE (token_endpoint_auth_method: none).')
        if ((await store.count('client')) >= 10000) throw new InvalidClientMetadataError('Client registration capacity reached.')
        if (!client.redirect_uris?.length || client.redirect_uris.length > 10) throw new InvalidClientMetadataError('Register 1–10 redirect URLs.')
        for (const value of client.redirect_uris) {
          const url = new URL(value)
          if (url.username || url.password || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) throw new InvalidClientMetadataError('Redirects require HTTPS or HTTP loopback.')
        }
        if ((client.client_name || '').length > 100) throw new InvalidClientMetadataError('Client name too long.')
        const saved = { ...client, client_id: random(), client_id_issued_at: now(), token_endpoint_auth_method: 'none' }
        delete saved.client_secret
        await store.put('client', saved.client_id, saved)
        return saved
      },
    },
    authorize: async (client, params, res) => {
      checkResource(params.resource)
      const scopes = params.scopes?.length ? params.scopes : ['workspace:read']
      checkScopes(scopes)
      if (!/^[a-zA-Z0-9_-]{43}$/.test(params.codeChallenge)) throw new InvalidRequestError('Invalid S256 PKCE challenge.')
      const pending = random()
      await store.put('consent', hash(pending), { client: client.client_id, name: client.client_name || 'Unnamed MCP client', scopes, redirectUri: params.redirectUri, state: params.state, codeChallenge: params.codeChallenge, resource }, now() + 600)
      res.redirect(`/consent?request=${pending}`)
    },
    challengeForAuthorizationCode: async (client, code) => (await credential('code', code, client)).codeChallenge,
    exchangeAuthorizationCode: async (client, code, _verifier, redirectUri, requestedResource) => {
      checkResource(requestedResource)
      return await store.transaction(async () => {
        await store.lock('code', hash(code))
        const row = await credential('code', code, client)
        if (row.redirectUri !== redirectUri) throw new InvalidGrantError('Redirect URI mismatch.')
        await store.delete('code', hash(code))
        return await mint(row.grant)
      })
    },
    exchangeRefreshToken: async (client, token, scopes, requestedResource) => {
      checkResource(requestedResource)
      return (
        (await store.transaction(async () => {
          await store.lock('refresh', hash(token))
          const row = await store.get('refresh', hash(token))
          if (!row || row.client !== client.client_id) throw new InvalidGrantError('Invalid refresh token.')
          if (row.used) {
            const g = await store.getGrant(row.grant)
            if (g) await store.revoke(g.id, g.owner)
            // Return marker so revocation commits instead of rolling back with the error.
            return null
          }
          const valid = await credential('refresh', token, client),
            grant = await store.getGrant(valid.grant)
          if (scopes && scopes.some((s) => !grant.scopes.includes(s))) throw new InvalidScopeError('Cannot expand permissions during refresh.')
          if (scopes && scopes.join(' ') !== grant.scopes.join(' ')) throw new InvalidScopeError('Reconnect to change permissions.')
          await store.put('refresh', hash(token), { ...row, used: true }, grant.expires)
          return await mint(row.grant)
        })) || Promise.reject(new InvalidGrantError('Refresh token reuse; connection revoked.'))
      )
    },
    verifyAccessToken: async (token) => {
      const row = await store.get('access', hash(token)),
        grant = row && (await store.getGrant(row.grant))
      if (!grant || row.resource !== resource) throw new InvalidTokenError('Token is expired, revoked or invalid.')
      return { token, expiresAt: row.expiresAt, clientId: grant.client, scopes: grant.scopes, resource: new URL(resource), extra: { grant: grant.id, owner: grant.owner, project: grant.project, name: grant.name } }
    },
    revokeToken: async (client, request) => {
      const row = (await store.get('access', hash(request.token))) || (await store.get('refresh', hash(request.token)))
      const grant = row && (await store.getGrant(row.grant))
      if (grant && grant.client === client.client_id) await store.revoke(grant.id, grant.owner)
    },
  }
}
