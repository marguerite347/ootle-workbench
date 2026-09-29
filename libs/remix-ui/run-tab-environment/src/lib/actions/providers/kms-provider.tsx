import React from 'react' // eslint-disable-line
import * as packageJson from '../../../../../../../package.json'
import { AbstractProvider, JsonDataRequest, JsonDataResult } from './abstract-provider'
import { AppModal, ModalTypes } from '@remix-ui/app'
import { KMSSigner, kmsGetAddress, kmsCreateKey } from '@remix-project/remix-lib'
import type { KMSSignerConfig } from '@remix-project/remix-lib'
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

  async init(): Promise<{ nodeUrl: string }> {
    const state: KMSFormState = {
      region: '',
      keyId: '',
      rpcUrl: 'https://rpc.sepolia.org',
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    }

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
