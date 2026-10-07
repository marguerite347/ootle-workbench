# Workbench security remediation — 2026-10-07

Baseline: production feature branch `956f33c`, audit fork point `59f2e9c439`. Scope includes the supplied findings and current callers. Existing shared agent service is preserved; repository contributor enrollment remains the owner's explicit open policy.

## Selection receipt
Reuse Node's built-in HTTP/crypto/test libraries, existing companion fixtures, Remix filesystem/plugin architecture, existing cloud workers, production Nx build and Vercel static packaging. Initial trial: existing four companion tests passed on this baseline. Gap: the existing browser trust flag and bearer token cannot establish local execution consent or authenticate a listener. Replace that protocol; no new dependency or hosted invitation service is needed.

## Task list and acceptance instructions
Status starts pending. Each task must have code, tests/evidence and an honest disposition before final report.

- [ ] S1 / HIGH 1: remove URL `call`/`calls` dispatch; enforce file-write permission denial. Test a harmless planted-file link in the real UI and denial in a regression test.
- [ ] S2 / HIGH 2, MEDIUM 4/7: local-only origins; companion terminal approval displaying action, file list, per-file hashes, full source digest and toolchain; expiring single-use approval token. No browser checkbox consent, no Origin bypass. Test denied/expired/replayed/changed approvals.
- [ ] S3 / HIGH 3: authenticated encrypted companion requests/responses, pairing key never transmitted; validate capabilities/results; bounded WASM-only downloads and browser SHA-256 verification; remove unsafe terminal HTML parsing. Test impersonation, object logs, wrong hashes, filenames and response limits.
- [ ] S4 / MEDIUM 5: unique disposable Cargo home, target and workspace per run, pinned toolchain and minimal environment; cleanup on success/failure/cancel; label hashes as content checks, not provenance. Test state separation and cleanup.
- [ ] S5 / MEDIUM 6: refresh dependency evidence, upgrade compatible security fixes, disable install lifecycle scripts, record build artifact checksums and deployment revision. Assess remaining upstream dependencies explicitly.
- [ ] S6 / LOW action/inputs/errors: own-property action lookup, strict request schemas, safe public errors and log path redaction; regression tests for prototype actions and null.
- [ ] S7 / LOW Host/OPTIONS/headers/reclaimable names: exact loopback Host and Origin on every request, constrained preflight, CSP/frame-ancestors/Referrer-Policy/nosniff; disallow hosted origins even if configured.
- [ ] S8 / LOW CI: pin action commits, disable checkout credential persistence, push-only commit-qualified artifacts; prune inherited publishing/automation workflows and hardcoded Etherscan credential.
- [ ] S9 / LOW resources: serialize approval/build and assistant independently, bounded request/response/log/artifact totals, timeouts, disposable output and aborted-request cleanup.
- [ ] S10 / LOW compile semantics: reject workspace Cargo/toolchain configuration overrides; warn that build scripts, proc macros and tests can read host files and execute native code. No sandbox claim; review exact snapshot locally.
- [ ] S11 / LOW Rust advisories: rerun cargo audit including yanked packages, update compatible patches, document any upstream-only/no-fix advisory and validate real Counter tests/WASM in Linux CI.
- [ ] S12 / LOW root/digest/audit: absolute private data root with ownership/mode/symlink checks; bytewise canonical paths and toolchain/action identity; structured bounded secret-free audit events.
- [ ] S13 / LOW upstream services: remove third-party scripts, disable Matomo and automatic upstream cloud/telemetry activation; verify live browser requests/functionality.
- [ ] S14 / LOW prompt injection: delimit untrusted context, reinforce no-tools advisory behavior; do not describe model guidance as verified evidence.
- [ ] S15 / LOW template parity: CI compares embedded Cargo/source/test files against canonical template files; prove drift fails.
- [ ] S16 / LOW submission draft: include artifact/source binding and explicit unverified repository commit/ownership status; reject publication claims, preserve separate authenticated future publishing boundary.
- [ ] S17 / delivery: run regression suite, production build, desktop/mobile UI and harmful-link negative checks; commit/push, deploy exact revision, verify live revision and response headers. Record remaining limitations without marking untested claims fixed.

## Implementation checkpoint

S1-S4 and S6-S16 have implementations; final acceptance remains in progress. Eleven security regressions and 21 existing agent-service tests pass. First production build passed on baseline dependencies; upgraded clean-install build and browser verification are underway. Browser startup found and corrected a Matomo no-op compatibility regression. Dependency scope/dispositions are in [security/DEPENDENCIES.md](security/DEPENDENCIES.md). No production deployment has been claimed at this checkpoint.

## Linux validation, first pass

Run https://github.com/marguerite347/ootle-workbench/actions/runs/37675961804 at `2e09c7f`: both real Counter engine tests passed (public read/denied write, rollback); release WASM and encrypted HTTP companion smoke passed. Downloaded WASM: 108,043 bytes, SHA-256 `f65e329e896f41e3a9a0259d0b650a1151edcc47489bbeb24204010c2f017243`. Rust audit: zero vulnerabilities, zero yanked dependencies, three unsuppressed maintenance warnings; complete report in `security/rust-audit.json`. Web build found Handlebars' updated `Template` union type at the doc-generator partial call; narrowed it to the function type actually registered by this renderer. Final web build still required.

## Consent and resource acceptance

Interactive terminal fixture: the real `terminalApproval` displayed the action/toolchain, source/build-input digests, every filename/size/hash and a BUILD SCRIPT warning. Typing `deny` refused execution. Typing the fresh challenge authorized exactly one explicitly labelled fixture call; replay was refused. This tests terminal consent, not a simulated native compilation. Real Cargo acceptance is the separate passing Linux smoke run above.

The security suite now also covers case-insensitive path aliases, expired approvals, non-TTY denial, bounded log tails, private audit rotation, assistant concurrency, artifact count/size/symlink rejection and cleanup after exceptions. Existing agent-service tests remain unchanged and pass.

Build workflow refinement: the updated web bundle compiled in Linux run 37676836247, but packaging correctly failed on an obsolete script tag inside an HTML comment. Packaging now ignores commented tags and the obsolete comment is removed. The packager and hash verifier were exercised against the existing static output before another CI run. Local native-loader stalls were resolved by reusing preinstalled `.node` modules only after exact SHA-256 equality checks; dependencies were not downgraded and no OS protections were changed.
