import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
const read = path => readFile(path, 'utf8')
test('denied file permission does not reach the file provider', async () => {
  const source = await read('apps/remix-ide/src/app/files/fileManager.ts')
  const method = source.slice(source.indexOf('  async setFileContent('), source.indexOf('\n  _setFileInternal(')).replace('options?', 'options')
  const subject = vm.runInNewContext(`({${method}})`, { createError: e => Object.assign(new Error(e.message), e) })
  let writes = 0
  Object.assign(subject, { currentRequest: { from: 'external' }, askUserPermission: async () => false, _setFileInternal: async () => { writes++ } })
  await assert.rejects(subject.setFileContent('build.rs', 'evil'), /permission denied/)
  assert.equal(writes, 0)
  subject.askUserPermission = async () => true
  await subject.setFileContent('src/lib.rs', 'approved'); assert.equal(writes, 1)
})
test('bootstrap has no arbitrary URL-call dispatcher or upstream services', async () => {
  const source = await read('apps/remix-ide/src/app.ts')
  assert.doesNotMatch(source, /this\.params\.calls?\b/)
  for (const name of ['auth', 'invitationManager', 'membershipRequest', 'notificationCenter', 'feedback']) assert.equal(source.includes(`activatePlugin(['${name}'])`), false)
  const index = await read('apps/remix-ide/src/index.html')
  assert.doesNotMatch(index, /<script[^>]+src=["']https?:/)
})
test('terminal renders object-valued HTML as text and deployed CSP restricts scripts and frames', async () => {
  const source = await read('libs/remix-ui/terminal/src/lib/remix-ui-terminal.tsx')
  assert.doesNotMatch(source, /parse\(msg\.value\)/)
  const config = JSON.parse(await read('vercel.json'))
  const csp = config.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value
  assert.match(csp, /frame-src 'none'/); assert.match(csp, /frame-ancestors 'none'/)
  assert.doesNotMatch(csp, /script-src[^;]*(?:'unsafe-inline'|'unsafe-eval'|https:)/)
  assert.match(config.installCommand, /--ignore-scripts/)
})
