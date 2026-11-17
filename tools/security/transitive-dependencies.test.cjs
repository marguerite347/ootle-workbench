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

// Exercise the XML public API used by inherited tooling after the security update.
test('XML parser retains attributes, entities and builder round trips', () => {
  const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser')
  const parser = new XMLParser({ ignoreAttributes: false })
  const source = '<project id="tari"><name>A &amp; B</name><count>3</count></project>'
  const parsed = parser.parse(source)
  assert.deepEqual(parsed, { project: { name: 'A & B', count: 3, '@_id': 'tari' } })
  const rebuilt = new XMLBuilder({ ignoreAttributes: false }).build(parsed)
  assert.equal(XMLValidator.validate(rebuilt), true)
  assert.deepEqual(parser.parse(rebuilt), parsed)
})

test('Forge certificates and signatures retain expected verification behavior', () => {
  const forge = require('node-forge')
  const { generateKeyPairSync } = require('node:crypto')
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs1', format: 'pem' } })
  const cert = forge.pki.createCertificate()
  cert.publicKey = forge.pki.publicKeyFromPem(keys.publicKey)
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date('2026-01-01')
  cert.validity.notAfter = new Date('2027-01-01')
  const attrs = [{ name: 'commonName', value: 'localhost' }]
  cert.setSubject(attrs); cert.setIssuer(attrs)
  cert.sign(forge.pki.privateKeyFromPem(keys.privateKey), forge.md.sha256.create())
  const restored = forge.pki.certificateFromPem(forge.pki.certificateToPem(cert))
  assert.equal(restored.verify(restored), true)
  const ed = forge.pki.ed25519
  const pair = ed.generateKeyPair({ seed: new Uint8Array(32).fill(7) })
  const signature = ed.sign({ message: 'ootle fixture', encoding: 'utf8', privateKey: pair.privateKey })
  assert.equal(ed.verify({ message: 'ootle fixture', encoding: 'utf8', signature, publicKey: pair.publicKey }), true)
  assert.equal(ed.verify({ message: 'changed fixture', encoding: 'utf8', signature, publicKey: pair.publicKey }), false)
})
