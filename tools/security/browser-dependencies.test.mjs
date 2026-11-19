import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import http from 'node:http'
import net from 'node:net'
import fs from 'node:fs'
const require = createRequire(import.meta.url)

test('get-uri retains FTP download and modification-time behavior with its scoped FTP patch', { timeout: 5000 }, async () => {
  const sockets = new Set()
  const commands = []
  let dataSocket
  const track = socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) }
  const dataServer = net.createServer(socket => { track(socket); dataSocket = socket })
  await new Promise(resolve => dataServer.listen(0, '127.0.0.1', resolve))
  const control = net.createServer(socket => {
    track(socket)
    socket.write('220 Local compatibility fixture\r\n')
    let buffer = ''
    socket.on('data', chunk => {
      buffer += chunk.toString()
      while (buffer.includes('\r\n')) {
        const end = buffer.indexOf('\r\n')
        const command = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        commands.push(command)
        if (command.startsWith('USER ')) socket.write('230 Logged in\r\n')
        else if (command === 'FEAT') socket.write('211 End\r\n')
        else if (command.startsWith('MDTM ')) socket.write('213 20261119000000\r\n')
        else if (command === 'EPSV') socket.write(`229 Entering Extended Passive Mode (|||${dataServer.address().port}|)\r\n`)
        else if (command.startsWith('RETR ')) {
          socket.write('150 Opening data stream\r\n')
          dataSocket.end('local-download-fixture', () => socket.write('226 Transfer complete\r\n'))
        } else if (command === 'QUIT') socket.end('221 Goodbye\r\n')
        else socket.write('200 Accepted\r\n')
      }
    })
  })
  await new Promise(resolve => control.listen(0, '127.0.0.1', resolve))
  try {
    const { getUri } = require('get-uri')
    const stream = await getUri(`ftp://127.0.0.1:${control.address().port}/fixture.txt`)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    assert.equal(Buffer.concat(chunks).toString(), 'local-download-fixture')
    assert.equal(stream.lastModified.toISOString(), '2026-11-19T00:00:00.000Z')
    assert.ok(commands.includes('RETR /fixture.txt'))
  } finally {
    for (const socket of sockets) socket.destroy()
    await Promise.all([new Promise(resolve => control.close(resolve)), new Promise(resolve => dataServer.close(resolve))])
  }
})

test('WalletConnect curve dependencies initialize with their resolved hash utilities', () => {
  // Resolve from the actual consumer: a root-level import can pass while a stale
  // nested hash package makes the eagerly loaded application module fail.
  const walletConnectRequire = createRequire(require.resolve('@walletconnect/utils'))
  const oxRequire = createRequire(walletConnectRequire.resolve('ox'))
  const { secp256k1 } = oxRequire('@noble/curves/secp256k1')
  const fixture = new Uint8Array(32)
  fixture[31] = 1
  assert.equal(Buffer.from(secp256k1.getPublicKey(fixture)).toString('hex'),
    '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798')
})

test('Bee upload/download retain their wire contract with repaired Axios', async () => {
  const { Bee } = require('@ethersphere/bee-js')
  const requests = []
  const server = http.createServer(async (req, res) => {
    const body = []
    for await (const chunk of req) body.push(chunk)
    requests.push({ method: req.method, url: req.url, body: Buffer.concat(body).toString(), stamp: req.headers['swarm-postage-batch-id'] })
    if (req.method === 'POST') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ reference: '1'.repeat(64) })) }
    else { res.setHeader('Content-Type', 'application/octet-stream'); res.end('security-fixture') }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const bee = new Bee(`http://127.0.0.1:${server.address().port}`)
    const uploaded = await bee.uploadData('0'.repeat(64), 'security-fixture')
    assert.equal(uploaded.reference, '1'.repeat(64))
    const downloaded = await bee.downloadData(uploaded.reference)
    assert.equal(downloaded.text(), 'security-fixture')
    assert.deepEqual(requests.map(r => [r.method, r.url]), [['POST', '/bytes'], ['GET', '/bytes/' + '1'.repeat(64)]])
    assert.equal(requests[0].body, 'security-fixture')
    assert.equal(requests[0].stamp, '0'.repeat(64))
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
})

test('IPFS retains duration parsing and rejects unbounded parser input', () => {
  const ipfsRequire = createRequire(require.resolve('ipfs-http-client'))
  const duration = ipfsRequire('parse-duration').default
  assert.equal(duration('1 minute'), 60_000)
  assert.equal(duration('500ms'), 500)
  assert.equal(duration('x'.repeat(100_000)), null)
  const client = require('ipfs-http-client')({ url: 'http://127.0.0.1:1', timeout: '1 minute' })
  assert.equal(typeof client.add, 'function')
})

test('GitHub pagination accepts normal links and bounds oversized headers', () => {
  const gistRequire = createRequire(require.resolve('github-base'))
  const parse = gistRequire('parse-link-header')
  assert.equal(parse('<https://api.github.com/gists?page=2>; rel="next"').next.url, 'https://api.github.com/gists?page=2')
  assert.equal(parse('x'.repeat(10_000)), null)
})

test('removed Jayson RPC dependency cannot reintroduce its legacy UUID path', () => {
  const lock = fs.readFileSync(new URL('../../yarn.lock', import.meta.url), 'utf8')
  assert.doesNotMatch(lock, /^"?jayson@/m)
})

test('agent providers and checkpointing share the same LangChain Core module', () => {
  const core = require.resolve('@langchain/core/runnables')
  for (const adapter of ['@langchain/aws', '@langchain/ollama', '@langchain/openrouter', '@langchain/langgraph', '@langchain/langgraph-checkpoint', 'langchain', 'deepagents']) {
    const adapterRequire = createRequire(require.resolve(adapter))
    assert.equal(adapterRequire.resolve('@langchain/core/runnables'), core, `${adapter} resolves a second Core copy; model and checkpoint types become incompatible`)
  }
})
