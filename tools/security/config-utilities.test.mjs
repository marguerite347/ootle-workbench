import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
const require = createRequire(import.meta.url)

test('TOML formatter settings retain values and reject invalid or unsafe values', () => {
  const toml = require('toml')
  const parsed = toml.parse('printWidth = 100\nuseTabs = false\nplugins = ["solidity"]')
  assert.deepEqual({ ...parsed }, { printWidth: 100, useTabs: false, plugins: ['solidity'] })
  assert.throws(() => toml.parse('printWidth = [broken'))
  assert.throws(() => toml.parse('printWidth = 9223372036854775807'), /lossless/)
  // The parser uses null-prototype tables, including adversarial property names.
  const special = toml.parse('[__proto__]\npolluted = true')
  assert.equal(Object.getPrototypeOf(special), null)
  assert.equal({}.polluted, undefined)
})

test('terminal HTML beautification preserves text, entities and element structure', () => {
  const output = require('js-beautify').html('<div><span>one &amp; two</span><b>three</b></div>', { indent_size: 2 })
  assert.equal(output.replace(/>\s+</g, '><'), '<div><span>one &amp; two</span><b>three</b></div>')
})

test('source-map extraction retains the configured relative source root', () => {
  const dir = fs.mkdtempSync(path.resolve('.source-map-test-'))
  try {
    const map = { version: 3, sources: ['source.js'], names: [], mappings: 'AAAA' }
    const input = 'console.log(3);\n//# sourceMappingURL=data:application/json;base64,' + Buffer.from(JSON.stringify(map)).toString('base64')
    const run = spawnSync(process.execPath, [require.resolve('exorcist/bin/exorcist.js'), '--root', '../', path.join(dir, 'output.map')], { input, encoding: 'utf8' })
    assert.equal(run.status, 0, run.stderr)
    const external = JSON.parse(fs.readFileSync(path.join(dir, 'output.map')))
    assert.deepEqual(external.sources, ['source.js'])
    assert.equal(external.sourceRoot, '../')
    assert.match(run.stdout, /console\.log\(3\)/)
    assert.match(run.stdout, /sourceMappingURL=.*output.map/)
    assert.ok(!run.stdout.includes('base64,'))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
