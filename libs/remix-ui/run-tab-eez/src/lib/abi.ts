// Hand-written minimal ABI for the EEZ cross-chain proxy primitives this plugin needs.
// No ABI artifacts are published by the eez-core-protocol repo (Foundry output is
// gitignored there), so this fragment is kept in sync manually against
// eez-core-protocol/src/base/EEZBase.sol / src/interfaces/IEEZ.sol.
export const EEZ_ABI = [
  'function computeCrossChainProxyAddress(address originalAddress, uint64 originalRollupId) view returns (address)',
  'function createCrossChainProxy(address originalAddress, uint64 originalRollupId) returns (address)',
  'function authorizedProxies(address proxy) view returns (bool isProxy, address originalAddress, uint64 originalRollupId)',
  'event CrossChainProxyCreated(address indexed proxy, address indexed originalAddress, uint64 indexed originalRollupId)'
]
