// Real Cargo/HTTP smoke test. Unit fixtures are deliberately separate in server.test.mjs.
import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomBytes, createHash } from 'node:crypto'
import { createCompanion } from './server.mjs'

const root = await mkdtemp(join(tmpdir(), 'ootle-cargo-smoke-'))
const token = randomBytes(32).toString('hex')
const files = Object.fromEntries(await Promise.all(['Cargo.toml', 'Cargo.lock', 'src/lib.rs', 'tests/counter.rs'].map(async name => [name, await readFile(resolve('templates/tari-counter', name), 'utf8')])))
const server = createCompanion({ token, origins: [], root, allowRun: true })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/run`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'build', files, trusted: true })
  })
  const result = await response.json()
  assert.equal(response.status, 200, JSON.stringify(result))
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
