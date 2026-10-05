import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import pg from 'pg'
export const random = () => randomBytes(32).toString('base64url')
export const hash = (value) => createHash('sha256').update(value).digest('hex')
export const now = () => Math.floor(Date.now() / 1000)
export class Problem extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
const textFile = /(?:\.(?:rs|toml|lock|md|txt|json|ts|tsx|js|jsx|mjs|cjs|css|html|yaml|yml|svg)|^(?:Dockerfile|LICENSE|Makefile|\.gitignore))$/i
export function validateFiles(files) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) throw new Problem(400, 'Expected a file map.')
  const entries = Object.entries(files)
  if (!entries.length || entries.length > 300) throw new Problem(400, 'Share between 1 and 300 text files.')
  let bytes = 0
  for (const [path, content] of entries) {
    if (!textFile.test(path.split('/').pop()) || path.length > 240 || !/^[a-zA-Z0-9_.@ /-]+$/.test(path) || path.startsWith('/') || path.split('/').some((p) => !p || p === '.' || p === '..' || /^(\.git|node_modules|target|\.deps|\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx))$/i.test(p))) throw new Problem(400, `File cannot be shared: ${path.slice(0, 240)}`)
    if (typeof content !== 'string' || content.includes('\0')) throw new Problem(400, 'Only UTF-8 text files can be shared.')
    bytes += Buffer.byteLength(content)
  }
  if (bytes > 3 * 1024 * 1024) throw new Problem(413, 'Workspace exceeds 3 MiB.')
  return files
}
export class Store {
  constructor(database) {
    this.db = database
    this.context = new AsyncLocalStorage()
  }
  static async embedded(directory) {
    const { PGlite } = await import('@electric-sql/pglite')
    const db = new PGlite(directory)
    await db.exec(await readFile(new URL('./migrations/001_agent_service.sql', import.meta.url), 'utf8'))
    await db.exec(await readFile(new URL('./migrations/002_connection_duration.sql', import.meta.url), 'utf8'))
    return new Store(db)
  }
  static postgres(connectionString) {
    return new Store(new pg.Pool({ connectionString, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000, ssl: { rejectUnauthorized: true, ca: readFileSync(new URL('./certs/supabase-ca.crt', import.meta.url), 'utf8') } }))
  }
  async query(sql, values = []) {
    return (this.context.getStore() || this.db).query(sql, values)
  }
  async close() {
    if (this.db.end) await this.db.end()
    else await this.db.close()
  }
  async transaction(fn) {
    if (this.context.getStore()) return fn()
    if (this.db.transaction) return this.db.transaction((tx) => this.context.run(tx, fn))
    const client = await this.db.connect()
    try {
      await client.query('BEGIN')
      const result = await this.context.run(client, fn)
      await client.query('COMMIT')
      return result
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
  async put(kind, id, value, expires = null) {
    await this.query('INSERT INTO ootle_agents.records VALUES($1,$2,$3,$4) ON CONFLICT(kind,id) DO UPDATE SET value=EXCLUDED.value,expires=EXCLUDED.expires', [kind, id, JSON.stringify(value), expires])
  }
  async get(kind, id) {
    const row = (await this.query('SELECT value,expires FROM ootle_agents.records WHERE kind=$1 AND id=$2', [kind, id])).rows[0]
    return row && (!row.expires || Number(row.expires) > now()) ? row.value : undefined
  }
  async delete(kind, id) {
    await this.query('DELETE FROM ootle_agents.records WHERE kind=$1 AND id=$2', [kind, id])
  }
  async take(kind, id) {
    const row = (await this.query('DELETE FROM ootle_agents.records WHERE kind=$1 AND id=$2 RETURNING value,expires', [kind, id])).rows[0]
    return row && (!row.expires || Number(row.expires) > now()) ? row.value : undefined
  }
  async lock(kind, id) {
    await this.query('SELECT id FROM ootle_agents.records WHERE kind=$1 AND id=$2 FOR UPDATE', [kind, id])
  }
  async cleanup() {
    await this.query('DELETE FROM ootle_agents.records WHERE expires IS NOT NULL AND expires <= $1', [now()])
    await this.query('DELETE FROM ootle_agents.activity WHERE at < $1', [now() - 90 * 86400])
  }
  async count(kind) {
    return Number((await this.query('SELECT COUNT(*) AS n FROM ootle_agents.records WHERE kind=$1', [kind])).rows[0].n)
  }
  async session(user) {
    const token = random(),
      csrf = random()
    await this.put('session', hash(token), { user, csrf }, now() + 8 * 3600)
    return { token, csrf }
  }
  async projects(owner) {
    return (await this.query('SELECT id,name,version FROM ootle_agents.projects WHERE owner=$1 ORDER BY name', [owner])).rows
  }
  async project(id, owner) {
    const row = (await this.query('SELECT * FROM ootle_agents.projects WHERE id=$1 AND owner=$2', [id, owner])).rows[0]
    if (!row) throw new Problem(404, 'Project not found.')
    return row
  }
  async createProject(owner, name, files) {
    validateFiles(files)
    if (typeof name !== 'string' || !name.trim() || name.length > 100) throw new Problem(400, 'Use a project name of 1–100 characters.')
    return this.transaction(async () => {
      await this.query('SELECT pg_advisory_xact_lock(hashtext($1))', [owner])
      if ((await this.projects(owner)).length >= 20) throw new Problem(409, 'Account limit: 20 shared workspaces.')
      const id = randomUUID()
      await this.query('INSERT INTO ootle_agents.projects VALUES($1,$2,$3,1,$4)', [id, owner, name.trim(), JSON.stringify(files)])
      await this.log(owner, id, 'You', 'Shared workspace')
      return this.project(id, owner)
    })
  }
  async updateProject(id, owner, version, files, agent = 'You') {
    validateFiles(files)
    if (!Number.isSafeInteger(version) || version < 1) throw new Problem(400, 'Expected the current workspace version.')
    return this.transaction(async () => {
      await this.project(id, owner)
      const result = await this.query('UPDATE ootle_agents.projects SET files=$1,version=version+1 WHERE id=$2 AND owner=$3 AND version=$4 RETURNING *', [JSON.stringify(files), id, owner, version])
      if (!result.rows.length) throw new Problem(409, 'Workspace changed. Review the latest version before saving; your edits have not been applied.')
      await this.log(owner, id, agent, 'Updated workspace')
      return result.rows[0]
    })
  }
  async grant(owner, project, client, name, scopes) {
    await this.project(project, owner)
    await this.query('SELECT pg_advisory_xact_lock(hashtext($1))', [owner])
    if ((await this.grants(owner)).filter((g) => !g.revoked && (g.expires === null || g.expires > now())).length >= 50) throw new Problem(409, 'Disconnect an existing agent before adding more.')
    const id = randomUUID()
    await this.query('INSERT INTO ootle_agents.grants VALUES($1,$2,$3,$4,$5,$6,$7,$8,NULL)', [id, owner, project, client, name.slice(0, 100), JSON.stringify(scopes), now(), null])
    await this.log(owner, project, name, 'Authorized')
    return id
  }
  async getGrant(id) {
    return (await this.query('SELECT * FROM ootle_agents.grants WHERE id=$1 AND revoked IS NULL AND (expires IS NULL OR expires>$2)', [id, now()])).rows[0]
  }
  async grants(owner) {
    return (await this.query('SELECT g.*,p.name AS "projectName" FROM ootle_agents.grants g JOIN ootle_agents.projects p ON p.id=g.project WHERE g.owner=$1 ORDER BY g.created DESC', [owner])).rows
  }
  // Explicit owner-scoped migration: never revive expired or revoked connections.
  async keepConnectionsUntilDisconnected(owner) {
    return this.transaction(async () => {
      const changed = await this.query('UPDATE ootle_agents.grants SET expires=NULL WHERE owner=$1 AND revoked IS NULL AND expires>$2 RETURNING id,project,name', [owner, now()])
      await this.query(
        `UPDATE ootle_agents.records r SET expires=NULL FROM ootle_agents.grants g
        WHERE r.kind='refresh' AND r.value->>'grant'=g.id AND g.owner=$1
        AND g.revoked IS NULL AND g.expires IS NULL AND r.expires>$2`,
        [owner, now()],
      )
      const provider = await this.query(
        `UPDATE ootle_agents.records SET expires=NULL, value=jsonb_set(value,'{expires}','null'::jsonb)
        WHERE kind='openrouter-key' AND id=$1 AND expires>$2 RETURNING id`,
        [owner, now()],
      )
      for (const grant of changed.rows) await this.log(owner, grant.project, grant.name, 'Connection duration changed to until disconnected')
      return { agents: changed.rows.length, openrouter: provider.rows.length }
    })
  }
  async revoke(id, owner) {
    const g = (await this.query('UPDATE ootle_agents.grants SET revoked=$1 WHERE id=$2 AND owner=$3 RETURNING *', [now(), id, owner])).rows[0]
    if (!g) throw new Problem(404, 'Connection not found.')
    await this.log(owner, g.project, g.name, 'Disconnected')
  }
  async log(owner, project, agent, action) {
    await this.query('INSERT INTO ootle_agents.activity(owner,project,agent,action,at) VALUES($1,$2,$3,$4,$5)', [owner, project, agent, action, now()])
  }
  async activity(owner) {
    return (await this.query('SELECT project,agent,action,at FROM ootle_agents.activity WHERE owner=$1 ORDER BY id DESC LIMIT 40', [owner])).rows
  }
}
