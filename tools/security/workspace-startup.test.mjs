import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

test('Home file navigation reveals a hidden panel and keeps an open panel open', async () => {
  const source = await readFile('apps/remix-ide/src/app/plugins/ootle/home-navigation.ts', 'utf8')
  const context = { exports: {} }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context)
  for (const initiallyHidden of [true, false]) {
    let hidden = initiallyHidden; let selected; let toggles = 0
    const plugin = { call: async (name, method, value) => {
      if (name === 'menuicons' && method === 'select') { selected = value; return }
      if (name === 'sidePanel' && method === 'isPanelHidden') return hidden
      if (name === 'sidePanel' && method === 'togglePanel') { hidden = !hidden; toggles++; return }
      throw new Error(`Unexpected call: ${name}.${method}`)
    } }
    await context.exports.openFileExplorer(plugin)
    assert.equal(selected, 'filePanel')
    assert.equal(hidden, false)
    assert.equal(toggles, initiallyHidden ? 1 : 0)
  }
  await assert.rejects(context.exports.openFileExplorer({ call: async () => { throw new Error('Plugin unavailable') } }), /Plugin unavailable/)
})

test('early workspace reads wait without entering the operation queue and then return saved workspaces', async () => {
  const source = await readFile('libs/remix-ui/workspace/src/lib/actions/workspace.ts', 'utf8')
  const declarations = source.slice(source.indexOf('let plugin: any'), source.indexOf('\ntype WorkspaceActionCallback'))
  const initialize = source.slice(source.indexOf('export const setPlugin ='), source.indexOf('\nexport const addInputField ='))
  const read = source.slice(source.indexOf('export const getWorkspaces ='), source.indexOf('\nexport const cloneRepository ='))
  const compiled = ts.transpileModule(`${declarations}\n${initialize}\n${read}`, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const errors = []; let queueCalls = 0; let scans = 0; let saved
  const context = { exports: {}, console: { error: (...args) => errors.push(args) }, cloudStore: { isCloudMode: false }, workspaceOperationQueue: { run: fn => { queueCalls++; return fn() } }, checkGit() {}, getGitConfig() {} }
  vm.runInNewContext(compiled, context)
  const first = context.exports.getWorkspaces(); const second = context.exports.getWorkspaces()
  await Promise.resolve()
  assert.equal(queueCalls, 0); assert.equal(scans, 0)
  context.exports.setPlugin({ on() {}, isGist: () => null, setWorkspaces: async value => { saved = value }, fileProviders: { workspace: { workspacesPath: '.workspaces' }, browser: { resolveDirectory: (path, cb) => { scans++; cb(null, { '.workspaces/My_Saved_Work': { isDirectory: true } }) }, exists: async () => false } } }, () => {})
  const results = await Promise.all([first, second])
  assert.equal(results[0][0].name, 'My_Saved_Work'); assert.equal(results[1][0].name, 'My_Saved_Work')
  assert.equal(saved[0].name, 'My_Saved_Work'); assert.equal(scans, 2); assert.equal(errors.length, 0)
  assert.equal((await context.exports.getWorkspaces())[0].name, 'My_Saved_Work')
})

test('Home with no selected file is quiet while unexpected file errors remain visible', async () => {
  const source = await readFile('apps/remix-ide/src/app/panels/tab-proxy.js', 'utf8')
  const start = source.indexOf("    try {\n      const currentFile = await this.call('fileManager', 'getCurrentFile')")
  const body = source.slice(start, source.indexOf('\n    this.renderComponent()', start))
  const errors = []; const checked = []
  const run = vm.runInNewContext(`(async function () {${body}})`, { console: { error: (...args) => errors.push(args) } })
  await run.call({ call: async () => { throw new Error('Error: No such file or directory No file selected') } })
  assert.equal(errors.length, 0)
  await run.call({ call: async () => { throw new Error('IndexedDB storage failure') } })
  assert.equal(errors.length, 1); assert.match(errors[0][1].message, /IndexedDB storage failure/)
  await run.call({ call: async () => { throw new Error('Storage failed for path No file selected') } })
  assert.equal(errors.length, 2)
  await run.call({ call: async () => 'src/lib.rs', checkIfCanRunScenario: async path => checked.push(path) })
  assert.deepEqual(checked, ['src/lib.rs'])
})
