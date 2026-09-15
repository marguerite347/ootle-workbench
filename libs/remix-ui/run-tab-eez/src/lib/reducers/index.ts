import { Actions, EezWidgetState } from '../types'

export const eezInitialState: EezWidgetState = {
  networks: [],
  originNetworkChainId: null,
  addressInput: '',
  isResolving: false,
  resolutionRows: [],
  resolutionError: null,
  creator: {
    originNetworkId: '',
    originAddress: '',
    isPreviewing: false,
    previewAddress: null,
    previewIsDeployed: null,
    previewError: null,
    isCreating: false,
    createError: null,
    createdTxHash: null
  }
}

export const eezReducer = (state: EezWidgetState, action: Actions): EezWidgetState => {
  switch (action.type) {
  case 'SET_NETWORKS':
    return { ...state, networks: action.payload }

  case 'SET_ORIGIN_NETWORK_CHAIN_ID':
    return { ...state, originNetworkChainId: action.payload }

  case 'SET_ADDRESS_INPUT':
    return { ...state, addressInput: action.payload }

  case 'START_RESOLVE':
    return { ...state, isResolving: true, resolutionError: null }

  case 'RESOLVE_SUCCESS':
    return { ...state, isResolving: false, resolutionRows: action.payload, resolutionError: null }

  case 'RESOLVE_ERROR':
    return { ...state, isResolving: false, resolutionError: action.payload, resolutionRows: [] }

  case 'SET_CREATOR_ORIGIN_NETWORK':
    return {
      ...state,
      creator: { ...state.creator, originNetworkId: action.payload, previewAddress: null, previewError: null, createdTxHash: null, createError: null }
    }

  case 'SET_CREATOR_ORIGIN_ADDRESS':
    return {
      ...state,
      creator: { ...state.creator, originAddress: action.payload, previewAddress: null, previewError: null, createdTxHash: null, createError: null }
    }

  case 'START_PREVIEW':
    return { ...state, creator: { ...state.creator, isPreviewing: true, previewError: null } }

  case 'PREVIEW_SUCCESS':
    return {
      ...state,
      creator: {
        ...state.creator,
        isPreviewing: false,
        previewAddress: action.payload.previewAddress,
        previewIsDeployed: action.payload.previewIsDeployed,
        previewError: null
      }
    }

  case 'PREVIEW_ERROR':
    return { ...state, creator: { ...state.creator, isPreviewing: false, previewError: action.payload } }

  case 'START_CREATE':
    return { ...state, creator: { ...state.creator, isCreating: true, createError: null, createdTxHash: null } }

  case 'CREATE_SUCCESS':
    return { ...state, creator: { ...state.creator, isCreating: false, createdTxHash: action.payload.txHash, previewIsDeployed: true } }

  case 'CREATE_ERROR':
    return { ...state, creator: { ...state.creator, isCreating: false, createError: action.payload } }

  default:
    return state
  }
}
