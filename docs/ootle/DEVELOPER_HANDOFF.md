# Ootle Workbench: what works and what remains

This is an actual fork of Remix v2.6.5 (`59f2e9c43971a216c6981e30796a40141d4a78bb`), not the earlier Lobby editor imitation. `ootle` is the product branch; `master` retains upstream history. Preserve upstream notices and licenses. This is a community adaptation, not a claim of Tari Labs or Remix endorsement.

## Run the IDE

Use Node 24.19.0 and Yarn 1.22.22 (upstream `.nvmrc`).

```sh
yarn install --frozen-lockfile --ignore-engines --ignore-scripts
NX_NO_CLOUD=true NX_DAEMON=false yarn build:libs
yarn build:production
node tools/package-web.mjs
node tools/security/serve.mjs
```

Open `http://127.0.0.1:8080`. `vercel.json` supplies the same install/build/output settings for a source deployment. `tools/package-web.mjs` includes the upstream license and committed revision in the static output. The static build can be self-hosted. Hosting the IDE does **not** automatically supply Cargo workers, wallets, AI providers, user authentication, app hosting or a publication database.

## Real local compilation and tests

Install a Rust toolchain compatible with edition 2024 and the WASM target. The checked-in Counter pins `tari_template_lib = 0.32.0`, `tari_template_test_tooling = 0.41.0` and its Cargo.lock. It is deliberately not silently upgraded to the latest moving SDK.

```sh
rustup toolchain install 1.95.0 --profile minimal --target wasm32-unknown-unknown
node tools/tari-companion/server.mjs --allow-run
```

The v2 companion writes a private 0600 pairing-key file in its private OS temporary directory and prints only its path. Read that local file and paste the key into Tari tools on a **locally served HTTP IDE**. The key is memory-only in the page, never sent as a bearer credential. Requests and responses use authenticated AES-GCM encryption, fresh nonces, replay rejection and response binding. A counterfeit listener cannot decrypt workspace files or forge a reply without the key.

Use `http://localhost:8080` or `http://127.0.0.1:8080`. Other exact local HTTP origins can be supplied with `--origins`; hosted origins are rejected even if explicitly configured. **The public hosted Workbench uses isolated cloud builds. Do not connect it to local native execution.** The supplied local server sets production-equivalent CSP plus the loopback RPC exception. To use another port, set `PORT` and pass the matching exact companion `--origins`.

Click Compile or Run tests, then review the exact file list, each file's SHA-256, source digest, action and pinned toolchain displayed in the companion terminal. Type the fresh approval challenge there. Approval expires, applies to that snapshot/action only, and produces a new one-use token consumed by the run. There is no trust checkbox or headless production approval switch. Workspace edits require a new snapshot and local approval. The old v1 bearer protocol is deliberately unsupported.

**Trusted local development only, not a sandbox.** Build scripts, procedural macros and tests run native code as your OS user, can read private files (including through `include_bytes!`) and use the network. Never approve unfamiliar source. Cargo/toolchain configuration overrides (`.cargo/`, `rust-toolchain*`) are rejected. The runner also refuses ancestor Cargo configuration, strips unrelated environment variables, pins Rust 1.95.0 and disables automatic toolchain installation. The installed compiler/Rustup remain trusted host software.

Each run receives its own source directory, `CARGO_HOME`, temporary HOME and target directory; all are removed after success, failure or cancellation. Warm dependency caches are deliberately not shared. This prevents accidental cache carryover; approved malicious native code still has the OS user's authority and could attack files outside these directories. Use cloud workers for untrusted code. Builds are serialized and limited to 20 minutes. AI has a separate one-request concurrency limit and three-minute timeout. Requests, approvals and results write a private 0600 audit.jsonl journal without source bodies, compiler logs or credentials. It rotates at 2 MiB and retains one previous journal (4 MiB total). The default data root is OS-temporary; choose a private absolute --data directory without ancestor Cargo configuration for durable retention.

The browser validates response shapes and independently verifies WASM bytes/hashes before download. Source and build-input digests identify inputs, **not trustworthy provenance or a reproducible build guarantee**. Total returned WASM is bounded to 8 MiB and four files. Files are bounded to 300 text entries / 3 MiB with root Cargo.toml and Cargo.lock required. Additional non-text inputs need a separately reviewed CLI workflow.

Security changes, dependency exceptions, tests and deployment evidence are tracked in [SECURITY_REMEDIATION.md](SECURITY_REMEDIATION.md).

## Optional real local AI

With Ollama already running and an installed model, add `--model EXACT_INSTALLED_MODEL_NAME`. The companion checks `/api/tags` before advertising AI and calls the documented `/api/chat` endpoint. No model is downloaded automatically. If Ollama cannot initialize the GPU backend, `--cpu` requests CPU inference (`options.num_gpu=0`); it does not change model weights or fabricate replies. Prompts and optional open-file context are sent only when Send is clicked. Responses are plain text for review; no automatic file edits, shell execution or wallet actions.

An installed adapter is not a validated Tari expert. It currently has a Tari-specific system prompt and user-supplied file context, **not** a verified documentation retrieval index. Provider errors are shown. Without a model, Send is unavailable. Never put a hosted provider key in frontend code.

## Integration tasks and acceptance criteria

Search source for `DEV_REQUIRED[` to find active adapter boundaries. The table also covers untouched upstream tools: they remain Ethereum/Remix tools and are not evidence of Tari support.

| ID | Code / area | Still required | Acceptance evidence |
| --- | --- | --- | --- |
| BUILD-HOSTED | `tools/agent-service/jobs.mjs`, `sandbox-driver.mjs` | Hosted runner implemented and exercised on real Vercel Sandbox; finish GitHub sign-in and production UI acceptance. Account-allowlisted pilot, bounded capacity. | Counter compile/tests, intentional failure, cancellation, stopped-worker recovery and denied egress passed; see VALIDATION.md |
| TARI-DEPLOY | `tari-plugin.tsx`, `tools/agent-service/deployments.mjs` | Guided official-wallet publication, saved build/transaction receipts and read-only result/ABI verification implemented. Still required: real wallet publication acceptance, optimized-byte identity, direct pairing and component interaction. | Fixture coverage passes; actual wallet passkey and network write pending. See TEMPLATE_DEPLOYMENT_TASK.md. |
| AI-HOSTED | `tools/tari-companion/server.mjs` | Server-side provider credentials, user quotas, versioned Tari reference retrieval, chat persistence and explicit edit diffs/approval | Genuine provider response with applicable SDK context; canceled/failed calls and rejected edits handled |
| LOBBY-PUBLISH | `tari-plugin.tsx` | Lobby write API, authentication/ownership, validation, moderation, deduplication, durable storage, separate contest/community destinations | A second browser sees the same published project; confirmation links to its real creator post; rejected submissions never claim success |
| RUST-LSP | `libs/remix-ui/editor/src/lib/remix-ui-editor.tsx` | rust-analyzer transport and matching toolchain, Cargo-aware completion, diagnostics/navigation, formatting | Rename/reference/diagnostic checks on a multi-file Rust template; syntax coloring alone does not count |
| TARI-DEBUG | upstream debugger and run plugins | Tari execution traces/state inspection and ABI-aware interaction | Step a real Tari transaction; Solidity/EVM debugger is never presented as a Tari debugger |
| TEMPLATE-REGISTRY | `libs/remix-ws-templates/src/templates/tariCounter/` | More pinned official templates, dependencies/licensing/provenance, version compatibility and engine tests | Each offered runnable starter builds and tests from a clean checkout; do not relabel ERC examples as Tari |
| GIT-SHARED | upstream file panel/dgit/auth | Verify clone/import/remix, OAuth installation for this fork, branch/commit/push/PR identity and error handling | Round-trip a user-owned test repo; do not assume upstream Remix cloud credentials work in the fork |
| APP-HOSTING | upstream QuickDApp/frontends | Tari wallet frontend SDK binding, preview isolation, frontend build worker, hosting provider integration | Real deployed app uses the recorded network/component and has a working public URL |
| WORKSPACE-SYNC | upstream filesystem/cloud | Authenticated cross-device persistence, conflict resolution, backups | Reload and second-device recovery with no data loss; browser-local saves remain accurately labeled |
| FORK-SERVICES | app bootstrap / upstream providers | Upstream cloud startup, billing/survey scripts and Matomo disabled; CSP restricts external code and frames. Explicit future fork-owned integrations require separate configuration. | See security regression and live acceptance evidence |

Deployment and public submissions are separate operations. Publishing a WASM template does not instantiate every component. A locally exported submission draft does not enter a contest, create a GitHub repo, post on a forum or host an app.

## Selection receipt

- 2026-10-04 correction: the earlier Lobby editor was a non-working prototype with no user-created projects. Removed its migration controls and importer. Reuse the existing Remix file import/export workflow for current workspaces; no replacement migration pipeline is needed.

- Reuse: Remix v2.6.5 editor, plugin engine, workspace/files, Git and export infrastructure; matches the supplied reference and avoids another imitation.
- Reuse: existing Lobby Counter and its pinned lockfile/engine tests from `marguerite347/ootle-lobby-community` revision `d44f4aa`, based on the Tari development skill example. Source model/reference: Tari Ootle revision `ebca9f42a1570261a6434ee79ea4cd52f3d61fcc`.
- Availability trial: upstream library build and full production build completed locally; actual upstream UI opened in Chrome before adapting it.
- Gap: browsers cannot run this native Cargo/Wasmer toolchain by merely renaming an Ethereum compile button. The companion is a small local execution adapter. Hosted execution requires separate isolation architecture.
- Current evidence: see `VALIDATION.md` and the **Ootle validation** GitHub Actions workflow. Record failed or untested checks explicitly; unit fixtures are not proof of network deployment or model output.

## Primary references

- https://ootle.tari.com/
- https://github.com/tari-project/wasm-template
- https://remix-ide.readthedocs.io/en/latest/plugin_manager.html
- https://docs.ollama.com/api/chat

## Recommended implementation order

1. Reproduce Counter tests/WASM and the file/edit/export loop on clean machines.
2. Complete Rust diagnostics and a versioned, tested starter catalog.
3. Deploy a real template to testnet, instantiate it, execute an authorized call, verify finalization.
4. Connect AI with versioned sources and reviewable edits; repeat compile/test after every accepted edit.
5. Connect repo publishing and app hosting, then durable Lobby/contest submission with moderation.
6. Validate the entire journey in a second browser/account before producing a how-to video.

## Connected agents implementation

See [task instructions](CONNECTED_AGENTS_TASK.md) and [service setup](../../tools/agent-service/README.md). The `feat/connected-agents` branch adds a dedicated GitHub-authenticated workspace service with MCP OAuth, scoped read/edit grants, PostgreSQL persistence, version conflict protection and immediate revocation. Home → Connect your agent and Tari tools → Agents open the sharing/authorization flow. Hosted availability and provider acceptance are recorded in VALIDATION.md.

Real GitHub sign-in, Codex and Claude Cowork authorization/read/edit passed in production on 2026-10-04. `DEV_REQUIRED[AGENT-PUBLIC-SCALE]`: the hosted pilot is account-allowlisted; shared abuse limits, quotas and backup operations must be reviewed before wider access.

## Hosted builds extension
See [Operational Workbench instructions](OPERATIONAL_WORKBENCH_TASK.md). Authenticated shared-project owners can start cloud compile/tests; agents require an explicit `workspace:build` grant. Worker execution is isolated from the service/database and uses a pinned toolchain snapshot. Durable jobs retain source version/digest, bounded logs and verified WASM. Local companion remains available. Real GitHub sign-in, native Codex/Cowork and the production compile/test/download path passed; see the acceptance record.

## Additional connectors
Cursor setup is available from the agent selector, with an install link and mcp.json configuration. Native Cursor reached authorization; approval/tool execution remains pending. OpenRouter account connection and free-model chat are implemented in `tools/agent-service/openrouter.mjs`, using encrypted credentials, selected context, durable replies and bounded requests. No automated edits or model tool execution. Real OpenRouter authorization, a free-model answer using the selected Counter source, and persisted-answer reload passed on 2026-10-04. These results do not complete wallet deployment, public publishing or Rust LSP support.

## Template publication and Sapient
The Deploy panel opens a durable publication dashboard. Counter v5 has real passing engine tests, compiled WASM and an immutable prepared receipt. A supported Sapient adapter now connects the existing browser wallet and verifies its public account/network; production connection on Esmeralda passed. This does not establish new-template publication support: the reviewed Sapient provider (0.6.6 source) cannot attach WASM/blob data. Use the guided official-wallet publisher or complete an explicitly scoped wallet extension change. Preserve user approval and keep wallet capabilities separate from agent grants. No on-chain publication is claimed. See TEMPLATE_DEPLOYMENT_TASK.md and VALIDATION.md for exact evidence.

## Resource recordings (October 10, 2026)

Builder references use reviewed source/docs screen recordings hosted under the existing Lobby `/previews/community/` media path. Workbench allows media from that exact production origin, with native controls, no autoplay or fabricated execution, and original discussion links retained separately from repositories. This adds no renderer, wallet execution or backend endpoint. Source and capture details live in `ecosystem-resources.json` and `RESOURCE_CAPTURE_HANDOFF.md`.

## Dead Drop execution — 2026-10-10

Selection receipt: reuse the existing Remix workspace snapshot and exact-window/origin postMessage exchange. The live embedded-browser trial created a blank `Dead_Drop` workspace, but `window.open` with popup features produced no discoverable connection tab. The connection launcher now requests a normal tab, retaining its opener for the existing handshake. No permissions, OAuth scopes or file-sharing behavior were broadened.

Local validation: 20 existing security/companion tests pass; `git diff --check` passes. This does not establish embedded-browser round-trip acceptance. Recheck Home → Connect your agent → Open connections on the deployed revision, complete GitHub sign-in, share Dead_Drop, and confirm the project name/version before authorizing the agent. The older Counter grant must not be overwritten as a substitute for the new project.

`DEV_REQUIRED[DEAD-DROP-APP-BUILD]`: current cloud jobs only support Cargo/WASM. A Node game build, server runtime, isolated frontend preview and complete app publication still require implementation and real acceptance. The new tab fix does not close those gaps.
