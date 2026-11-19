import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import { rateLimit } from 'express-rate-limit'

test('inherited limiter options cannot raise the default request limit', async (t) => {
  // A fresh test process contains the deliberate prototype mutation. Restore it
  // before serving requests, even if constructing the middleware fails.
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'max')
  let limiter
  try {
    Object.defineProperty(Object.prototype, 'max', { value: 1000, configurable: true })
    limiter = rateLimit({ windowMs: 60000, standardHeaders: true, legacyHeaders: false })
  } finally {
    if (previous) Object.defineProperty(Object.prototype, 'max', previous)
    else delete Object.prototype.max
  }
  const app = express()
  app.use(limiter)
  app.get('/probe', (_req, res) => res.sendStatus(204))
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}/probe`
  for (let i = 0; i < 5; i++) {
    const response = await fetch(url)
    await response.text()
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('ratelimit-limit'), '5')
  }
  const rejected = await fetch(url)
  await rejected.text()
  assert.equal(rejected.status, 429)
  assert.equal(rejected.headers.get('ratelimit-remaining'), '0')
})
