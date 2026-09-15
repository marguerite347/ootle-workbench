import React from 'react'
import { Plugin } from '@remixproject/engine'
import {
  EezWidget,
  Actions,
  EezWidgetState,
  resolveProxyAddresses as resolveProxyAddressesAction,
  createProxy as createProxyAction
} from '@remix-ui/run-tab-eez'

const profile = {
  name: 'udappEez',
  displayName: 'EEZ Cross-Chain Proxy',
  description: 'Resolve and create EEZ cross-chain proxy addresses across configured networks',
  methods: ['getUI', 'resolveProxyAddresses', 'createProxy'],
  events: []
}

export class EezPlugin extends Plugin {
  getWidgetState: (() => EezWidgetState) | null = null
  private _getDispatch: (() => React.Dispatch<Actions>) | null = null

  constructor () {
    super(profile)
  }

  setStateGetter(getter: () => EezWidgetState) {
    this.getWidgetState = getter
  }

  setDispatchGetter(getter: () => React.Dispatch<Actions>) {
    this._getDispatch = getter
  }

  getDispatch() {
    return this._getDispatch?.()
  }

  clearGetters() {
    this.getWidgetState = null
    this._getDispatch = null
  }

  async resolveProxyAddresses(address: string) {
    const dispatch = this.getDispatch()
    if (!dispatch) throw new Error('EEZ panel is not mounted')
    const networks = this.getWidgetState?.()?.networks || []
    await resolveProxyAddressesAction(this, dispatch, networks, address)
    return this.getWidgetState?.()?.resolutionRows
  }

  async createProxy(originNetworkId: string, originAddress: string) {
    const dispatch = this.getDispatch()
    if (!dispatch) throw new Error('EEZ panel is not mounted')
    const networks = this.getWidgetState?.()?.networks || []
    await createProxyAction(this, dispatch, networks, originNetworkId, originAddress)
    return this.getWidgetState?.()?.creator
  }

  getUI() {
    return <EezWidget plugin={this} />
  }
}
