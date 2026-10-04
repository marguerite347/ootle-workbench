# Ootle Workbench: what works and what remains

This is an actual fork of Remix v2.6.5 (`59f2e9c43971a216c6981e30796a40141d4a78bb`), not the earlier Lobby editor imitation. `ootle` is the product branch; `master` retains upstream history. Preserve upstream notices and licenses. This is a community adaptation, not a claim of Tari Labs or Remix endorsement.

## Run the IDE

Use Node 24.3.0 and Yarn 1.22.22 (upstream `.nvmrc`).

```sh
yarn install --frozen-lockfile --ignore-engines
NX_NO_CLOUD=true NX_DAEMON=false yarn build:libs
yarn build:production
node tools/package-web.mjs
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist/apps/remix-ide
```

Open `http://127.0.0.1:8080`. `vercel.json` supplies the same install/build/output settings for a source deployment. `tools/package-web.mjs` includes the upstream license and committed revision in the static output. The static build can be self-hosted. Hosting the IDE does **not** automatically supply Cargo workers, wallets, AI providers, user authentication, app hosting or a publication database.

## Real local compilation and tests

Install a Rust toolchain compatible with edition 2024 and the WASM target. The checked-in Counter pins `tari_template_lib = 0.32.0`, `tari_template_test_tooling = 0.41.0` and its Cargo.lock. It is deliberately not silently upgraded to the latest moving SDK.

```sh
rustup target add wasm32-unknown-unknown
node tools/tari-companion/server.mjs --allow-run
```

Copy the temporary token printed in **your** terminal into Tari tools → Connect. The token stays in browser memory only. Review the workspace, enable the trust checkbox, then Compile WASM or Run tests. The current Rust workspace snapshot is sent to the loopback process. Cargo's actual exit status, diagnostics and WASM bytes determine the result. Download includes its SHA-256 and source snapshot digest. Rebuild after edits.

The companion only listens on `127.0.0.1`; default allowed origins are `http://127.0.0.1:8080` and `http://localhost:8080`. For another IDE origin, pass its exact origin using `--origins https://your-ide.example`. No wildcard. Browser local-network permissions and mixed-content policies can prevent a hosted page reaching a local service; use the localhost IDE in that case.

For the public Ootle Workbench deployment, explicitly allow that origin:

```sh
node tools/tari-companion/server.mjs --allow-run --origins https://ootle-workbench.vercel.app
```

**Trusted local development only.** Rust build scripts and tests execute as your OS user. Authentication, path checks and limits are not a sandbox. Never expose this runner publicly or use it for untrusted community submissions. It strips unrelated environment variables but does not provide filesystem/network isolation. Run failures stay failures. Artifacts/cache live in `.ootle-companion/`; stop the server before deleting that directory to reclaim disk space. Requests are serialized and time out after 20 minutes.

The browser currently sends Cargo.toml, Cargo.lock, Rust and TOML files. Templates that need other build inputs must use the CLI until a reviewed input manifest is implemented. The runner requires a root Cargo.lock; it does not generate one silently.

## Optional real local AI

With Ollama already running and an installed model, add `--model EXACT_INSTALLED_MODEL_NAME`. The companion checks `/api/tags` before advertising AI and calls the documented `/api/chat` endpoint. No model is downloaded automatically. If Ollama cannot initialize the GPU backend, `--cpu` requests CPU inference (`options.num_gpu=0`); it does not change model weights or fabricate replies. Prompts and optional open-file context are sent only when Send is clicked. Responses are plain text for review; no automatic file edits, shell execution or wallet actions.

An installed adapter is not a validated Tari expert. It currently has a Tari-specific system prompt and user-supplied file context, **not** a verified documentation retrieval index. Provider errors are shown. Without a model, Send is unavailable. Never put a hosted provider key in frontend code.

## Integration tasks and acceptance criteria

Search source for `DEV_REQUIRED[` to find active adapter boundaries. The table also covers untouched upstream tools: they remain Ethereum/Remix tools and are not evidence of Tari support.

| ID | Code / area | Still required | Acceptance evidence |
| --- | --- | --- | --- |
| BUILD-HOSTED | `tools/agent-service/jobs.mjs`, `sandbox-driver.mjs` | Hosted runner implemented and exercised on real Vercel Sandbox; finish GitHub sign-in and production UI acceptance. Account-allowlisted pilot, bounded capacity. | Counter compile/tests, intentional failure, cancellation, stopped-worker recovery and denied egress passed; see VALIDATION.md |
| TARI-DEPLOY | `apps/remix-ide/src/app/plugins/ootle/tari-plugin.tsx` | Wallet adapter; network/account pairing; template publishing; fee estimate/approval; finalization polling; ABI/component creation and method forms | Real testnet receipt with accepted result, template/component addresses; reject/wrong network/fee-only failures tested |
| AI-HOSTED | `tools/tari-companion/server.mjs` | Server-side provider credentials, user quotas, versioned Tari reference retrieval, chat persistence and explicit edit diffs/approval | Genuine provider response with applicable SDK context; canceled/failed calls and rejected edits handled |
| LOBBY-PUBLISH | `tari-plugin.tsx` | Lobby write API, authentication/ownership, validation, moderation, deduplication, durable storage, separate contest/community destinations | A second browser sees the same published project; confirmation links to its real creator post; rejected submissions never claim success |
| RUST-LSP | `libs/remix-ui/editor/src/lib/remix-ui-editor.tsx` | rust-analyzer transport and matching toolchain, Cargo-aware completion, diagnostics/navigation, formatting | Rename/reference/diagnostic checks on a multi-file Rust template; syntax coloring alone does not count |
| TARI-DEBUG | upstream debugger and run plugins | Tari execution traces/state inspection and ABI-aware interaction | Step a real Tari transaction; Solidity/EVM debugger is never presented as a Tari debugger |
| TEMPLATE-REGISTRY | `libs/remix-ws-templates/src/templates/tariCounter/` | More pinned official templates, dependencies/licensing/provenance, version compatibility and engine tests | Each offered runnable starter builds and tests from a clean checkout; do not relabel ERC examples as Tari |
| GIT-SHARED | upstream file panel/dgit/auth | Verify clone/import/remix, OAuth installation for this fork, branch/commit/push/PR identity and error handling | Round-trip a user-owned test repo; do not assume upstream Remix cloud credentials work in the fork |
| APP-HOSTING | upstream QuickDApp/frontends | Tari wallet frontend SDK binding, preview isolation, frontend build worker, hosting provider integration | Real deployed app uses the recorded network/component and has a working public URL |
| WORKSPACE-SYNC | upstream filesystem/cloud | Authenticated cross-device persistence, conflict resolution, backups | Reload and second-device recovery with no data loss; browser-local saves remain accurately labeled |
| FORK-SERVICES | app bootstrap / upstream providers | Audit upstream auth, billing, telemetry, notifications, AI and plugin-registry dependencies; replace/configure per fork | No upstream account/billing is described as an Ootle service; documented service ownership and configuration |

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
Cursor setup is available from the agent selector, with an install link and mcp.json configuration. Native Cursor reached authorization; approval/tool execution remains pending. OpenRouter account connection and free-model chat are implemented in `tools/agent-service/openrouter.mjs`, using encrypted credentials, selected context, durable replies and bounded requests. No automated edits or model tool execution. Native OpenRouter authorization and answer are pending. These results do not complete wallet deployment, public publishing or Rust LSP support.
