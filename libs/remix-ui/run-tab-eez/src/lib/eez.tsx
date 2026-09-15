import React, { useEffect, useReducer, useState, useRef } from 'react'
import { EezAppContext } from './contexts'
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { EezPlugin } from 'apps/remix-ide/src/app/udapp/udappEez'
import { eezReducer, eezInitialState } from './reducers'
import { loadNetworks } from './actions'
import EezPortraitView from './widgets/EezPortraitView'

function EezWidget({ plugin }: { plugin: EezPlugin }) {
  const isPrimaryInstance = useRef(!plugin.getWidgetState)

  const initialState = plugin.getWidgetState?.() || eezInitialState
  const [widgetState, localDispatch] = useReducer(eezReducer, initialState)
  const [themeQuality, setThemeQuality] = useState<string>('dark')

  useEffect(() => {
    if (isPrimaryInstance.current) {
      plugin.setStateGetter?.(() => widgetState)
      plugin.setDispatchGetter?.(() => localDispatch)
    }
    return () => {
      if (isPrimaryInstance.current) {
        plugin.clearGetters?.()
      }
    }
  }, [widgetState, localDispatch, plugin])

  const currentState = isPrimaryInstance.current ? widgetState : (plugin.getWidgetState?.() || widgetState)
  const dispatch = isPrimaryInstance.current ? localDispatch : (plugin.getDispatch?.() || localDispatch)

  useEffect(() => {
    if (!isPrimaryInstance.current) return
    loadNetworks(plugin, localDispatch)

    const handleContextChanged = () => {
      loadNetworks(plugin, localDispatch)
    }
    plugin.on('blockchain', 'contextChanged', handleContextChanged)
    plugin.on('config', 'configChanged', handleContextChanged)
    return () => {
      plugin.off('blockchain', 'contextChanged')
      plugin.off('config', 'configChanged')
    }
  }, [plugin])

  useEffect(() => {
    const pollTheme = async () => {
      const theme = await plugin.call('theme', 'currentTheme')
      if (theme && theme.quality) setThemeQuality(theme.quality)
    }
    pollTheme()
    plugin.on('theme', 'themeChanged', (theme: any) => {
      if (theme && theme.quality) setThemeQuality(theme.quality)
    })
    return () => {
      plugin.off('theme', 'themeChanged')
    }
  }, [])

  return (
    <EezAppContext.Provider value={{ widgetState: currentState, dispatch, plugin, themeQuality }}>
      <EezPortraitView />
    </EezAppContext.Provider>
  )
}

export default EezWidget
