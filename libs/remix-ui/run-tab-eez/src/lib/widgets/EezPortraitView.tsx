import React, { useContext, useState } from 'react'
import { EezAppContext } from '../contexts'
import { resolveProxyAddresses, previewProxyCreation, createProxy, loadCreatedProxyWithSelectedAbi } from '../actions'

function shorten(address: string) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function EezPortraitView() {
  const { plugin, widgetState, dispatch } = useContext(EezAppContext)
  const { networks, addressInput, isResolving, resolutionRows, resolutionError, creator } = widgetState
  const [loadStatus, setLoadStatus] = useState<string | null>(null)

  const handleResolve = () => {
    resolveProxyAddresses(plugin, dispatch, networks, addressInput.trim())
  }

  const handlePreview = () => {
    previewProxyCreation(plugin, dispatch, networks, creator.originNetworkId, creator.originAddress.trim())
  }

  const handleCreate = () => {
    createProxy(plugin, dispatch, networks, creator.originNetworkId, creator.originAddress.trim())
  }

  const handleLoadWithAbi = async () => {
    setLoadStatus(null)
    try {
      await loadCreatedProxyWithSelectedAbi(plugin, creator.previewAddress)
      setLoadStatus('Loaded in Deployed Contracts.')
    } catch (e) {
      setLoadStatus(e?.message || 'Unable to load proxy with the currently selected contract ABI.')
    }
  }

  return (
    <div className="p-3" data-id="eezPortraitView">
      <h6>EEZ Cross-Chain Proxy</h6>

      {networks.length === 0 && (
        <div className="alert alert-warning py-2 px-2 small mb-3">
          No EEZ networks configured. Add RPC URL, EEZ contract address, rollup id and chain id per network in
          <strong> Settings &gt; EEZ</strong>.
        </div>
      )}

      <div className="mb-4">
        <h6 className="text-uppercase small text-secondary">Resolve proxy address</h6>
        <p className="small text-secondary">
          Enter an address to see its proxy on every configured network. On the destination chain, <code>msg.sender</code> is
          the proxy, not the original account — access-control code must expect the proxy address.
        </p>
        <div className="d-flex gap-2 mb-2">
          <input
            className="form-control"
            data-id="eezResolveAddressInput"
            placeholder="0x..."
            value={addressInput}
            onChange={(e) => dispatch({ type: 'SET_ADDRESS_INPUT', payload: e.target.value })}
          />
          <button className="btn btn-primary text-nowrap" data-id="eezResolveButton" disabled={isResolving || !addressInput} onClick={handleResolve}>
            {isResolving ? 'Resolving...' : 'Resolve'}
          </button>
        </div>
        {resolutionError && <div className="text-danger small">{resolutionError}</div>}
        {resolutionRows.length > 0 && (
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Network</th>
                <th>Proxy address</th>
                <th>Deployed</th>
              </tr>
            </thead>
            <tbody>
              {resolutionRows.map((row) => (
                <tr key={row.network.id} className={row.isOrigin ? 'text-muted' : ''}>
                  <td>{row.network.label}{row.isOrigin ? ' (current — same-network proxy N/A)' : ''}</td>
                  <td>{row.isOrigin ? '—' : row.error ? <span className="text-danger">{row.error}</span> : shorten(row.proxyAddress || '')}</td>
                  <td>{row.isOrigin ? '—' : row.isDeployed === null ? '' : row.isDeployed ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h6 className="text-uppercase small text-secondary">Create proxy</h6>
        <p className="small text-secondary">
          Create the proxy for a remote account (living on another network) here on the currently connected network, so you
          can call it locally. This does not create your own proxy — the protocol auto-creates that on the destination when
          you make a cross-chain call.
        </p>
        <div className="mb-2">
          <select
            className="form-select form-select-sm"
            data-id="eezCreatorOriginNetwork"
            value={creator.originNetworkId}
            onChange={(e) => dispatch({ type: 'SET_CREATOR_ORIGIN_NETWORK', payload: e.target.value })}
          >
            <option value="">Select origin network...</option>
            {networks.map((n) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="d-flex gap-2 mb-2">
          <input
            className="form-control"
            data-id="eezCreatorOriginAddress"
            placeholder="Origin address 0x..."
            value={creator.originAddress}
            onChange={(e) => dispatch({ type: 'SET_CREATOR_ORIGIN_ADDRESS', payload: e.target.value })}
          />
          <button
            className="btn btn-secondary text-nowrap"
            data-id="eezPreviewButton"
            disabled={creator.isPreviewing || !creator.originNetworkId || !creator.originAddress}
            onClick={handlePreview}
          >
            {creator.isPreviewing ? 'Previewing...' : 'Preview'}
          </button>
        </div>
        {creator.previewError && <div className="text-danger small mb-2">{creator.previewError}</div>}
        {creator.previewAddress && (
          <div className="small mb-2">
            Predicted proxy address: <code>{creator.previewAddress}</code> — {creator.previewIsDeployed ? 'already deployed' : 'not deployed yet'}
          </div>
        )}
        {creator.previewAddress && !creator.previewIsDeployed && (
          <button className="btn btn-primary btn-sm" data-id="eezCreateButton" disabled={creator.isCreating} onClick={handleCreate}>
            {creator.isCreating ? 'Creating...' : 'Create proxy'}
          </button>
        )}
        {creator.previewAddress && creator.previewIsDeployed && (
          <button className="btn btn-outline-primary btn-sm" data-id="eezLoadWithAbiButton" onClick={handleLoadWithAbi}>
            Load with selected contract ABI
          </button>
        )}
        {creator.createError && <div className="text-danger small mt-2">{creator.createError}</div>}
        {creator.createdTxHash && (
          <div className="small mt-2">
            Proxy created — tx <code>{shorten(creator.createdTxHash)}</code>
            <button className="btn btn-outline-primary btn-sm ms-2" data-id="eezLoadWithAbiButtonAfterCreate" onClick={handleLoadWithAbi}>
              Load with selected contract ABI
            </button>
          </div>
        )}
        {loadStatus && <div className="small mt-2">{loadStatus}</div>}
      </div>
    </div>
  )
}

export default EezPortraitView
