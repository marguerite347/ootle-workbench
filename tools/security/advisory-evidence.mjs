import { createHash } from 'node:crypto'

export function assertCurrentAdvisories(report, lockText, now = Date.now()) {
  const checkedAt = Date.parse(report?.checkedAt)
  if (!Number.isFinite(checkedAt) || checkedAt > now + 60_000 || now - checkedAt > 24 * 60 * 60_000) {
    throw new Error('Advisory evidence must be checked within the last 24 hours')
  }
  const lockSha256 = createHash('sha256').update(lockText).digest('hex')
  if (report.lockSha256 !== lockSha256) throw new Error('Advisory evidence does not match the current lockfile')
  if (!report.advisories || Array.isArray(report.advisories) || typeof report.advisories !== 'object') {
    throw new Error('Advisory evidence must contain the API advisory inventory')
  }
  return lockSha256
}
