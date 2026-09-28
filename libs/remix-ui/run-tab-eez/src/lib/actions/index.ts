import React from 'react'
import { JsonRpcProvider, Contract, Interface, isAddress } from 'ethers'
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import type { EezPlugin } from 'apps/remix-ide/src/app/udapp/udappEez'
import { EEZ_ABI } from '../abi'
import { Actions, EezNetworkEntry, ResolutionRow } from '../types'

const CONFIG_KEY = 'eez-networks'

export async function loadNetworks(plugin: EezPlugin, dispatch: React.Dispatch<Actions>): Promise<EezNetworkEntry[]> {
  let networks: EezNetworkEntry[] = []
  try {
    const raw = await plugin.call('config', 'getAppParameter', CONFIG_KEY)
    if (raw) networks = JSON.parse(raw)
  } catch (e) {
    console.error('Unable to load EEZ networks config', e)
  }
  dispatch({ type: 'SET_NETWORKS', payload: networks })
  return networks
}

async function getCurrentChainId(plugin: EezPlugin): Promise<string | null> {
  try {
    const status = await plugin.call('blockchain', 'getCurrentNetworkStatus')
    const id = status?.network?.id
    return id === undefined || id === null ? null : String(id)
  } catch (e) {
    return null
  }
}

function findByChainId(networks: EezNetworkEntry[], chainId: string | null): EezNetworkEntry | undefined {
  if (!chainId) return undefined
  return networks.find(n => String(n.chainId) === chainId)
}

function contractFor(network: EezNetworkEntry) {
  const provider = new JsonRpcProvider(network.rpcUrl)
  return { provider, contract: new Contract(network.eezContractAddress, EEZ_ABI, provider) }
}

export async function resolveProxyAddresses(
  plugin: EezPlugin,
  dispatch: React.Dispatch<Actions>,
  networks: EezNetworkEntry[],
  address: string
) {
  if (!isAddress(address)) {
    dispatch({ type: 'RESOLVE_ERROR', payload: 'Enter a valid address' })
    return
  }
  if (networks.length === 0) {
    dispatch({ type: 'RESOLVE_ERROR', payload: 'No EEZ networks configured. Add them in Settings > EEZ.' })
    return
  }

  dispatch({ type: 'START_RESOLVE' })

  const currentChainId = await getCurrentChainId(plugin)
  dispatch({ type: 'SET_ORIGIN_NETWORK_CHAIN_ID', payload: currentChainId })
  const originNetwork = findByChainId(networks, currentChainId)

  if (!originNetwork) {
    dispatch({
      type: 'RESOLVE_ERROR',
      payload: 'The currently connected network is not in the configured EEZ networks list. Add it in Settings > EEZ.'
    })
    return
  }

  const settled = await Promise.allSettled(
    networks.map(async (network): Promise<ResolutionRow> => {
      const isOrigin = network.id === originNetwork.id
      if (isOrigin) {
        return { network, isOrigin: true, proxyAddress: null, isDeployed: null, error: null }
      }
      const { provider, contract } = contractFor(network)
      try {
        const proxyAddress: string = await contract.computeCrossChainProxyAddress(address, BigInt(originNetwork.rollupId))
        const code = await provider.getCode(proxyAddress)
        return { network, isOrigin: false, proxyAddress, isDeployed: code !== '0x', error: null }
      } catch (e) {
        return { network, isOrigin: false, proxyAddress: null, isDeployed: null, error: e?.message || 'Failed to resolve' }
      } finally {
        provider.destroy()
      }
    })
  )

  const rows = settled.map((result, i) =>
    result.status === 'fulfilled'
      ? result.value
      : { network: networks[i], isOrigin: networks[i].id === originNetwork.id, proxyAddress: null, isDeployed: null, error: 'Failed to resolve' }
  )

  dispatch({ type: 'RESOLVE_SUCCESS', payload: rows })
}

export async function previewProxyCreation(
  plugin: EezPlugin,
  dispatch: React.Dispatch<Actions>,
  networks: EezNetworkEntry[],
  originNetworkId: string,
  originAddress: string
) {
  if (!isAddress(originAddress)) {
    dispatch({ type: 'PREVIEW_ERROR', payload: 'Enter a valid origin address' })
    return
  }
  const originNetwork = networks.find(n => n.id === originNetworkId)
  if (!originNetwork) {
    dispatch({ type: 'PREVIEW_ERROR', payload: 'Select the origin network' })
    return
  }
  dispatch({ type: 'START_PREVIEW' })

  const currentChainId = await getCurrentChainId(plugin)
  const destinationNetwork = findByChainId(networks, currentChainId)
  if (!destinationNetwork) {
    dispatch({ type: 'PREVIEW_ERROR', payload: 'The currently connected network is not in the configured EEZ networks list.' })
    return
  }
  if (destinationNetwork.id === originNetwork.id) {
    dispatch({ type: 'PREVIEW_ERROR', payload: 'Origin network cannot be the network you are currently connected to (same-network proxies are not allowed).' })
    return
  }

  const { provider, contract } = contractFor(destinationNetwork)
  try {
    const proxyAddress: string = await contract.computeCrossChainProxyAddress(originAddress, BigInt(originNetwork.rollupId))
    const code = await provider.getCode(proxyAddress)
    dispatch({ type: 'PREVIEW_SUCCESS', payload: { previewAddress: proxyAddress, previewIsDeployed: code !== '0x' } })
  } catch (e) {
    dispatch({ type: 'PREVIEW_ERROR', payload: e?.message || 'Failed to preview proxy address' })
  } finally {
    provider.destroy()
  }
}

export async function createProxy(
  plugin: EezPlugin,
  dispatch: React.Dispatch<Actions>,
  networks: EezNetworkEntry[],
  originNetworkId: string,
  originAddress: string
) {
  const originNetwork = networks.find(n => n.id === originNetworkId)
  if (!originNetwork || !isAddress(originAddress)) {
    dispatch({ type: 'CREATE_ERROR', payload: 'Select a valid origin network and address first' })
    return
  }

  const currentChainId = await getCurrentChainId(plugin)
  const destinationNetwork = findByChainId(networks, currentChainId)
  if (!destinationNetwork) {
    dispatch({ type: 'CREATE_ERROR', payload: 'The currently connected network is not in the configured EEZ networks list.' })
    return
  }
  if (destinationNetwork.id === originNetwork.id) {
    dispatch({ type: 'CREATE_ERROR', payload: 'Origin network cannot be the network you are currently connected to (same-network proxies are not allowed).' })
    return
  }

  dispatch({ type: 'START_CREATE' })

  try {
    const iface = new Interface(EEZ_ABI)
    const funArgs = [originAddress, BigInt(originNetwork.rollupId)]
    const dataHex = iface.encodeFunctionData('createCrossChainProxy', funArgs)
    const funAbi = {
      name: 'createCrossChainProxy',
      type: 'function',
      inputs: [
        { name: 'originalAddress', type: 'address' },
        { name: 'originalRollupId', type: 'uint64' }
      ],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'nonpayable',
      payable: false
    }

    const result = await plugin.call('blockchain', 'runTx', {
      to: destinationNetwork.eezContractAddress,
      useCall: false,
      data: { dataHex, value: '0x0', gasLimit: '0x' + (3000000).toString(16), timestamp: Date.now(), funAbi, funArgs, contractName: 'EEZ' }
    })

    const txHash = result?.txResult?.transactionHash || result?.txResult?.receipt?.transactionHash || ''

    const { provider, contract } = contractFor(destinationNetwork)
    let proxyAddress = ''
    try {
      proxyAddress = await contract.computeCrossChainProxyAddress(originAddress, BigInt(originNetwork.rollupId))
    } finally {
      provider.destroy()
    }

    dispatch({
      type: 'CREATE_SUCCESS',
      payload: {
        txHash,
        proxyAddress,
        originNetworkLabel: originNetwork.label,
        originAddress,
        destinationNetworkLabel: destinationNetwork.label
      }
    })
  } catch (e) {
    const message = e?.message || 'Failed to create proxy'
    const friendly = /SameNetworkProxy/.test(message)
      ? 'The destination network already matches the origin network — same-network proxies are not allowed.'
      : message
    dispatch({ type: 'CREATE_ERROR', payload: friendly })
  }
}

export async function loadCreatedProxyWithSelectedAbi(plugin: EezPlugin, proxyAddress: string) {
  const selected = await plugin.call('udappDeploy', 'getSelectedContractItem')
  if (!selected || !selected.contractData?.abi) {
    throw new Error('No compiled contract selected in the Deploy tab to load this proxy with.')
  }
  await plugin.call('udappDeployedContracts', 'addInstance', proxyAddress, selected.contractData.abi, selected.name || '<eez proxy>')
}
