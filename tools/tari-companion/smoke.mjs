// Real Cargo/HTTP smoke test. Unit fixtures are deliberately separate in server.test.mjs.
import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomBytes, createHash } from 'node:crypto'
import { createCompanion } from './server.mjs'
import { companionRequest } from '../../apps/remix-ide/src/app/plugins/ootle/companion-protocol.mjs'

const root = await realpath(await mkdtemp(join(tmpdir(), 'ootle-cargo-smoke-')))
const origin = 'http://127.0.0.1:8080'
const token = randomBytes(32).toString('hex')
const files = JSON.parse(await readFile('libs/remix-ws-templates/src/templates/tariCounter/files.json', 'utf8'))
const server = createCompanion({ token, origins: [origin], root, allowRun: true, approve: async ({ digest }) => { console.log('CI fixture authorizes only the checked-in Counter snapshot:', digest); return true } })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
try {
  const request = (path, body) => companionRequest(`http://127.0.0.1:${server.address().port}`, token, origin, path, body, (url, init) => fetch(url, { ...init, headers: { ...init.headers, Origin: origin } }))
  const approval = await request('/approve', { action: 'build', files })
  const result = await request('/run', { approvalToken: approval.approvalToken })
  assert.equal(result.success, true, result.output)
  assert.equal(result.exitCode, 0)
  assert.ok(result.artifacts.length)
  for (const artifact of result.artifacts) {
    const bytes = Buffer.from(artifact.base64, 'base64')
    assert.equal(createHash('sha256').update(bytes).digest('hex'), artifact.sha256)
    assert.equal(bytes.length, artifact.size)
    assert.equal(WebAssembly.validate(bytes), true)
    console.log(JSON.stringify({ name: artifact.name, size: bytes.length, sha256: artifact.sha256, sourceDigest: result.sourceDigest }))
  }
} finally {
  await new Promise(resolve => server.close(resolve))
  await rm(root, { recursive: true, force: true })
}
