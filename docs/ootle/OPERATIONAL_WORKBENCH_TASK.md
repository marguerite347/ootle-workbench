# Operational Workbench: execution instructions

## User mandate and definition of done
The user approved finishing direct external-agent integrations and adding hosted Tari compilation/testing, with written implementation instructions. Use GitHub sign-in and the dedicated Supabase database already provisioned. The usable release must support: create a Counter workspace in the real Remix editor -> explicitly share -> sign in -> authorize a real external agent -> agent reads and edits files -> review and apply changes -> compile/test the exact shared version in isolated Linux -> inspect actual diagnostics and download verified WASM -> revoke access. Reopening must preserve shared files, results and permission state.

This task does not silently expand into blockchain transactions, public publishing or arbitrary hosting. Embedded model chat is a follow-on using the same project capabilities; external agents supply the first real AI experience. Clearly distinguish a connection to an agent application from a provider API integration. Do not claim native Codex/Cowork acceptance from SDK tests alone.

## Resource selection receipt
- Reuse the checked-out Remix fork, branch feat/connected-agents, existing plugin/filesystem and review UI, official MCP SDK 1.32.0, PostgreSQL service and ownership checks. Baseline connected-agent commit f785ecd. Preserve existing work and browser workspaces.
- Reuse the pinned Counter with Cargo.lock and its real Linux CI tests (Rust 1.95.0, Tari library 0.32.0, tooling 0.41.0).
- Execution gap: the loopback Cargo companion is trusted-local-only. It must never become a public runner. Select official @vercel/sandbox SDK, pinned 3.5.1, authenticated through the dedicated Vercel project's OIDC identity. It provides a separate microVM for each build and supports stopped-job retrieval and network policy. Verify with a real Counter trial before integrating it.
- Auth remains GitHub basic identity only; no repository scopes. Supabase remains private service storage. Do not copy operator credentials into the frontend, user VM, logs, handoff, or Git.
- Current Vercel Hobby Sandbox has included usage and pauses at its limit; do not change subscription or enable paid overages. Bound service use further with durable daily job quotas and concurrency limits.

## Build design and invariants
1. Build requests require an authenticated owner or an explicitly approved project build scope. Existing grants must never gain build permissions silently.
2. Select a shared project and expected version. Capture an immutable snapshot and SHA-256. Jobs continue to refer to that snapshot even if agents subsequently edit the project.
3. Store job ownership, status, provider handle, timestamps, command ID, digest, bounded diagnostics and artifact metadata durably. Use database serialization for quotas and lifecycle transitions. Do not rely on an in-memory queue or a serverless function remaining alive.
4. Fresh isolated VM per job, no host mounts, no provider/database/identity secrets inside. Fixed compile/test commands; never interpolate project names or user shell strings. Require Cargo.lock. Bounded runtime, CPU, memory, logs, artifact size and daily jobs. Lock dependencies and label network policy accurately.
5. Bootstrap the pinned compiler in a trusted image/snapshot before accepting user files. Cached baseline dependencies may be cloned; never reuse a previous user's writable VM or cache. A stopped per-job VM may retain a seven-day private disk snapshot solely to recover its result after browser closure; delete it once the result is collected. Narrow build network egress to required registries, or deny network for a fully cached supported starter. Test denied egress.
6. Starting work returns a durable job promptly. Browser and MCP can poll progress, inspect logs, cancel, and retrieve artifacts. Polling must enforce ownership/project scope. Completion is determined by actual command exit status. Missing/invalid WASM means failure, even after exit 0.
7. Download only validated WASM bytes, with SHA-256 and source digest. Finish/cancel/timeout must stop VM resources. Preserve a readable result after VM disposal; disclose result retention.
8. Render all provider diagnostics and project text as text, never HTML. Errors distinguish missing configuration, capacity, auth expiry, dependency failure and compiler diagnostics. Keep Retry/Cancel/Back paths available.

## Authentication completion
Configure a dedicated GitHub OAuth app at https://ootle-workbench-agents.vercel.app/login/callback. Keep secrets server-side; credential entry requiring handoff must be completed by the user, never requested in chat. Match OAuth discovery metadata to supported client auth methods. Validate S256 PKCE, expiry, refresh replay, redirects, CSRF, project ownership and immediate revocation. Test real GitHub callback and at least one native agent; document other clients as unverified until exercised.

## Acceptance and release evidence
- Real isolated Counter compile AND engine tests, plus an intentional syntax failure, cancellation, timeout and blocked network test.
- Cross-account/project denial, stale-version rejection, read-only/no-build grant denial, concurrent quota handling, and revoke-before-next-call.
- Reopen job from a fresh service instance; show identical digest/log/result. Artifacts survive VM cleanup.
- Chrome desktop and narrow review of sign-in, sharing, agent instructions, version conflict, build progress, error and download. Test via the real Remix file API.
- Production build and meaningful existing regression tests; review diff for secrets and unintended upstream changes.
- Commit all source, update draft PR #3 around final scope, deploy exact committed revision, record URLs and proof. Local, fixture, preview and production evidence remain separate.
- A disabled button, healthy HTTP endpoint, draft PR, or invented output is never completion. Document external blockers precisely and finish independent work before requesting user action.

## Implementation checkpoint
The representative Vercel Sandbox trial built the pinned starter and passed both real Tari engine tests. Valid WASM: 107595 bytes; SHA-256 a8141b0df0e861ff1c3d339243130bac442eff4c7a9f32f54daaede04e86a594. Deny-all egress rejected an HTTPS request to example.com. The trusted snapshot is 2261871445 bytes and contains the pinned toolchain and baseline dependency cache; no user credentials. Build jobs receive only explicitly shared text files.

Implemented: durable job states in existing private PostgreSQL records; exact source version/digest; explicit workspace:build OAuth scope; build/test/status/cancel/artifact MCP tools; browser job controls; one active job and six daily jobs per account (two concurrent/twelve daily across pilot); 20-minute timeout; bounded logs and validated 8 MiB maximum WASM; seven-day result retention. The SDK status adapter uses a bounded wait because a non-waiting command lookup returned null exit status after real compilation had finished. Never infer completion from log text.

GitHub OAuth application 3904623 is registered and its client ID is configured. Pending external acceptance: GitHub account verification and server client-secret setup, real GitHub callback and production native Codex/Cowork login. Native Codex token exchange has passed against the local fixture via the documented no-browser callback flow; browser consent and real identity remain unverified. Keep these unresolved until exercised.
