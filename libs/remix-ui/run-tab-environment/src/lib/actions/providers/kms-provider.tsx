import React from 'react' // eslint-disable-line
import * as packageJson from '../../../../../../../package.json'
import { AbstractProvider, JsonDataRequest, JsonDataResult } from './abstract-provider'
import { AppModal, ModalTypes } from '@remix-ui/app'
import { KMSSigner, kmsGetAddress, kmsCreateKey } from './kms-signer'
import type { KMSSignerConfig } from './kms-signer'
import { JsonRpcProvider } from 'ethers'
import isElectron from 'is-electron'

const profile = {
  name: 'kms-provider',
  displayName: 'AWS KMS Provider',
  kind: 'provider',
  description: 'AWS KMS Provider',
  methods: ['sendAsync', 'init'],
  version: packageJson.version
}

interface KMSFormState {
  region: string
  keyId: string
  rpcUrl: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

/**
 * Map a set of loosely-named keys onto the KMS form fields.
 * Supports both Remix-style names (region, keyId, rpcUrl, …) and
 * standard AWS credential/config names (aws_access_key_id, …).
 */
function applyAwsValues(state: KMSFormState, values: Record<string, string>) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(values).find((vk) => vk.toLowerCase() === k.toLowerCase())
      if (found && values[found] !== undefined && values[found] !== '') return String(values[found])
    }
    return undefined
  }
  const region = get('region', 'aws_region')
  const keyId = get('keyId', 'key_id', 'kms_key_id', 'kmsKeyId')
  const rpcUrl = get('rpcUrl', 'rpc_url', 'rpc')
  const accessKeyId = get('accessKeyId', 'aws_access_key_id')
  const secretAccessKey = get('secretAccessKey', 'aws_secret_access_key')
  const sessionToken = get('sessionToken', 'aws_session_token', 'aws_security_token')

  if (region !== undefined) state.region = region
  if (keyId !== undefined) state.keyId = keyId
  if (rpcUrl !== undefined) state.rpcUrl = rpcUrl
  if (accessKeyId !== undefined) state.accessKeyId = accessKeyId
  if (secretAccessKey !== undefined) state.secretAccessKey = secretAccessKey
  if (sessionToken !== undefined) state.sessionToken = sessionToken
}

/** Parse a `.aws` file: JSON object first, otherwise AWS-style INI (key = value). */
function parseAwsConfig(content: string): Record<string, string> {
  const trimmed = content.trim()
  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed)
      // flatten a single profile section if present (e.g. { default: { … } })
      if (json && typeof json === 'object') {
        const values: Record<string, string> = {}
        for (const [k, v] of Object.entries(json)) {
          if (v && typeof v === 'object') {
            for (const [ik, iv] of Object.entries(v as Record<string, unknown>)) values[ik] = String(iv)
          } else {
            values[k] = String(v)
          }
        }
        return values
      }
    } catch (e) {
      // fall through to INI parsing
    }
  }
  // INI / properties style: `key = value`, ignoring [section] headers and comments
  const values: Record<string, string> = {}
  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith(';') || line.startsWith('[')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    if (key) values[key] = value
  }
  return values
}

function KMSConfigForm({ state }: { state: KMSFormState }) {
  const inputStyle = {
    width: '100%',
    padding: '4px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: 'transparent',
    color: 'inherit',
    fontSize: '13px',
    marginBottom: '8px'
  }
  const labelStyle = { display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: 600 as const }

  return (
    <div style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>
      <p style={{ marginBottom: '12px' }}>
        Sign transactions with an AWS KMS secp256k1 key.{' '}
        {isElectron() && (
          <span>Leave Access Key fields empty to use the default AWS credential chain (env vars / <code>~/.aws/credentials</code>).</span>
        )}
      </p>
      <label style={labelStyle}>AWS Region *</label>
      <input
        style={inputStyle}
        defaultValue={state.region}
        placeholder="eu-central-1"
        onChange={(e) => { state.region = e.target.value }}
      />
      <label style={labelStyle}>KMS Key ID *</label>
      <input
        style={inputStyle}
        defaultValue={state.keyId}
        placeholder="arn:aws:kms:… or key-id UUID"
        onChange={(e) => { state.keyId = e.target.value }}
      />
      <label style={labelStyle}>RPC URL *</label>
      <input
        style={inputStyle}
        defaultValue={state.rpcUrl}
        placeholder="https://rpc.sepolia.org"
        onChange={(e) => { state.rpcUrl = e.target.value }}
      />
      <label style={labelStyle}>AWS Access Key ID</label>
      <input
        style={inputStyle}
        defaultValue={state.accessKeyId}
        placeholder={isElectron() ? 'optional — uses credential chain if empty' : 'AKIA…'}
        onChange={(e) => { state.accessKeyId = e.target.value }}
      />
      <label style={labelStyle}>AWS Secret Access Key</label>
      <input
        type="password"
        style={inputStyle}
        defaultValue={state.secretAccessKey}
        placeholder={isElectron() ? 'optional' : ''}
        onChange={(e) => { state.secretAccessKey = e.target.value }}
      />
      <label style={labelStyle}>AWS Session Token (optional)</label>
      <input
        style={inputStyle}
        defaultValue={state.sessionToken}
        placeholder="for temporary STS credentials"
        onChange={(e) => { state.sessionToken = e.target.value }}
      />
    </div>
  )
}

export class KMSProvider extends AbstractProvider {
  private kmsSigner: KMSSigner | null = null
  private kmsConfig: KMSSignerConfig | null = null

  constructor(blockchain) {
    super(profile, blockchain, 'https://rpc.sepolia.org')
  }

  body(): JSX.Element {
    // Not used — we override init() completely
    return <></>
  }

  /** Look for a `.aws` file in the workspace and pre-fill the form from it. */
  private async loadAwsFileConfig(state: KMSFormState): Promise<void> {
    try {
      const awsPath = await this.findAwsFile('/')
      if (!awsPath) return
      const content = await this.call('fileManager', 'readFile', awsPath)
      if (!content) return
      applyAwsValues(state, parseAwsConfig(content))
    } catch (e) {
      // best-effort: keep the empty form if the file can't be read/parsed
    }
  }

  /** Depth-limited search for the first file whose name ends with `.aws`. */
  private async findAwsFile(dir: string, depth = 2): Promise<string | null> {
    let entries: Record<string, { isDirectory?: boolean }>
    try {
      entries = await this.call('fileManager', 'readdir', dir)
    } catch (e) {
      return null
    }
    const subDirs: string[] = []
    for (const [path, meta] of Object.entries(entries || {})) {
      if (meta && meta.isDirectory) {
        subDirs.push(path)
      } else if (path.endsWith('.aws')) {
        return path
      }
    }
    if (depth > 0) {
      for (const sub of subDirs) {
        const found = await this.findAwsFile(sub, depth - 1)
        if (found) return found
      }
    }
    return null
  }

  async init(): Promise<{ nodeUrl: string }> {
    const state: KMSFormState = {
      region: '',
      keyId: '',
      rpcUrl: 'https://rpc.sepolia.org',
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    }

    // Pre-fill from a `.aws` file in the file tree if one exists
    await this.loadAwsFileConfig(state)

    const nodeUrl = await new Promise<string>((resolve, reject) => {
      const modalContent: AppModal = {
        id: this.profile.name,
        title: 'AWS KMS Provider',
        message: <KMSConfigForm state={state} />,
        modalType: ModalTypes.default,
        okLabel: 'Connect',
        cancelLabel: 'Cancel',
        okFn: () => {
          if (!state.region) return reject(new Error('AWS Region is required'))
          if (!state.keyId) return reject(new Error('KMS Key ID is required'))
          if (!state.rpcUrl) return reject(new Error('RPC URL is required'))
          setTimeout(() => resolve(state.rpcUrl), 0)
        },
        cancelFn: () => {
          setTimeout(() => reject(new Error('Canceled')), 0)
        },
        hideFn: () => {
          setTimeout(() => reject(new Error('Hidden')), 0)
        },
      }
      this.call('notification', 'modal', modalContent)
    })

    this.kmsConfig = {
      region: state.region,
      keyId: state.keyId,
      accessKeyId: state.accessKeyId || undefined,
      secretAccessKey: state.secretAccessKey || undefined,
      sessionToken: state.sessionToken || undefined,
    }
    this.provider = new JsonRpcProvider(nodeUrl)
    this.kmsSigner = new KMSSigner(this.kmsConfig, this.provider)
    this.nodeUrl = nodeUrl

    return { nodeUrl }
  }

  async sendAsync(data: JsonDataRequest): Promise<JsonDataResult> {
    console.log('KMSProvider sendAsync', data)
    if (!this.kmsSigner || !this.kmsConfig) {
      return { jsonrpc: '2.0', id: data.id, error: { code: -32603, message: 'KMS provider not initialized' } }
    }

    try {
      if (data.method === 'eth_accounts' || data.method === 'eth_requestAccounts') {
        const address = await this.kmsSigner.getAddress()
        return { jsonrpc: '2.0', result: [address], id: data.id }
      }

      if (data.method === 'eth_sendTransaction') {
        const txParams = data.params[0] as Record<string, string>
        const txObject = {
          type: txParams.type !== undefined ? parseInt(txParams.type, 16) : 2,
          to: txParams.to,
          nonce: txParams.nonce !== undefined ? parseInt(txParams.nonce, 16) : undefined,
          gasLimit: txParams.gas || txParams.gasLimit,
          data: txParams.data || txParams.input || '0x',
          value: txParams.value || '0x0',
          chainId: txParams.chainId !== undefined ? parseInt(txParams.chainId, 16) : undefined,
          maxFeePerGas: txParams.maxFeePerGas,
          maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
          gasPrice: txParams.gasPrice,
        }
        const signed = await this.kmsSigner.signTransaction(txObject)
        const txHash = await this.provider.send('eth_sendRawTransaction', [signed])
        return { jsonrpc: '2.0', result: txHash, id: data.id }
      }

      if (data.method === 'personal_sign' || data.method === 'eth_sign') {
        const message = data.params[0] as string
        const signed = await this.kmsSigner.signMessage(message)
        return { jsonrpc: '2.0', result: signed, id: data.id }
      }

      if (data.method === 'eth_signTypedData_v4' || data.method === 'eth_signTypedData' || data.method === 'eth_signTypedData_v3') {
        const raw = data.params[1]
        const typedData = typeof raw === 'string' ? JSON.parse(raw) : raw
        const types = { ...typedData.types }
        // ethers' TypedDataEncoder derives the EIP712Domain type itself
        delete types.EIP712Domain
        const signed = await this.kmsSigner.signTypedData(typedData.domain, types, typedData.message)
        return { jsonrpc: '2.0', result: signed, id: data.id }
      }
    } catch (error) {
      return { jsonrpc: '2.0', id: data.id, error: { code: -32603, message: error.message } }
    }

    // Forward everything else to the JSON-RPC provider
    return super.sendAsync(data)
  }

  /** Create a new KMS key and update the active key ID */
  async createNewKey(): Promise<string> {
    if (!this.kmsConfig) throw new Error('KMS provider not initialized')
    const keyId = await kmsCreateKey(
      this.kmsConfig.region,
      this.kmsConfig.accessKeyId,
      this.kmsConfig.secretAccessKey,
      this.kmsConfig.sessionToken,
    )
    this.kmsConfig = { ...this.kmsConfig, keyId }
    this.kmsSigner = new KMSSigner(this.kmsConfig, this.provider)
    return keyId
  }

  getKMSAddress(): Promise<string> | null {
    return this.kmsSigner ? this.kmsSigner.getAddress() : null
  }
}
