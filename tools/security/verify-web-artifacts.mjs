import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const root = process.argv[2] || 'dist/apps/remix-ide'
const manifest = JSON.parse(await readFile(`${root}/assets/ootle/checksums.json`, 'utf8'))
for (const item of manifest.files) {
  assert.ok(!item.path.includes('..') && !item.path.startsWith('/'))
  const bytes = await readFile(`${root}/${item.path}`)
  assert.equal(bytes.length, item.bytes, item.path)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256, item.path)
}
console.log(`Verified ${manifest.files.length} static files from ${manifest.revision}`)
