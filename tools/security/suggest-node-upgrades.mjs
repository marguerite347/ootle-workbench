// Plan compatible fixes per parent, including packages installed on several major lines.
// This does not apply changes or claim that a semver-compatible upgrade is tested.
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const semver = require('semver')
const { parse } = require('@yarnpkg/lockfile')
const lock = parse(await readFile('yarn.lock', 'utf8')).object
const report = JSON.parse(await readFile(process.argv[2] || 'docs/ootle/security/node-advisories-followup.json', 'utf8'))
const packageName = selector => selector.slice(0, selector.indexOf('@', 1))
const line = version => `${semver.major(version)}${semver.major(version) === 0 ? '.' + semver.minor(version) : ''}`
const suggestions = {}, deferred = {}
for (const [name, advisories] of Object.entries(report.advisories)) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`)
  if (!response.ok) throw new Error(`Registry lookup failed for ${name}`)
  const data = await response.json()
  const safe = Object.keys(data.versions).filter(v => semver.valid(v) && !semver.prerelease(v) && !advisories.some(a => semver.satisfies(v, a.vulnerable_versions)) && !data.versions[v].deprecated).sort(semver.rcompare)
  const parents = new Map()
  for (const [selector, entry] of Object.entries(lock)) {
    const range = { ...entry.dependencies, ...entry.optionalDependencies }[name]
    if (!range) continue
    const child = lock[`${name}@${range}`]
    if (!child) throw new Error(`Missing lock entry: ${name}@${range}`)
    const parent = packageName(selector)
    if (!parents.has(parent)) parents.set(parent, new Set())
    parents.get(parent).add(child.version)
  }
  for (const [parent, versions] of parents) {
    if (![...versions].some(v => advisories.some(a => semver.satisfies(v, a.vulnerable_versions)))) continue
    const lines = new Set([...versions].map(line))
    const key = `**/${parent}/${name}`
    const target = lines.size === 1 && safe.find(v => line(v) === [...lines][0] && [...versions].every(current => semver.gte(v, current)))
    if (target) suggestions[key] = target
    else deferred[key] = { installed: [...versions], reason: lines.size > 1 ? 'Parent has multiple compatibility lines; requires parent-specific migration' : 'No advisory-free compatible release', latestSafe: safe[0] || null }
  }
}
const plan = { checkedAt: new Date().toISOString(), suggestions, deferred }
await writeFile('docs/ootle/security/node-upgrade-followup-plan.json', JSON.stringify(plan, null, 2) + '\n')
console.log(JSON.stringify({ compatibleParentOverrides: Object.keys(suggestions).length, pathsRequiringAssessment: Object.keys(deferred).length }))
