# CLI and GraphQL maintenance — November 4, 2026

The maintained Node 24 workspace now uses Commander 15.0.0, Chokidar 6.0.0, latest-version 9.0.0 and GraphQL 17.0.2. Remixd plugin manifests now match the 0.3.44 family already used by the root build. Local package engine floors are explicit; the Electron desktop graph is unchanged. This is source maintenance, not npm publication.

Validation on Node 24.19.0: 50 catalog, transport, compiler, workspace and dependency regressions passed; all 12 library builds and the production IDE build passed. The real simulator CLI parser and temporary-directory watcher passed. Remixd's actual version-check function successfully read official npm metadata through its CommonJS output, and a GraphQL schema/query fixture passed. No wallet or transaction was used. Existing CSS calc warnings remain in the production build.

The refreshed official npm bulk advisory inventory covers 2,659 package names and reports 10 affected names. Updating latest-version removes the old got path from this lockfile; the remaining advisories and incompatible migrations retain their individual maintenance dispositions. Passing builds do not imply a clean advisory inventory.

Deployment and independent live acceptance remain separate release requirements, recorded in the dedicated maintenance workspace.

## Separate end-to-end test dependency graph

The e2e manifest references the locally built Remixd package, not the npm release. Its lockfile now follows the current local manifest (Commander 15, Chokidar 6, latest-version 9 and plugin 0.3.44), and its Node floor matches the maintained Node 24 workspace. Refreshing only that local package preserves unrelated locked versions and removes the e2e got 9 path. A broader Yarn upgrade was rejected because it changed unrelated Solidity/Ethereum dependencies.

The installed e2e consumer passed the CLI parser/watcher fixtures and actual Remixd `--help`; six transport, watcher and transitive regressions passed. The full e2e TypeScript build initially reported 20 test-source errors. Explicit browser-script parameter types, obsolete unused Nightwatch imports, an unused synchronous-script callback and a typed DOM query fix the compilation; the Git test now checks absence with a negative assertion instead of calling unconditional `fail(boolean)`. The e2e TypeScript build passes after these corrections. This is compilation and scoped consumer validation, not execution of the wallet/browser suite.

The fresh e2e advisory inventory covers 442 package names and retains three affected names (elliptic, minimatch and zod), with separate assessed migration records. No wallet, network transaction, credentials or external Git action was performed by these tests.

## TypeScript checker release guard

Inspection of the merged e2e update's CI log found that the checker worker exhausted its default 2 GiB heap while webpack still reported success. That artifact was held from production. The IDE now gives the checker 4 GiB, resolves dependency package exports with TypeScript's bundler mode, and turns the checker's public error hook into a webpack compilation error. The setting is scoped to the bundled IDE; library and end-to-end compiler configurations are unchanged.

Selection receipt: reuse the installed fork-ts-checker-webpack-plugin 7.2.13 error hook and the existing Nx/webpack build. Its documented memory option and TypeScript's documented bundler resolution fit the observed failure without disabling checks or replacing the build pipeline. A real webpack fixture passes normally and fails on an injected checker-worker exit (two tests). The larger heap first exposed 19 errors from dependency source files selected by legacy Node resolution; a full IDE type-check trial using package-export-aware bundler resolution passed. The resulting production IDE build and its 11 prerequisite tasks passed on Node 24.19.0 / TypeScript 5.5.4, retaining the existing CSS and asset-size warnings.

References: https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#typescript-options and https://www.typescriptlang.org/tsconfig/moduleResolution.html. Local evidence: `typecheck-failure-regression.log`, `typecheck-full-build.log`, `typecheck-resolution-trace.log`, `typecheck-bundler-trial.log`, and `typecheck-full-build-bundler.log` in the November 4 maintenance evidence directory. Exact merged CI and live acceptance are still separate gates.
