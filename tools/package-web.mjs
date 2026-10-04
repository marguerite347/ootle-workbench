import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
const out = 'dist/apps/remix-ide'
await mkdir(`${out}/assets/ootle`, { recursive: true })
await copyFile('LICENSE', `${out}/LICENSE`)
let revision = process.env.VERCEL_GIT_COMMIT_SHA || null
try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() } catch {}
await writeFile(`${out}/assets/ootle/build.json`, JSON.stringify({ repository: 'https://github.com/marguerite347/ootle-workbench', revision, upstream: 'Remix v2.6.5', builtAt: new Date().toISOString(), tari: { compiler: 'local companion required', wallet: false, publicPublishing: false, assistant: 'optional local Ollama; provider required' } }, null, 2))
