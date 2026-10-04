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
