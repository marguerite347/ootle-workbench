const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  path = require('node:path')
const wb = path.resolve(__dirname, '../..')
const ts = require(path.join(wb, 'node_modules/typescript'))
require('node:test')('compiler and build tools retain actual integration behavior', async () => {
  const solc = require('solc')
  const content = fs.readFileSync(path.join(wb, 'libs/remix-tests/tests/examples_1/simple_storage.sol'), 'utf8')
  const result = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'simple_storage.sol': { content } }, settings: { evmVersion: 'cancun', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'], '': ['ast'] } } } })))
  assert.equal((result.errors || []).filter((e) => e.severity === 'error').length, 0, JSON.stringify(result.errors))
  assert.ok(Object.values(result.contracts['simple_storage.sol'])[0].evm.bytecode.object.length > 0)
  assert.ok(result.sources['simple_storage.sol'].ast.nodes.length)
  console.log('PASS solc', solc.version(), 'existing storage source: ABI bytecode AST')
  const js = ts.transpileModule(fs.readFileSync(path.join(wb, 'libs/remix-ui/quick-dapp-v2/src/lib/InBrowserVite.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  for (const pkg of ['esbuild', 'esbuild-wasm']) {
    const exp = {}
    vm.runInThisContext('(function(exports) {' + js + '\n})')(exp)
    const compiler = new exp.InBrowserVite()
    compiler.esbuild = require(pkg)
    compiler.initialized = true
    const map = new Map([
      ['/frontend/src/main.tsx', 'import React from "react"; import { value } from "./value.ts"; import "./style.css"; export default <div>{value}</div>;'],
      ['/frontend/src/value.ts', 'export const value: number = 42;'],
      ['/frontend/src/style.css', 'div { color: lime; }'],
    ])
    const out = await compiler.build(map, '/frontend/src/main.tsx', '/frontend')
    assert.ok(out.success, out.error)
    assert.match(out.js, /42/)
    assert.match(out.js, /react@18.2.0/)
    assert.match(out.js, /color: lime/)
    const fail = await compiler.build(new Map([['/index.ts', 'import "./missing.ts"']]))
    assert.equal(fail.success, false)
    assert.match(fail.error, /missing/)
    console.log('PASS', pkg, 'actual in-memory TSX/CSS/import plugin success and failure')
    require(pkg).stop()
  }
  const gulp = require('gulp')
  vm.runInNewContext(fs.readFileSync(path.join(wb, 'gulpfile.js'), 'utf8'), {
    require(id) {
      if (id === 'gulp') return gulp
      if (id === './package.json') return require(path.join(wb, 'package.json'))
      if (id === 'axios') return require(path.join(wb, 'node_modules/axios/dist/node/axios.cjs'))
      if (id === 'child_process')
        return {
          exec() {
            throw Error('Task execution forbidden in registration trial')
          },
        }
      return require(id)
    },
    __dirname: wb,
    console,
    process,
  })
  assert.equal(Object.keys(gulp.registry().tasks()).length, 6)
  console.log('PASS gulp actual six tasks registered; task bodies never executed')
  const { Linter } = require(path.join(wb, 'node_modules/eslint'))
  const linter = new Linter()
  const hooks = require('eslint-plugin-react-hooks')
  linter.defineRule('react-hooks/rules-of-hooks', hooks.rules['rules-of-hooks'])
  const messages = linter.verify('function Component({yes}) { if (yes) useState(1); return null }', { parserOptions: { ecmaVersion: 2020, sourceType: 'module' }, rules: { 'react-hooks/rules-of-hooks': 2 } })
  assert.ok(messages.some((m) => m.ruleId === 'react-hooks/rules-of-hooks'))
  console.log('PASS react-hooks rule with existing ESLint8 rejects conditional hook')
})
