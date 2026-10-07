import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
const out = 'dist/apps/remix-ide'
await mkdir(`${out}/assets/ootle`, { recursive: true })
await copyFile('LICENSE', `${out}/LICENSE`)
let revision = process.env.VERCEL_GIT_COMMIT_SHA || null
try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() } catch {}
await writeFile(`${out}/assets/ootle/build.json`, JSON.stringify({ repository: 'https://github.com/marguerite347/ootle-workbench', revision, upstream: 'Remix v2.6.5', builtAt: new Date().toISOString(), tari: { compiler: 'isolated hosted builds through the configured agent service; local companion optional', wallet: false, publicPublishing: false, assistant: 'external MCP agent authorization; optional local Ollama' } }, null, 2))

const serviceUrl = process.env.OOTLE_AGENT_SERVICE_URL || ''
if (serviceUrl && new URL(serviceUrl).origin !== serviceUrl) throw new Error('OOTLE_AGENT_SERVICE_URL must be an origin without a path')
await writeFile(`${out}/assets/ootle/agents.json`, JSON.stringify({ serviceUrl }))

// Reviewable content identity for the exact static deployment, including local script SRI.
const { readdir, readFile } = await import('node:fs/promises')
const { createHash } = await import('node:crypto')
const { join } = await import('node:path')
const digest = (bytes, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(bytes).digest(encoding)
let html = await readFile(`${out}/index.html`, 'utf8')
for (const match of [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]) {
  const src = match[1]
  if (/^(?:https?:)?\/\//.test(src) || src.includes('..')) throw new Error('Unexpected external script in static output')
  const integrity = `sha384-${digest(await readFile(join(out, src.replace(/^\//, ''))), 'sha384', 'base64')}`
  html = html.replace(match[0], match[0].replace(/ integrity="[^"]*"/g, '').replace(/ crossorigin="[^"]*"/g, '').replace(/>$/, ` integrity="${integrity}" crossorigin="anonymous">`))
}
await writeFile(`${out}/index.html`, html)
const entries = []
async function inventory(dir = '') {
  for (const file of await readdir(join(out, dir), { withFileTypes: true })) {
    const path = join(dir, file.name)
    if (file.isDirectory()) await inventory(path)
    else if (path !== 'assets/ootle/checksums.json') { const bytes = await readFile(join(out, path)); entries.push({ path, bytes: bytes.length, sha256: digest(bytes) }) }
  }
}
await inventory()
await writeFile(`${out}/assets/ootle/checksums.json`, JSON.stringify({ revision, node: process.version, yarnLockSha256: digest(await readFile('yarn.lock')), files: entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) }, null, 2))
