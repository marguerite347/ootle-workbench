# Workbench security remediation — follow-up 2026-10-09

Baseline: production feature branch `956f33c`, audit fork point `59f2e9c439`. Scope includes the supplied findings and current callers. Existing shared agent service is preserved; repository contributor enrollment remains the owner's explicit open policy.

## Current delivery — 2026-10-09

Production **https://ootle-workbench.vercel.app/** serves source revision **c18358918af16804e2d2fbbf9d2eb540935a46af**. [CI run 37947266225](https://github.com/marguerite347/ootle-workbench/actions/runs/37947266225) passed all three jobs. Deployment: `dpl_CYtkxkxsTzLyKFpHhotUh21U7r8d` (`https://ootle-workbench-k1iq1ectz-peekaboo4.vercel.app`). The later report-only commit does not relabel the deployed runtime.

This follow-up removes actual upstream startup callers and redirects, prunes unused dependency stacks, repairs four browser dependency integrations, and records exact emitted versions. The lockfile advisory inventory is **34 affected names / 2,964**, down from 80 after the first pass and 116 in the supplied baseline. Only braces 3.0.3 and elliptic 6.6.1 match advisory ranges in the main webpack bundle. Other tooling/copied-plugin risks and three Rust maintenance warnings remain open; this is not a zero-advisory result. See [dependency evidence](security/DEPENDENCIES.md) and the unchecked dependency tasks below.

## Selection receipt
Reuse Node's built-in HTTP/crypto/test libraries, existing companion fixtures, Remix filesystem/plugin architecture, existing cloud workers, production Nx build and Vercel static packaging. Initial trial: existing four companion tests passed on this baseline. Gap: the existing browser trust flag and bearer token cannot establish local execution consent or authenticate a listener. Replace that protocol; no new dependency or hosted invitation service is needed.

## Task list and acceptance instructions
Follow-up 2026-10-09 is deployed and verified below. S13 and delivery are complete. S5 and S11 remain partial because inherited library advisories and maintenance warnings remain unresolved; the completed upgrades, exposure assessment and validation do not make those libraries repaired. Earlier delivery sections describe only earlier revisions.

- [x] S1 / HIGH 1: remove URL `call`/`calls` dispatch; enforce file-write permission denial. Test a harmless planted-file link in the real UI and denial in a regression test.
- [x] S2 / HIGH 2, MEDIUM 4/7: local-only origins; companion terminal approval displaying action, file list, per-file hashes, full source digest and toolchain; expiring single-use approval token. No browser checkbox consent, no Origin bypass. Test denied/expired/replayed/changed approvals.
- [x] S3 / HIGH 3: authenticated encrypted companion requests/responses, pairing key never transmitted; validate capabilities/results; bounded WASM-only downloads and browser SHA-256 verification; remove unsafe terminal HTML parsing. Test impersonation, object logs, wrong hashes, filenames and response limits.
- [x] S4 / MEDIUM 5: unique disposable Cargo home, target and workspace per run, pinned toolchain and minimal environment; cleanup on success/failure/cancel; label hashes as content checks, not provenance. Test state separation and cleanup.
- [ ] S5 / MEDIUM 6: refresh dependency evidence, upgrade compatible security fixes, disable install lifecycle scripts, record build artifact checksums and deployment revision. Assess remaining upstream dependencies explicitly.
- [x] S6 / LOW action/inputs/errors: own-property action lookup, strict request schemas, safe public errors and log path redaction; regression tests for prototype actions and null.
- [x] S7 / LOW Host/OPTIONS/headers/reclaimable names: exact loopback Host and Origin on every request, constrained preflight, CSP/frame-ancestors/Referrer-Policy/nosniff; disallow hosted origins even if configured.
- [x] S8 / LOW CI: pin action commits, disable checkout credential persistence, push-only commit-qualified artifacts; prune inherited publishing/automation workflows and hardcoded Etherscan credential.
- [x] S9 / LOW resources: serialize approval/build and assistant independently, bounded request/response/log/artifact totals, timeouts, disposable output and aborted-request cleanup.
- [x] S10 / LOW compile semantics: reject workspace Cargo/toolchain configuration overrides; warn that build scripts, proc macros and tests can read host files and execute native code. No sandbox claim; review exact snapshot locally.
- [ ] S11 / LOW Rust advisories: rerun cargo audit including yanked packages, update compatible patches, document any upstream-only/no-fix advisory and validate real Counter tests/WASM in Linux CI.
- [x] S12 / LOW root/digest/audit: absolute private data root with ownership/mode/symlink checks; bytewise canonical paths and toolchain/action identity; structured bounded secret-free audit events.
- [x] S13 / LOW upstream services: remove third-party scripts, disable Matomo and automatic upstream cloud/telemetry activation; verify live browser requests/functionality.
- [x] S14 / LOW prompt injection: delimit untrusted context, reinforce no-tools advisory behavior; do not describe model guidance as verified evidence.
- [x] S15 / LOW template parity: CI compares embedded Cargo/source/test files against canonical template files; prove drift fails.
- [x] S16 / LOW submission draft: include artifact/source binding and explicit unverified repository commit/ownership status; reject publication claims, preserve separate authenticated future publishing boundary.
- [x] S17 / delivery: run regression suite, production build, desktop/mobile UI and harmful-link negative checks; commit/push, deploy exact revision, verify live revision and response headers. Record remaining limitations without marking untested claims fixed.

## Historical implementation checkpoint — superseded by acceptance below

S1-S4 and S6-S16 have implementations; final acceptance remains in progress. Eleven security regressions and 21 existing agent-service tests pass. First production build passed on baseline dependencies; upgraded clean-install build and browser verification are underway. Browser startup found and corrected a Matomo no-op compatibility regression. Dependency scope/dispositions are in [security/DEPENDENCIES.md](security/DEPENDENCIES.md). No production deployment has been claimed at this checkpoint.

## Linux validation, first pass

Run https://github.com/marguerite347/ootle-workbench/actions/runs/37675961804 at `2e09c7f`: both real Counter engine tests passed (public read/denied write, rollback); release WASM and encrypted HTTP companion smoke passed. Downloaded WASM: 108,043 bytes, SHA-256 `f65e329e896f41e3a9a0259d0b650a1151edcc47489bbeb24204010c2f017243`. Rust audit: zero vulnerabilities, zero yanked dependencies, three unsuppressed maintenance warnings; complete report in `security/rust-audit.json`. Web build found Handlebars' updated `Template` union type at the doc-generator partial call; narrowed it to the function type actually registered by this renderer. Final web build still required.

## Consent and resource acceptance

Interactive terminal fixture: the real `terminalApproval` displayed the action/toolchain, source/build-input digests, every filename/size/hash and a BUILD SCRIPT warning. Typing `deny` refused execution. Typing the fresh challenge authorized exactly one explicitly labelled fixture call; replay was refused. This tests terminal consent, not a simulated native compilation. Real Cargo acceptance is the separate passing Linux smoke run above.

The security suite now also covers case-insensitive path aliases, expired approvals, non-TTY denial, bounded log tails, private audit rotation, assistant concurrency, artifact count/size/symlink rejection and cleanup after exceptions. Existing agent-service tests remain unchanged and pass.

Build workflow refinement: the updated web bundle compiled in Linux run 37676836247, but packaging correctly failed on an obsolete script tag inside an HTML comment. Packaging now ignores commented tags and the obsolete comment is removed. The packager and hash verifier were exercised against the existing static output before another CI run. Local native-loader stalls were resolved by reusing preinstalled `.node` modules only after exact SHA-256 equality checks; dependencies were not downgraded and no OS protections were changed.

## Implementation disposition

| Audit finding | Implemented change and acceptance |
| --- | --- |
| HIGH 1 | Removed both URL method dispatchers, enforced denied file-write permissions, and replaced sticky trust with per-snapshot terminal consent. Real Chrome loads with harmless `#call` and `#calls` write probes created neither file. Permission regression proves denied writes never reach the provider. |
| HIGH 2 | Hosted origins are rejected by companion configuration and transport. Hosted UI exposes no local pairing key control. Paddle/Tally removed, Matomo inert, automatic upstream cloud services denied, restrictive response CSP and security headers installed. |
| HIGH 3 | Authenticated AES-GCM requests and responses conceal source from an unpaired listener; raw pairing key never goes over HTTP. Strict bounded results, string-only terminal output, WASM validation and browser-recomputed SHA-256. Fake-listener, object-output, executable-name and forged-checksum tests pass. A harmless browser srcdoc script could not set its marker: inherited CSP blocked inline execution. |
| MEDIUM 4 and 7 | Terminal displays action, complete filenames and per-file hashes, source/build-input hashes and pinned toolchain. Fresh one-use execution grant expires, binds stored immutable files/action/origin, and rejects replay/extra parameters. Missing Origin and headless approval fail closed. Real browser pairing and terminal denial tested. |
| MEDIUM 5 | Unique disposable source, Cargo home, HOME and target per run; cleanup on success, exceptions, abort and shutdown. Reject ancestor Cargo config. Source hash labelled content identity, never reproducible provenance. Native execution remains explicitly trusted and unsandboxed. |
| MEDIUM 6 | Compatible patch/minor upgrades, four tested browser-parent major overrides, and unused dependency removal. Frozen lifecycle-disabled installs, commit-qualified CI artifacts, SHA-256 manifest and entry-script SRI. Inventory reduced from 116 at baseline / 80 after the first pass to 34 affected package names. Exact emitted-version evidence finds only braces and elliptic among flagged versions in the main bundle. Remaining library and local-tool risks are unsuppressed; see security/DEPENDENCIES.md and security/node-exposure.json. Agent-service npm audit separately reports zero vulnerabilities. |
| LOW action/errors/Host | Own-property dispatch, schema validation, generic public internal errors, log path redaction, exact Host/Origin and constrained OPTIONS; tests pass. |
| LOW CI/inherited credentials | Actions pinned to commits, checkout credentials not persisted, only push artifacts have commit-qualified names, six inherited automation workflows removed, both hardcoded Etherscan fallback keys removed. |
| LOW resources | Bounded request/response/artifact totals, fixed-size log ring, independent build/assistant serialization, timeouts and private rotating audit journal. Tests cover count/size/symlinks, overlap and cleanup. |
| LOW compile semantics/reclaimable origins | Workspace `.cargo` and rust-toolchain overrides rejected; only exact local HTTP origins accepted. Terminal and UI disclose scripts, macros, tests, private-file and network access. A future recycled hosted hostname cannot authorize the companion. |
| LOW Rust | faster-hex and memmap2 repaired via two small parent manifest patches, yanked yoke-derive replaced. Linux Cargo engine tests, WASM and actual HTTP companion build pass. Audit: zero vulnerabilities/yanked/unsound warnings; three unsuppressed unmaintained test-tooling warnings remain. |
| LOW root/digest/audit | Absolute owned non-symlink 0700 root, 0600 pairing key/audit files, bounded journal rotation, NFC path validation and UTF-8 byte ordering, toolchain/action-aware build-input hash. Tests pass. |
| LOW upstream services | Named upstream cloud services, remote script runner and marketing nudges cannot autostart or be restored/requested; Matomo never loads. Removed service discovery, fresh-visitor/mobile redirects, tips/scam/release-feed startup callers. Untruncated local browser captures found no upstream service/feed requests after startup. Public GitHub plugin metadata and icons remain; this is not removal of every upstream UI module. |
| LOW prompt injection | File context is explicitly untrusted model data; assistant has no tools and cannot apply changes, compile or transact. Model advice remains unverified and requires review; text instructions do not guarantee a model never gives misleading advice. |
| LOW template parity | Canonical and embedded build-input sets/bytes checked in CI, including patched vendor sources. Intentional source drift was rejected and restored parity passed. |
| LOW submission | Schema-2 draft carries source/artifact hashes, optional full commit and explicit unauthenticated/unverified ownership/commit fields. Export remains a draft, not an authenticated Lobby publication. |

## Browser and regression acceptance

19 security tests and 21 existing agent-service tests pass. The local production bundle opens the Counter workspace, renders the editor and accepts edits; test edits were undone. Both malicious-link entry points were inert. Browser-to-fixture pairing authenticated, displayed a 15-file terminal approval, and denial returned an explicit refusal without invoking Cargo. This fixture is not native compilation evidence; Linux CI supplies the real Cargo result. A transient harmless iframe test was removed by reload. Desktop and 390px inspection found readable wrapping of the security controls; the inherited multi-panel IDE shell still overflows a narrow phone viewport and is not claimed to be fully mobile-optimized. Connected-agent service configuration and existing connection controls load correctly.

## Remaining boundaries

- 34 inherited npm package names still match advisory ranges. Exact-version bundle evidence and dependency paths are recorded; braces and elliptic remain in the main bundle, with caller boundaries explained in security/DEPENDENCIES.md. The other names remain in local tooling or copied plugin dependency paths. This is not a zero-advisory upstream migration and no unresolved library is labelled repaired.
- Three Rust maintenance warnings remain in Tari test tooling: bincode, paste and proc-macro-error2. They are not part of the release WASM's normal dependency closure.
- Local terminal consent authorizes native code as the developer OS user. Disposable directories reduce accidental shared-cache reuse; they do not contain deliberately malicious code after approval or a compromised installed toolchain.
- Source/checksum binding proves which bytes were submitted/downloaded, not trustworthy source, toolchain, ownership or on-chain publication.

## Earlier CI and artifact acceptance — a174c14

[Run 37679684605](https://github.com/marguerite347/ootle-workbench/actions/runs/37679684605), revision `a174c148e28022fdad3ff2eef42e31989ed817dd`: **all three jobs passed** (IDE, Tari and dependency audit). This includes clean lifecycle-disabled installs, 21 agent-service tests, 19 security tests, template parity, production bundle, packaging/hash verification, actual Counter engine tests, WASM and encrypted companion smoke. Earlier cancelled runs are not acceptance evidence.

The downloaded CI archive matched the manifest for every substantive file. GitHub's artifact upload default omitted two empty `.gitkeep` entries; their zero-byte content was restored against the manifest's SHA-256, then all 793 entries verified. Future web artifact uploads explicitly include hidden files. This upload-only workflow setting does not alter the compiled code. The production artifact is the CI bundle at `a174c14`; later report/workflow commits do not relabel that runtime revision.

The hosted preview opened successfully with the production headers, no companion pairing control and disabled local Cargo buttons. Browser network evidence confirmed CSP, frame-ancestors, DENY, no-referrer, nosniff and Permissions-Policy; static entry-script SRI was present. Existing agent service configuration loaded. The native Vercel binary stalled on this Mac; its documented Node fallback completed the deployment without changing system security settings.

## Earlier production delivery — a174c14

Deployed the verified CI artifact to **https://ootle-workbench.vercel.app/**, deployment `dpl_9R4mLXsV5ReVwbfj4hqb2qfm3pKs` (`https://ootle-workbench-7zspaz9cw-peekaboo4.vercel.app`). The public site's build metadata returns HTTP 200 without credentials and revision **a174c148e28022fdad3ff2eef42e31989ed817dd**. The live document returns HTTP 200 with the expected strict CSP, DENY, no-referrer, nosniff and permissions headers. Browser rendering verified the disabled hosted native-Cargo controls, absence of companion pairing UI, and SRI-bearing CI entry scripts (`main.0bf864eb82b666da.js`, `runtime.8bcc70d5e5028f9c.js`). Existing browser workspaces were retained. Test companion/server processes were stopped and temporary probe frames/tabs removed.

The final report and artifact-upload metadata follow-up do not change application code. YAML parsing verified `include-hidden-files: true` on the web artifact step; all downloaded substantive bytes and the two restored empty placeholders match the CI manifest. Application acceptance remains the successful CI run and live artifact identified above.

## Follow-up implementation history — 2026-10-09

Reuse the existing npm advisory inventory, Yarn Classic resolver, production build, security tests and Linux Cargo validation. The first upgrade tool incorrectly skipped packages with multiple compatibility lines. Trial: invalidate only vulnerable lock selectors in five package families and let Yarn resolve their existing declared ranges; do not force incompatible global overrides. Reassess remaining dependency paths and remove upstream request callers, then validate and deliver a new exact revision.

Follow-up implementation checkpoint: advisory inventory is now 36/2,964, with per-parent compatible fixes, removal of unused dependency roots and an editor TOML upgrade. Startup no longer requests Remix service discovery, fresh-visitor redirects, promotional tips/scam feeds or the remote script-runner catalog. Restored script-runner activation is denied. Local task cache replaces Nx Cloud, daemon defaults off and development binds loopback. Twenty security tests and 21 agent-service tests pass. First follow-up build caught the Git UI's undeclared dateformat import; declared it directly. A new production build and CI acceptance are pending; this checkpoint is not a production-delivery claim.

Review of c0f5aad..190327e found an additional inherited mobile redirect to mobile.remix.live, independent of the removed fresh-visitor route. Removed it and its URL/localStorage flag logic; startup regression now guards against any location.replace in preload. Dependency evidence generation now fails in CI if webpack stats are missing, instead of silently publishing an incomplete report.

Bundle evidence trial exposed a real gap in the existing analyzer: its writeStats resolves on the readable stream's end rather than the destination's finish, and Nx exited with truncated JSON despite a saved-file message. Replace only security-mode reporting with a small webpack completion hook that synchronously records emitted package names/versions, without source text or host paths. A real webpack fixture verified that a bundled dependency's exact version appears. This also distinguishes a vulnerable installed version from a repaired version of the same package in the browser.

Live local browser startup exposed one additional request from the top bar to the upstream release feed. Replaced the dynamic feed with the Workbench repository release URL; restored nudge-plugin activation is now denied too. The exact-version main-bundle inventory narrows the 36 remaining advisory-matching names to six present vulnerable package versions: axios, braces, elliptic, parse-duration, parse-link-header and uuid. This is inclusion evidence, not proof that every associated vulnerable API is reached.

Local browser acceptance on the follow-up: desktop startup rendered the Tari workspace and home. Captured 170 HTTP request events across two contiguous, untruncated CDP windows; none targeted remix.live, remix-dynamics or the remote script-runner catalog. At 390px with an actual iPhone user-agent override, startup rendered Workbench and stayed at the local origin. Temporary user-agent and viewport overrides were reset. Package/hash verification covered all 793 static files. This checkpoint was local acceptance; the final production acceptance below supersedes it.

Further source-backed dependency repairs: Bee/Axios, IPFS duration parsing, GitHub Link parsing and Jayson UUID were upgraded with four integration tests. All 24 security/dependency tests and the production build pass locally. The fresh inventory is 34/2,964; exact-version main-bundle matches are now braces and elliptic. Remaining library risks and their current caller boundaries are recorded in security/DEPENDENCIES.md; they are not declared repaired or suppressed.

## Final follow-up acceptance — c183589

- Linux CI: frozen lifecycle-disabled installation; 24 security/dependency tests; 21 existing agent-service tests; canonical/embedded template parity; production build, packaging and checksums. Tari job passed actual Counter engine tests, release WASM and encrypted HTTP companion build. All three jobs succeeded.
- Fresh Rust audit: zero vulnerabilities, no yanked or unsound warnings, three unmaintained warnings. Raw evidence: `security/rust-audit-followup.json`. CI-derived dependency paths and exact emitted-version matches: `security/node-exposure.json`. `security/browser-packages.json` is the equivalent local build's full package inventory, not the CI archive.
- Downloaded the commit-qualified web artifact and verified all 793 manifest entries without restoring or changing any file. Deployed those bytes as a static artifact with the repository's security headers; no dependency installation or application rebuild occurred on Vercel.
- Public live metadata, fetched with credentials omitted and cache disabled, returned HTTP 200 and c18358918af16804e2d2fbbf9d2eb540935a46af. Live HTML returned strict CSP, DENY, no-referrer, nosniff and Permissions-Policy. Entry scripts carry SRI, including main.fab030e954a650cf.js and runtime.19c72fb58a99c1af.js. Dynamically loaded Monaco scripts are same-origin and are not claimed to have SRI.
- Live desktop browser rendered the existing Counter workspace and opened Cargo.toml in the editor. Hosted native Cargo buttons remain disabled and the local companion pairing control is absent. Across two contiguous untruncated network windows, 170 startup requests contained no remix.live, remix-dynamics or script-runner-generator requests. Public GitHub metadata/icon requests remain.
- Live mobile test at 390px with an iPhone user-agent rendered Workbench and stayed on the production origin; the upstream mobile redirect is gone. Temporary viewport/user-agent overrides were reset. The inherited multi-panel layout is not claimed fully phone-optimized.
- Earlier harmful-link, denied-write, forged-response, consent/replay and CSP-browser acceptance remains documented above; the relevant automated regressions passed again in this CI. No new claim of sandboxed native execution or authenticated on-chain publication is made.

The Vercel CLI's native keyring migration stalled on this Mac. Reusing the existing Vercel authorization through its subprocess environment and the documented Node fallback completed deployment; no credential was printed or committed, and no security protection was disabled.
