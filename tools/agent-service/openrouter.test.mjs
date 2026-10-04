import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store, hash } from './store.mjs'
import { OpenRouter } from './openrouter.mjs'
async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ootle-model-test-')),
    store = await Store.embedded(join(dir, 'db'))
  t.after(async () => {
    await store.close()
    rmSync(dir, { recursive: true, force: true })
  })
  const project = await store.createProject('alice', 'Counter', { 'src/lib.rs': 'pub fn value() -> u64 { 0 }', 'notes.md': 'Do not send this unselected file' })
  const calls = []
  let failure = 0
  const request = async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/auth/keys')) return Response.json({ key: 'fixture-provider-key' })
    if (url.endsWith('/models'))
      return Response.json({
        data: [
          { id: 'test/free:free', name: 'Free', pricing: { prompt: '0', completion: '0' }, architecture: { input_modalities: ['text'], output_modalities: ['text'] } },
          { id: 'test/paid', name: 'Paid', pricing: { prompt: '0.01', completion: '0.01' }, architecture: { input_modalities: ['text'], output_modalities: ['text'] } },
        ],
      })
    if (failure) return Response.json({ error: { message: 'Never expose provider secrets in errors' } }, { status: failure })
    return Response.json({ choices: [{ message: { content: 'The counter starts at zero.' } }] })
  }
  const client = new OpenRouter(store, 'https://workbench.example', 'ab'.repeat(32), request)
  const url = new URL(await client.begin('alice', 'session-binding'))
  return {
    store,
    project,
    client,
    state: url.searchParams.get('state'),
    url,
    calls,
    setFailure(value) {
      failure = value
    },
  }
}
test('OpenRouter PKCE is session-bound, single-use, encrypted per owner and revocable', async (t) => {
  const f = await fixture(t)
  assert.equal(f.url.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(f.url.searchParams.get('callback_url'), 'https://workbench.example/openrouter/callback')
  await assert.rejects(f.client.finish('bob', 'session-binding', f.state, 'code'), /another session/)
  await assert.rejects(f.client.finish('alice', 'other-session', f.state, 'code'), /another session/)
  await f.client.finish('alice', 'session-binding', f.state, 'code')
  await assert.rejects(f.client.finish('alice', 'session-binding', f.state, 'code'), /expired/)
  const stored = await f.store.get('openrouter-key', 'alice')
  assert.ok(!JSON.stringify(stored).includes('fixture-provider-key'))
  assert.equal(f.client.unseal('alice', stored), 'fixture-provider-key')
  assert.throws(() => f.client.unseal('bob', stored))
  assert.equal((await f.client.status('bob')).connected, false)
  assert.equal((await f.client.status('alice')).settingsUrl, `https://openrouter.ai/keys/${hash('fixture-provider-key')}`)
  await f.client.disconnect('alice')
  assert.equal((await f.client.status('alice')).connected, false)
})
test('OpenRouter selected context, free-only routing, actual answers, ownership, version and quota', async (t) => {
  const f = await fixture(t)
  await f.client.finish('alice', 'session-binding', f.state, 'code')
  const input = { version: 1, model: 'test/free:free', prompt: 'Explain this counter.', paths: ['src/lib.rs'] }
  await assert.rejects(f.client.chat('alice', f.project.id, { ...input, model: 'test/paid' }), /free model/)
  await assert.rejects(f.client.chat('alice', f.project.id, { ...input, version: 2 }), /changed/)
  await assert.rejects(f.client.chat('alice', f.project.id, { ...input, paths: ['missing'] }), /existing files/)
  await assert.rejects(f.client.history('bob', f.project.id), /not found/)
  const reply = await f.client.chat('alice', f.project.id, input)
  assert.equal(reply.answer, 'The counter starts at zero.')
  assert.equal((await f.client.history('alice', f.project.id)).length, 1)
  const sent = JSON.parse(f.calls.find((c) => c.url.endsWith('/chat/completions')).options.body)
  assert.equal(sent.provider.max_price.prompt, 0)
  assert.equal(sent.provider.max_price.completion, 0)
  assert.ok(!JSON.stringify(sent).includes('Do not send this unselected file'))
  assert.equal((await f.store.project(f.project.id, 'alice')).version, 1)
  f.setFailure(429)
  await assert.rejects(f.client.chat('alice', f.project.id, input), /rate limited/)
  assert.equal((await f.client.history('alice', f.project.id)).length, 1)
  const quota = await f.store.get('openrouter-quota', 'alice')
  assert.equal(quota.until, 0)
  await f.store.put('openrouter-quota', 'alice', { ...quota, count: 20 })
  await assert.rejects(f.client.chat('alice', f.project.id, input), /20 model requests/)
  await f.client.disconnect('alice')
  await assert.rejects(f.client.chat('alice', f.project.id, input), /Connect OpenRouter/)
})
