import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { assertCurrentAdvisories } from './advisory-evidence.mjs'

const now = Date.parse('2026-11-18T16:30:00Z')
const lock = 'locked-dependency@1.0.0:\n  version "1.0.0"\n'
const report = {
  checkedAt: new Date(now).toISOString(),
  lockSha256: createHash('sha256').update(lock).digest('hex'),
  advisories: {}
}

test('accepts a current empty advisory inventory for the exact lockfile', () => {
  assert.equal(assertCurrentAdvisories(report, lock, now), report.lockSha256)
})
test('rejects stale, missing and future timestamps', () => {
  for (const checkedAt of [undefined, 'invalid', '2026-10-29T16:30:00Z', '2026-11-19T16:30:00Z']) {
    assert.throws(() => assertCurrentAdvisories({ ...report, checkedAt }, lock, now), /24 hours/)
  }
})
test('rejects evidence from a different lockfile or without a lock identity', () => {
  assert.throws(() => assertCurrentAdvisories(report, `${lock}changed`, now), /lockfile/)
  assert.throws(() => assertCurrentAdvisories({ ...report, lockSha256: undefined }, lock, now), /lockfile/)
})
test('rejects missing or malformed inventory instead of treating it as no findings', () => {
  for (const advisories of [undefined, null, [], 'unavailable']) {
    assert.throws(() => assertCurrentAdvisories({ ...report, advisories }, lock, now), /inventory/)
  }
})
