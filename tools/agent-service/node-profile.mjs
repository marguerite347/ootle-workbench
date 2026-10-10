import { Problem } from './store.mjs'

export const NODE_PROFILE = 'node-test-v1'
export function projectProfile(files, action) {
  if (!files['ootle-workbench.json']) return 'rust-wasm-v1'
  let config, pkg, lock
  try {
    config = JSON.parse(files['ootle-workbench.json'])
    if (config.profile !== NODE_PROFILE) throw new Error('unsupported profile')
    pkg = JSON.parse(files['package.json'])
    lock = JSON.parse(files['package-lock.json'])
  } catch { throw new Problem(400, 'Use profile node-test-v1 with valid package.json and package-lock.json.') }
  if (action !== 'test') throw new Problem(400, 'This Node profile supports tests only. App packaging and deployment are not available yet.')
  if (lock.lockfileVersion !== 3 || !lock.packages || !lock.packages['']) throw new Problem(400, 'Node tests require an npm v3 lockfile.')
  if (pkg.workspaces || Object.keys(files).some(p => /(^|\/)\.npmrc$/.test(p))) throw new Problem(400, 'Custom npm configuration and workspaces are not supported by this profile.')
  for (const [path, dep] of Object.entries(lock.packages)) {
    if (!path) continue
    if (dep.link || !dep.integrity || typeof dep.resolved !== 'string' || !dep.resolved.startsWith('https://registry.npmjs.org/')) throw new Problem(400, 'All dependencies must be integrity-pinned HTTPS npm registry packages.')
  }
  if (!Object.keys(files).some(p => /^test\/[^/]+\.test\.mjs$/.test(p))) throw new Problem(400, 'Add at least one test/*.test.mjs file.')
  return NODE_PROFILE
}

// Fixed command, bounded output, no package lifecycle scripts or user shell command.
export const nodeRunner = `import {spawn} from 'node:child_process';
import {readdirSync,writeFileSync} from 'node:fs';
let tail=Buffer.alloc(0);
const add=b=>{tail=Buffer.concat([tail,Buffer.from(b)]).subarray(-100000);writeFileSync('/tmp/ootle-build.log',tail)};
add('Workbench node-test-v1; runtime '+process.version+'; external network disabled during tests\\n');
const files=readdirSync('/vercel/project/test').filter(n=>n.endsWith('.test.mjs')).sort().map(n=>'test/'+n);
if(!files.length){add('No test files');process.exit(1)}
const p=spawn(process.execPath,['--experimental-wasm-modules','--test',...files],{cwd:'/vercel/project',env:{PATH:process.env.PATH,HOME:'/tmp',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
p.stdout.on('data',add);p.stderr.on('data',add);
p.on('error',e=>{add(e.message);process.exitCode=1});
p.on('close',code=>{process.exitCode=code===null?1:code});
`
