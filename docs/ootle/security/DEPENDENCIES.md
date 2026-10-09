# Dependency remediation evidence

## Follow-up — 2026-10-09 (validation in progress)

The current lockfile inventory contains 36 affected names out of 2,964 locked names, down from 80 after the first pass and 116 at baseline. These are package/advisory matches, not 36 demonstrated exploits. The first planning script skipped every multi-line dependency; the corrected tool evaluates each parent and refuses downgrades or incompatible major overrides. Yarn re-resolved vulnerable selectors within declared ranges, followed by reviewed parent-specific patch/minor overrides.

Unused npm-install-version (including its npm 4 dependency), Lerna publishing, Nx Cloud, local transformer model, request/RSS, obsolete Babel 6 presets/plugins and browserify reload dependencies were removed after checking source and configuration references. The Git UI had an undeclared dateformat dependency supplied incidentally by removed tooling; it is now declared directly. TOML used by the editor is 4.2.0; an older transitive TOML remains under the inherited Amp CLI. Normal Counter TOML and prototype-isolation smoke checks pass.

`dependency-paths.mjs` records a shortest path from each direct dependency to every remaining vulnerable version. The production build's existing webpack analysis supplies main-bundle inclusion evidence. CI uploads a commit-qualified report separately from deployed assets. Package presence is not proof of vulnerable-call reachability, and absence from the main bundle does not cover copied plugin applications. Raw advisory evidence and the parent upgrade plan are adjacent JSON files.

Nx now uses its local task runner with its daemon disabled by default; the web development server binds loopback. Lifecycle scripts remain disabled. The native companion has no npm dependencies. A vulnerable local development tool is not made safe by static deployment; do not interpret the report as a clean dependency audit.

## Rust maintenance assessment

`cargo tree --locked -i` confirms these exact paths under test tooling:

- `tari_template_test_tooling → tari_engine → tari_utilities → bincode 1.3.3`. The parent exposes blanket Serde-based binary serialization/deserialization in `message_format.rs`; substituting another format changes binary compatibility. [RustSec](https://rustsec.org/advisories/RUSTSEC-2025-0141.html) lists no patched version. Its alternatives require an upstream format/API migration, not a version override.
- `tari_template_test_tooling → tari_engine → wasmer → paste 1.0.15`, also through Wasmer compiler → libwild → linker-utils. [RustSec](https://rustsec.org/advisories/RUSTSEC-2024-0436.html) recommends pastey; both parent manifests must migrate the dependency alias. There is no patched paste release.
- `tari_template_test_tooling → tari_engine → wasmer → wasmer-derive → proc-macro-error2 2.0.1`. Wasmer's derive uses the attribute and abort macro for invalid ValueType layouts. [RustSec](https://rustsec.org/advisories/RUSTSEC-2026-0173.html) lists no patched release; replacing it requires changing the parent procedural macro and checking compile-failure diagnostics.

These remain unsuppressed maintenance warnings, not fixed defects. The release WASM dependency closure excludes all three. Existing security patches repair faster-hex/memmap2 and replace yanked yoke-derive; Linux CI remains the acceptance route for real Counter engine tests, WASM and encrypted companion compilation.

## Earlier delivery evidence


The supplied npm count was reproduced: 116 affected package names out of 3,324 locked names (inventory, not 116 confirmed reachable vulnerabilities). `audit-node.mjs` records the raw advisory ranges/URLs. `suggest-node-upgrades.mjs` identifies advisory-free releases within a single installed compatibility line. The selected 36 compatible package updates plus direct Axios 1.20.0 reduce this to 80 affected names (3,333 locked names). Exact before/after inventory and selection are adjacent JSON files. All installs now disable lifecycle scripts, including repository default `.yarnrc`, CI and Vercel. The native companion itself has zero npm dependencies.

Remaining inherited packages include multiple old major lines, packages with no repaired compatible release, and Nx 15 / legacy Babel, npm, archive, development-server and Ethereum tooling. They are not declared safe or fixed by a passing bundle. Replacing the entire Remix build system or forcing incompatible majors is a separate migration with a much larger regression surface. The exploit chain into local Cargo is removed by local-only origins, encrypted pairing, independent terminal consent and hosted CSP. CI has read-only permissions and no application secrets, no persistent checkout credentials and no install scripts; only push artifacts have commit-qualified names. Static builds include hashes and local script SRI. Do not run development servers against untrusted network clients or build unreviewed forks with host secrets.

Rust: two small parent crate patches select upstream repaired faster-hex 0.10.1 and memmap2 0.9.11 while retaining the pinned Tari APIs. Yanked yoke-derive is updated to 0.8.4. Linux run 37675961804 passed both Counter engine tests, WASM release build and real encrypted HTTP companion smoke. cargo-audit reports zero vulnerabilities and no yanked packages; see rust-audit.json and the vendor security note. Unmaintained bincode/paste/proc-macro-error2 in upstream test tooling are maintenance warnings with no drop-in repaired version; they remain explicitly tracked, not suppressed as fixed. The downloadable WASM dependency closure does not include test tooling. Validate that closure with `cargo tree --locked --target wasm32-unknown-unknown --edges normal --manifest-path templates/tari-counter/Cargo.toml`.

The macOS cargo-audit installation was unable to execute several freshly compiled build scripts (SIGKILL; other build scripts stalled). The existing proven Linux CI route is used for Rust audit and real engine/build evidence. A local fixture pass is not a Cargo acceptance claim.
