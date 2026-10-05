// Sapient's documented window.tari API. No signing, secrets or private-balance grant.
// Source contract: chironbuilds/tari-wallet@7ad3c4f (0.6.6).
export class BrowserWallet {
  constructor(provider, changed = () => {}) {
    this.getProvider = provider
    this.changed = changed
    this.generation = 0
    this.state = { status: 'disconnected' }
  }
  async call(provider, method, timeoutMs = 15000) {
    let timer
    try {
      return await Promise.race([provider.request({ method }), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Wallet request timed out. Check any open Sapient prompt before retrying.')), timeoutMs) })])
    } finally { clearTimeout(timer) }
  }
  set(state) { this.state = state; this.changed(state); return state }
  invalidate() {
    this.generation++
    this.set({ status: 'disconnected', message: 'Wallet account changed. Reconnect to refresh the account and network.' })
  }
  async connect(interactive = true) {
    const generation = ++this.generation
    this.unsubscribe?.()
    const provider = this.getProvider()
    if (!provider || typeof provider.request !== 'function') return this.set({ status: 'unavailable', message: 'No Tari wallet provider is available on this page. Enable Sapient for this site, unlock it, then retry.' })
    this.provider = provider
    this.set({ status: 'connecting', message: interactive ? 'Approve the connection in Sapient. This shares your public account address.' : 'Checking the existing wallet connection…' })
    const listener = () => this.invalidate()
    const remove = typeof provider.on === 'function' ? provider.on('accountsChanged', listener) : undefined
    this.unsubscribe = typeof remove === 'function' ? remove : () => provider.removeListener?.('accountsChanged', listener)
    try {
      const accounts = await this.call(provider, interactive ? 'tari_requestAccounts' : 'tari_getAccounts', interactive ? 120000 : 15000)
      if (generation !== this.generation) return this.state
      if (!Array.isArray(accounts) || !accounts.length) return this.set({ status: 'disconnected', message: 'No wallet account connected.' })
      if (typeof accounts[0] !== 'string' || !/^component_[a-f0-9]{64}$/.test(accounts[0])) throw new Error('The wallet returned an unsupported account address.')
      const network = await this.call(provider, 'tari_getNetwork')
      if (generation !== this.generation) return this.state
      if (network !== 'esmeralda') return this.set({ status: 'wrong_network', message: 'Choose Esmeralda in your wallet, then reconnect. No transaction has been requested.' })
      const capabilities = await this.call(provider, 'tari_getCapabilities')
      const balances = await this.call(provider, 'tari_getBalances')
      const currentAccounts = await this.call(provider, 'tari_getAccounts')
      const currentNetwork = await this.call(provider, 'tari_getNetwork')
      if (generation !== this.generation) return this.state
      if (currentAccounts?.[0] !== accounts[0] || currentNetwork !== network) { this.invalidate(); return this.state }
      if (!capabilities || typeof capabilities !== 'object' || !Array.isArray(balances)) throw new Error('The wallet returned an unsupported response.')
      // Do not infer template publishing from general transaction support. The reviewed
      // provider has no publish method or WASM/blob field; adding a flag alone is insufficient.
      return this.set({ status: 'connected', name: typeof provider.info?.name === 'string' ? provider.info.name.slice(0, 50) : 'Tari wallet', account: accounts[0], network, canReadTransactions: capabilities.transactionResultLookup === true, templatePublication: false, balances: balances.map(b => ({ symbol: typeof b.symbol === 'string' ? b.symbol.slice(0, 30) : 'Token', resource: b.resourceAddress, amount: formatAmount(b.amount, b.divisibility) })), message: 'Connected on Esmeralda. Publishing new WASM through Sapient is not supported by this integration yet.' })
    } catch (error) {
      if (generation !== this.generation) return this.state
      return this.set({ status: 'disconnected', message: error?.code === 4001 ? 'Wallet connection canceled. You can retry when ready.' : String(error?.message || 'Could not connect to the wallet. Unlock Sapient and retry.').slice(0, 400) })
    }
  }
  async disconnect() {
    this.generation++
    this.unsubscribe?.()
    this.set({ status: 'disconnected' })
    try {
      if (this.provider) await this.call(this.provider, 'tari_disconnect')
      this.provider = null
    } catch {
      this.set({ status: 'disconnected', message: 'Local connection cleared. To revoke site access, disconnect Workbench in Sapient.' })
    }
  }
}

export function formatAmount(amount, decimals) {
  if (typeof amount !== 'string' || !/^\d{1,78}$/.test(amount) || !Number.isInteger(decimals) || decimals < 0 || decimals > 30) return 'Unavailable'
  const digits = BigInt(amount).toString().padStart(decimals + 1, '0')
  if (!decimals) return digits
  const fraction = digits.slice(-decimals).replace(/0+$/, '')
  return digits.slice(0, -decimals) + (fraction ? `.${fraction}` : '')
}
