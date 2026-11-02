import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import Module, { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '../..')

test('minify command retains inline source maps and JavaScript behavior', () => {
  const script = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).scripts.minify
  const [, ...args] = script.split(' ')
  const sourceMap = { version: 3, sources: ['original.ts'], names: [], mappings: 'AAAA', sourcesContent: ['console.log(17 + 20)'] }
  const input = `console.log(17 + 20);\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(sourceMap)).toString('base64')}`
  const run = spawnSync(process.execPath, [require.resolve('uglify-js/bin/uglifyjs'), ...args], { input, encoding: 'utf8', cwd: root })
  assert.equal(run.status, 0, run.stderr)
  const logged = []
  vm.runInNewContext(run.stdout, { console: { log: value => logged.push(value) } })
  assert.deepEqual(logged, [37])
  const map = JSON.parse(Buffer.from(run.stdout.split('base64,')[1].trim(), 'base64'))
  assert.deepEqual(map.sources, ['original.ts'])
  assert.ok(map.mappings)
  const invalid = spawnSync(process.execPath, [require.resolve('uglify-js/bin/uglifyjs'), ...args], { input: 'function (', encoding: 'utf8' })
  assert.notEqual(invalid.status, 0)
})

test('Remix hashing keeps Keccak widths, known vector and input validation', () => {
  const filename = path.join(root, 'libs/remix-lib/src/hash.ts')
  const ts = require('typescript')
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const loaded = new Module(filename)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded._compile(code, filename)
  const hash = loaded.exports
  assert.equal(Buffer.from(hash.keccak256(Buffer.alloc(0))).toString('hex'), 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
  for (const bits of [224, 256, 384, 512]) {
    assert.equal(hash.keccakFromString('abc', bits).length, bits / 8)
    assert.deepEqual(hash.keccakFromString('abc', bits), hash.keccakFromHexString('0x616263', bits))
    assert.deepEqual(hash.keccakFromArray([97, 98, 99], bits), hash.keccakFromString('abc', bits))
  }
  assert.throws(() => hash.keccakFromString(42), /only supports strings/)
  assert.throws(() => hash.keccak(Buffer.alloc(0), 128), /Invalid algorithm/)
})
