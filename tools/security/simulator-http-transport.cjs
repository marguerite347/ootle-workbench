const fs = require('node:fs')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const assert = require('node:assert/strict')
const { once, EventEmitter } = require('node:events')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const rootRequire = createRequire(root + '/package.json')
const ts = rootRequire('typescript')
const express = rootRequire('express')
const WebSocket = require('ws')
let server
function trackedExpress() {
  const app = express()
  const listen = app.listen.bind(app)
  app.listen = (...args) => {
    server = listen(...args)
    return server
  }
  return app
}
Object.assign(trackedExpress, express)
class Provider extends EventEmitter {
  constructor() {
    super()
    this.Accounts = { accounts: {} }
  }
  async init() {}
  sendAsync(body, cb) {
    cb(null, { jsonrpc: '2.0', id: body.id, result: body.method === 'fixture_error' ? 'handled' : body.params })
  }
}
const source = fs.readFileSync(root + '/libs/remix-simulator/src/server.ts', 'utf8')
const built = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
const exported = {}
function scopedRequire(id) {
  if (id === './provider') return { Provider }
  if (id === './utils/logs') return { log: () => {}, error: () => {} }
  if (id === 'express') return trackedExpress
  if (id === 'express-ws')
    return function (app) {
      const result = rootRequire(id)(app)
      const listen = app.listen.bind(app)
      app.listen = (...args) => {
        server = listen(...args)
        return server
      }
      return result
    }
  if (id === 'body-parser') return rootRequire(id)
  return rootRequire(id)
}
vm.runInNewContext(built, { exports: exported, require: scopedRequire, console, process, Buffer, setTimeout, clearTimeout })
;(async () => {
  for (const rpc of [true, false]) {
    const app = new exported.Server()
    await app.start({ port: 0, ip: '127.0.0.1', rpc })
    if (!server.listening) await once(server, 'listening')
    const port = server.address().port
    try {
      assert.equal(await (await fetch(`http://127.0.0.1:${port}/`)).text(), 'Welcome to remix-simulator')
      const payload = { jsonrpc: '2.0', id: 7, method: 'fixture_echo', params: ['safe', 4] }
      if (rpc) {
        let response = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        assert.deepEqual(await response.json(), { jsonrpc: '2.0', id: 7, result: ['safe', 4] })
        response = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken' })
        assert.equal(response.status, 400)
      } else {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/`)
        await once(ws, 'open')
        ws.send(JSON.stringify(payload))
        const [message] = await once(ws, 'message')
        assert.deepEqual(JSON.parse(message.toString()), { jsonrpc: '2.0', id: 7, result: ['safe', 4] })
        ws.close()
        await once(ws, 'close')
      }
      console.log(JSON.stringify({ transport: rpc ? 'http' : 'websocket', status: 'pass', express: require('express/package.json').version, bodyParser: rootRequire('body-parser/package.json').version, expressWs: require('express-ws/package.json').version, scope: 'Actual Server.start with synthetic provider; no wallet or EVM execution' }))
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  }
})().catch((e) => {
  console.error(e)
  if (server) server.close()
  process.exitCode = 1
})
