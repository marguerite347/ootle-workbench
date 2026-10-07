// Suggest only patch/minor overrides within a single currently-locked major (same minor for 0.x).
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url); const semver = require('semver'); const { parse } = require('@yarnpkg/lockfile')
const lock = parse(await readFile('yarn.lock', 'utf8')).object
const report = JSON.parse(await readFile('docs/ootle/security/node-advisories.json', 'utf8'))
const suggestions = {}; const deferred = {}
for (const [name, advisories] of Object.entries(report.advisories)) {
  const current = [...new Set(Object.entries(lock).filter(([s]) => s.slice(0, s.indexOf('@', 1)) === name).map(([,e]) => e.version))]
  const lines = new Set(current.map(v => `${semver.major(v)}${semver.major(v) === 0 ? '.' + semver.minor(v) : ''}`))
  if (lines.size !== 1) { deferred[name] = 'Multiple compatibility lines; requires parent upgrades'; continue }
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`)
  if (!response.ok) throw new Error(`Registry lookup failed for ${name}`)
  const data = await response.json()
  const valid = Object.keys(data.versions).filter(v => semver.valid(v) && !semver.prerelease(v) && `${semver.major(v)}${semver.major(v) === 0 ? '.' + semver.minor(v) : ''}` === [...lines][0] && !advisories.some(a => semver.satisfies(v, a.vulnerable_versions)) && !data.versions[v].deprecated).sort(semver.rcompare)
  if (valid.length) suggestions[name] = valid[0]; else deferred[name] = 'No advisory-free release in the installed compatibility line'
}
await writeFile('docs/ootle/security/node-upgrade-plan.json', JSON.stringify({ suggestions, deferred }, null, 2) + '\n')
console.log(JSON.stringify({ suggestions, deferred }, null, 2))
