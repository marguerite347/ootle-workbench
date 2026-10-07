// Shared by the browser and Node companion. No pairing key crosses the wire.
const encoder = new TextEncoder()
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
const unhex = value => Uint8Array.from(value.match(/../g), b => parseInt(b, 16))
const encode64 = bytes => {
  let result = ''
  for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(result)
}
const decode64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0))
export const MAX_RESPONSE = 17 * 1024 * 1024
export async function pairingKey(secret) {
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('Enter the 64-character pairing key from your local key file.')
  return crypto.subtle.importKey('raw', unhex(secret), 'AES-GCM', false, ['encrypt', 'decrypt'])
}
export async function seal(key, data, context) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(`ootle-v2:${context}`) }, key, encoder.encode(JSON.stringify(data)))
  return { version: 2, iv: hex(iv), ciphertext: encode64(new Uint8Array(bytes)) }
}
export async function open(key, envelope, context, limit = MAX_RESPONSE) {
  if (!envelope || envelope.version !== 2 || !/^[a-f0-9]{24}$/.test(envelope.iv) || typeof envelope.ciphertext !== 'string' || envelope.ciphertext.length > limit || !/^[A-Za-z0-9+/]*={0,2}$/.test(envelope.ciphertext)) throw new Error('Invalid authenticated companion response.')
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unhex(envelope.iv), additionalData: encoder.encode(`ootle-v2:${context}`) }, key, decode64(envelope.ciphertext))
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain))
  } catch { throw new Error('Companion authentication failed. Check your local pairing key.') }
}
export async function boundedJson(response, limit = MAX_RESPONSE) {
  const reader = response.body.getReader()
  const chunks = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > limit) throw new Error('Companion response exceeds the size limit.')
      chunks.push(value)
    }
  } catch (error) { await reader.cancel(); throw error } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return JSON.parse(new TextDecoder().decode(bytes))
}
export async function companionRequest(url, secret, origin, path, body = {}, fetcher = fetch) {
  const endpoint = new URL(url)
  const local = new URL(origin)
  if (!['localhost', '127.0.0.1'].includes(local.hostname) || local.protocol !== 'http:') throw new Error('Local companion connections require the locally served IDE. Use cloud builds on the hosted Workbench.')
  if (!['localhost', '127.0.0.1'].includes(endpoint.hostname) || endpoint.protocol !== 'http:' || endpoint.username || endpoint.password || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) throw new Error('Use a loopback companion URL such as http://127.0.0.1:4510.')
  const key = await pairingKey(secret)
  const request = await seal(key, { path, body, issuedAt: Date.now() }, `request:${origin}`)
  const response = await fetcher(`${endpoint.origin}/rpc`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(23 * 60 * 1000), redirect: 'error', credentials: 'omit', cache: 'no-store' })
  const data = await open(key, await boundedJson(response), `response:${origin}:${request.iv}`)
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Companion request failed.')
  return data
}
export function validateCapabilities(data) {
  if (!data || data.version !== 2 || data.execution !== 'terminal-approved-local' || ['build', 'test', 'assistant'].some(k => typeof data[k] !== 'boolean') || !(data.model === null || typeof data.model === 'string')) throw new Error('Unsupported companion capabilities. Update the companion from this repository.')
  return data
}
export async function validateResult(result, expectedDigest, action) {
  if (!result || typeof result.success !== 'boolean' || !(result.exitCode === null || Number.isInteger(result.exitCode)) || typeof result.output !== 'string' || result.output.length > 1024 * 1024 || typeof result.command !== 'string' || result.command.length > 200 || !/^[a-f0-9]{64}$/.test(result.sourceDigest) || result.sourceDigest !== expectedDigest || !Array.isArray(result.artifacts) || result.artifacts.length > 4 || (result.success && result.exitCode !== 0) || ((!result.success || action !== 'build') && result.artifacts.length)) throw new Error('Invalid companion build response.')
  let total = 0; const names = new Set()
  for (const artifact of result.artifacts) {
    if (!artifact || typeof artifact.name !== 'string' || !/^[A-Za-z0-9_-]+\.wasm$/.test(artifact.name) || names.has(artifact.name) || typeof artifact.base64 !== 'string' || artifact.base64.length > 14 * 1024 * 1024 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(artifact.base64) || !/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error('Invalid WASM artifact metadata.')
    names.add(artifact.name)
    const bytes = decode64(artifact.base64); total += bytes.length
    if (total > 8 * 1024 * 1024 || bytes.length !== artifact.size || bytes.length < 8 || ![0, 97, 115, 109, 1, 0, 0, 0].every((b, i) => bytes[i] === b) || !WebAssembly.validate(bytes)) throw new Error('Invalid WASM artifact bytes.')
    const digest = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    if (digest !== artifact.sha256) throw new Error('WASM SHA-256 does not match its bytes.')
  }
  if (result.success && action === 'build' && !result.artifacts.length) throw new Error('The build produced no WASM artifact.')
  return result
}
