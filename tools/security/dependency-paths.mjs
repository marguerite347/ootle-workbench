// Evidence of installed dependency paths and main-bundle inclusion, not exploitability.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { parse } = require('@yarnpkg/lockfile'), semver = require('semver')
const lock = parse(await readFile('yarn.lock', 'utf8')).object
const root = JSON.parse(await readFile('package.json', 'utf8'))
const audit = JSON.parse(await readFile('docs/ootle/security/node-advisories-followup.json', 'utf8'))
const names = new Set()
let stats
try { stats = JSON.parse(await readFile('reports/security/browser-stats.json', 'utf8')) } catch (e) { if (e.code !== 'ENOENT') throw e }
if (!stats && process.argv.includes('--require-bundle')) throw new Error('Production webpack evidence is required')
function visit(modules, parentInChunk = false) {
  for (const module of modules || []) {
    const inChunk = parentInChunk || module.chunks?.length > 0
    if (inChunk) {
      const text = module.name || module.identifier || ''
      for (const match of text.matchAll(/node_modules\/(\@[^/]+\/[^/]+|[^/!]+)/g)) names.add(match[1])
    }
    visit(module.modules, inChunk)
  }
}
visit(stats?.modules)
const paths = new Map()
for (const group of ['dependencies', 'devDependencies']) {
  for (const [name, range] of Object.entries(root[group] || {})) {
    const queue = [[name, range, [`${group}:${name}`]]], seen = new Set()
    for (let i = 0; i < queue.length; i++) {
      const [name, range, trail] = queue[i], entry = lock[`${name}@${range}`]
      if (!entry) continue
      const key = `${name}@${entry.version}`
      if (seen.has(key)) continue
      seen.add(key)
      if (!paths.has(key)) paths.set(key, [])
      paths.get(key).push(trail)
      for (const [child, range] of Object.entries({ ...entry.dependencies, ...entry.optionalDependencies })) queue.push([child, range, [...trail, `${child}@${lock[`${child}@${range}`]?.version || range}`]])
    }
  }
}
const findings = []
for (const [name, advisories] of Object.entries(audit.advisories)) {
  const versions = [...new Set(Object.entries(lock).filter(([s, e]) => s.slice(0, s.indexOf('@', 1)) === name && advisories.some(a => semver.satisfies(e.version, a.vulnerable_versions))).map(([, e]) => e.version))]
  findings.push({ name, versions, mainBundlePackagePresent: stats ? names.has(name) : null, advisories: advisories.map(a => ({ url: a.url, title: a.title, severity: a.severity })), paths: Object.fromEntries(versions.map(v => [v, paths.get(`${name}@${v}`) || []])) })
}
await mkdir('reports/security', { recursive: true })
await writeFile('reports/security/dependency-paths.json', JSON.stringify({ checkedAt: new Date().toISOString(), advisoryCheckedAt: audit.checkedAt, scope: 'Lockfile paths plus package presence in the emitted main webpack bundle. Presence is not vulnerable-call reachability; absence does not cover copied static plugin applications or developer tooling.', bundleEvidenceAvailable: !!stats, findings }, null, 2) + '\n')
console.log(JSON.stringify({ assessedPackageNames: findings.length, mainBundlePackageMatches: stats ? findings.filter(f => f.mainBundlePackagePresent).map(f => f.name) : null }))
