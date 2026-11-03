const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const tmp = require('tmp')

test('temporary files reject nonstring prefixes and preserve normal cleanup', () => {
  for (const prefix of [[], {}, () => '../escape']) {
    assert.throws(() => tmp.fileSync({ prefix }))
  }
  const file = tmp.fileSync({ prefix: 'ootle-review-' })
  try {
    assert.ok(fs.existsSync(file.name))
  } finally {
    file.removeCallback()
  }
  assert.ok(!fs.existsSync(file.name))
})

test('redirects across local origins strip authorization and cookies', { timeout: 5000 }, async () => {
  let received
  const destination = http.createServer((request, response) => {
    received = request.headers
    response.end('ok')
  })
  const redirect = http.createServer((request, response) => {
    response.writeHead(302, { location: `http://127.0.0.1:${destination.address().port}/done` })
    response.end()
  })
  try {
    await new Promise(resolve => destination.listen(0, '127.0.0.1', resolve))
    await new Promise(resolve => redirect.listen(0, '127.0.0.1', resolve))
    await new Promise((resolve, reject) => {
      require('follow-redirects').http.get(`http://127.0.0.1:${redirect.address().port}`, {
        headers: { authorization: 'dummy-review-only', cookie: 'dummy=review' }
      }, response => {
        response.resume()
        response.on('end', resolve)
      }).on('error', reject)
    })
    assert.equal(received.authorization, undefined)
    assert.equal(received.cookie, undefined)
  } finally {
    redirect.closeAllConnections()
    destination.closeAllConnections()
    await Promise.all([redirect, destination].map(server => new Promise(resolve => server.close(resolve))))
  }
})
