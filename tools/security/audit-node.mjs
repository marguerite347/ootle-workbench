// Reproducible locked-version advisory inventory; advisory presence alone is not reachability.
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { parse } = require('@yarnpkg/lockfile')
const lock = parse(await readFile('yarn.lock', 'utf8')).object
const versions = {}
for (const [selector, entry] of Object.entries(lock)) {
  const name = selector.slice(0, selector.indexOf('@', 1))
  if (!name || !entry.version) continue
  ;(versions[name] ||= new Set()).add(entry.version)
}
const response = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(Object.entries(versions).map(([name, values]) => [name, [...values]]))) })
if (!response.ok) throw new Error(`Advisory lookup failed: ${response.status}`)
const advisories = await response.json()
const report = { checkedAt: new Date().toISOString(), source: 'npm bulk advisory API', lockedPackages: Object.keys(versions).length, affectedPackageNames: Object.keys(advisories).length, reachability: 'Inventory only; see SECURITY_REMEDIATION.md for exposure and disposition.', advisories }
await writeFile(process.argv[2] || 'docs/ootle/security/node-advisories.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ lockedPackages: report.lockedPackages, affectedPackageNames: report.affectedPackageNames }))
for (const [name, items] of Object.entries(advisories)) console.log(name, [...versions[name]].join(','), items.map(a => `${a.severity}:${a.vulnerable_versions}`).join(' | '))
