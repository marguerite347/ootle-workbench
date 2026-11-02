import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function assertRustAudit(report) {
  if (!report?.vulnerabilities || !report?.warnings) throw new Error('Incomplete cargo-audit report')
  const findings = [...(report.vulnerabilities.list || []), ...(report.warnings.unsound || [])]
  if (report.vulnerabilities.found || report.vulnerabilities.count > 0 || findings.length) {
    throw new Error(`Rust vulnerabilities or unsound dependencies: ${findings.map(item => item.advisory?.id || item.package?.name || 'unknown').join(', ')}`)
  }
  return Object.entries(report.warnings).flatMap(([kind, items]) => items.map(item => `${kind}: ${item.advisory?.id} (${item.package?.name})`))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const warnings = assertRustAudit(JSON.parse(readFileSync(process.argv[2], 'utf8')))
  console.log('No Rust vulnerability or unsoundness findings.')
  for (const warning of warnings) console.log(`Remaining advisory: ${warning}`)
}
