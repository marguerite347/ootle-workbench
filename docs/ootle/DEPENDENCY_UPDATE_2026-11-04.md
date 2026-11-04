# CLI and GraphQL maintenance — November 4, 2026

The maintained Node 24 workspace now uses Commander 15.0.0, Chokidar 6.0.0, latest-version 9.0.0 and GraphQL 17.0.2. Remixd plugin manifests now match the 0.3.44 family already used by the root build. Local package engine floors are explicit; the Electron desktop graph is unchanged. This is source maintenance, not npm publication.

Validation on Node 24.19.0: 50 catalog, transport, compiler, workspace and dependency regressions passed; all 12 library builds and the production IDE build passed. The real simulator CLI parser and temporary-directory watcher passed. Remixd's actual version-check function successfully read official npm metadata through its CommonJS output, and a GraphQL schema/query fixture passed. No wallet or transaction was used. Existing CSS calc warnings remain in the production build.

The refreshed official npm bulk advisory inventory covers 2,659 package names and reports 10 affected names. Updating latest-version removes the old got path from this lockfile; the remaining advisories and incompatible migrations retain their individual maintenance dispositions. Passing builds do not imply a clean advisory inventory.

Deployment and independent live acceptance remain separate release requirements, recorded in the dedicated maintenance workspace.

## Separate end-to-end test dependency graph

The e2e manifest references the locally built Remixd package, not the npm release. Its lockfile now follows the current local manifest (Commander 15, Chokidar 6, latest-version 9 and plugin 0.3.44), and its Node floor matches the maintained Node 24 workspace. Refreshing only that local package preserves unrelated locked versions and removes the e2e got 9 path. A broader Yarn upgrade was rejected because it changed unrelated Solidity/Ethereum dependencies.

The installed e2e consumer passed the CLI parser/watcher fixtures and actual Remixd `--help`; six transport, watcher and transitive regressions passed. The full e2e TypeScript build initially reported 20 test-source errors. Explicit browser-script parameter types, obsolete unused Nightwatch imports, an unused synchronous-script callback and a typed DOM query fix the compilation; the Git test now checks absence with a negative assertion instead of calling unconditional `fail(boolean)`. The e2e TypeScript build passes after these corrections. This is compilation and scoped consumer validation, not execution of the wallet/browser suite.

The fresh e2e advisory inventory covers 442 package names and retains three affected names (elliptic, minimatch and zod), with separate assessed migration records. No wallet, network transaction, credentials or external Git action was performed by these tests.
