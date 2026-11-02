import test from 'node:test'
import assert from 'node:assert/strict'
import { assertRustAudit } from './rust-audit-gate.mjs'

test('an unsound warning fails even when cargo-audit reports zero vulnerabilities', () => {
  assert.throws(() => assertRustAudit({ vulnerabilities: { found: false, count: 0, list: [] }, warnings: { unsound: [{ advisory: { id: 'RUSTSEC-2026-0186' }, package: { name: 'memmap2' } }] } }), /RUSTSEC-2026-0186/)
})
test('unmaintained dependencies remain visible without being called vulnerabilities', () => {
  assert.deepEqual(assertRustAudit({ vulnerabilities: { found: false, count: 0, list: [] }, warnings: { unmaintained: [{ advisory: { id: 'RUSTSEC-2024-0436' }, package: { name: 'paste' } }] } }), ['unmaintained: RUSTSEC-2024-0436 (paste)'])
})
test('missing audit data and vulnerabilities fail', () => {
  assert.throws(() => assertRustAudit({}), /Incomplete/)
  assert.throws(() => assertRustAudit({ vulnerabilities: { found: true, count: 1, list: [] }, warnings: {} }), /vulnerabilities/)
})
