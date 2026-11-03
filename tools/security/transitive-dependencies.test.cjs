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

// Legacy Nightwatch and current Mocha require different minimatch module APIs.
test('each Mocha consumer discovers files and applies exclusions through its CLI', () => {
  const path = require('node:path')
  const { createRequire } = require('node:module')
  const { execFileSync } = require('node:child_process')
  const root = createRequire(path.resolve('package.json'))
  const directory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'ootle-mocha-'))
  try {
    fs.writeFileSync(path.join(directory, 'sample.test.cjs'), 'describe("file selection", () => it("selects fixture", () => {}))')
    fs.writeFileSync(path.join(directory, 'excluded.test.cjs'), 'throw new Error("excluded fixture must not run")')
    for (const consumer of [null, 'nightwatch', 'hardhat']) {
      const from = consumer ? createRequire(root.resolve(consumer)) : root
      const manifest = from.resolve('mocha/package.json')
      const metadata = JSON.parse(fs.readFileSync(manifest, 'utf8'))
      const executable = path.join(path.dirname(manifest), metadata.bin.mocha)
      const output = execFileSync(process.execPath, [executable, path.join(directory, '*.test.cjs'), '--exclude', '**/excluded.test.cjs', '--reporter', 'dot'], { encoding: 'utf8', timeout: 10000 })
      assert.match(output, /1 passing/, consumer || 'root')
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
