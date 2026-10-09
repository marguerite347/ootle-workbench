import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import http from 'node:http'
const require = createRequire(import.meta.url)

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

test('Jayson browser RPC still produces UUID request IDs with repaired UUID', async () => {
  const Client = require('jayson/lib/client/browser')
  let request
  const client = new Client((body, callback) => {
    request = JSON.parse(body)
    callback(null, JSON.stringify({ jsonrpc: '2.0', id: request.id, result: 'fixture-ok' }))
  })
  const response = await new Promise((resolve, reject) => client.request('fixture', [], (error, result) => error ? reject(error) : resolve(result)))
  assert.match(request.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(response.result, 'fixture-ok')
})
