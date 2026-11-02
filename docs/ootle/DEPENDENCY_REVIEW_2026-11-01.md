# Compatible dependency update — November 1, 2026

Ethers' default 250 ms provider cache can return pre-transaction storage values when the local VM mines synchronously. The existing blocks regression exposed this: after a confirmed write from 100 to 200, the read returned 100. The IDE's local VM and the regression fixture now disable this cache with `cacheTimeout: -1`, as documented by Ethers' AbstractProviderOptions. Remote providers retain their existing configuration.

The root dependency lock updates Ethers to 6.17.0, OpenZeppelin Wizard to 0.10.17, and regenerator-runtime to 0.14.1. Existing internal package ranges remain compatible; no independent npm library publication is claimed.

## Reused workflow and validation

Reused the existing Yarn lock, simulator tests, template-explorer contract generator, twelve-library build and production build. Official registry target metadata was inspected before installing without lifecycle scripts; no replacement pipeline was needed.

- Actual template-explorer generator functions produced ERC20, ERC721 and ERC1155 source, each with standard and UUPS options. Six outputs checked for requested contract/access/pause/burn/upgrade structure. These were source-generation checks, not Solidity compilation or deployment.
- Ethers ERC20 transfer ABI encode/decode and decimal amount round-trip passed; a transformed generator completed through regenerator-runtime.
- Simulator initially had 30 passing tests and one stale-storage-read failure. After the VM cache correction, all 31 passed.
- Catalog fronts, local companion and security/browser dependency checks: 25 passed.
- `yarn build:libs`: all twelve projects passed.
- `yarn build:production`: passed; IDE webpack reports 26 warnings. Build completed early November 2 UTC during the November 1 continuation.

Raw trials and logs are retained outside Git in the dedicated maintenance workspace under `work/daily-2026-10-31/compatible-batch-*`. Browser acceptance is pending because computer use reported the Mac locked. Passing these checks is not a claim of live deployment or real-network transaction acceptance.

## Reproduction

From the repository root with the existing pinned toolchain:

```sh
yarn install --frozen-lockfile --ignore-engines --ignore-scripts
npm test --prefix libs/remix-simulator
node --test tools/catalog/fronts.test.mjs tools/tari-companion/server.test.mjs tools/security/regression.test.mjs tools/security/browser-dependencies.test.mjs
NX_NO_CLOUD=true NX_DAEMON=false yarn build:libs
yarn build:production
```

The blocks regression makes consecutive confirmed local VM writes and reads storage after each write. Its provider settings match `apps/remix-ide/src/blockchain/providers/vm.ts`.
