import test from 'node:test'
import assert from 'node:assert/strict'
import { BrowserWallet, formatAmount } from './public/wallet-client.js'
const account = `component_${'a'.repeat(64)}`
function fixture(options = {}) {
  const calls = [], handlers = new Map()
  const provider = { info: { name: 'Sapient' }, on(event, handler) { handlers.set(event, handler); return () => handlers.delete(event) }, async request({ method }) {
    calls.push(method)
    if (options.handle) { const custom = await options.handle(method); if (custom !== undefined) return custom }
    if (method === 'tari_getAccounts' || method === 'tari_requestAccounts') return options.accounts || [account]
    if (method === 'tari_getNetwork') return options.network || 'esmeralda'
    if (method === 'tari_getCapabilities') return { transactionResultLookup: true, transactionRequests: true }
    if (method === 'tari_getBalances') return [{ amount: '1000001', confidentialAmount: '99000000', privateVisible: true, divisibility: 6, symbol: 'XTR' }]
    if (method === 'tari_disconnect') return null
    throw Error(`Unexpected wallet method: ${method}`)
  } }
  return { client: new BrowserWallet(() => provider), calls, handlers }
}
test('wallet connection uses the public API and does not infer publication support from signing', async () => {
  const { client, calls } = fixture()
  const state = await client.connect()
  assert.equal(state.status, 'connected'); assert.equal(state.account, account)
  assert.deepEqual(state.balances, [{ symbol: 'XTR', resource: undefined, amount: '1.000001' }])
  assert.equal(state.templatePublication, false)
  assert.ok(!JSON.stringify(state).includes('99000000'))
  assert.ok(!calls.some(method => /sign|submit|ViewAccess|Private/.test(method)))
  await client.disconnect()
  assert.deepEqual(client.state, { status: 'disconnected' })
  assert.equal(calls.at(-1), 'tari_disconnect')
})
test('missing provider, wrong network, cancellation and disconnected restore remain actionable', async () => {
  assert.equal((await new BrowserWallet(() => null).connect()).status, 'unavailable')
  const wrong = fixture({ network: 'igor' })
  assert.equal((await wrong.client.connect()).status, 'wrong_network')
  assert.ok(!wrong.calls.includes('tari_getBalances'))
  const rejected = fixture({ handle: method => { if (method === 'tari_requestAccounts') throw Object.assign(Error('rejected'), { code: 4001 }) } })
  assert.match((await rejected.client.connect()).message, /canceled/)
  const restore = fixture({ accounts: [] })
  assert.equal((await restore.client.connect(false)).status, 'disconnected')
  assert.deepEqual(restore.calls, ['tari_getAccounts'])
})
test('account changes invalidate in-flight reads and never display stale balances', async () => {
  let finish
  const f = fixture({ handle: method => method === 'tari_getBalances' ? new Promise(resolve => { finish = resolve }) : undefined })
  const connecting = f.client.connect()
  while (!finish) await new Promise(resolve => setImmediate(resolve))
  f.handlers.get('accountsChanged')([`component_${'b'.repeat(64)}`])
  finish([{ amount: '5', divisibility: 0, symbol: 'OLD' }])
  await connecting
  assert.equal(f.client.state.status, 'disconnected')
  assert.equal(f.client.state.balances, undefined)
})
test('network changes during reads, malformed accounts and amounts fail closed', async () => {
  let networkReads = 0
  const f = fixture({ handle: method => method === 'tari_getNetwork' ? (++networkReads === 1 ? 'esmeralda' : 'igor') : undefined })
  assert.equal((await f.client.connect()).status, 'disconnected')
  assert.equal((await fixture({ accounts: ['not-an-account'] }).client.connect()).status, 'disconnected')
  assert.equal(formatAmount('9007199254740993', 6), '9007199254.740993')
  assert.equal(formatAmount('1000000', 6), '1')
  assert.equal(formatAmount('0', 6), '0')
  assert.equal(formatAmount('10', 1000000), 'Unavailable')
  assert.equal(formatAmount('-1', 6), 'Unavailable')
})
