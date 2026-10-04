# Validation record — 2026-10-04

## Confirmed

- Actual Remix v2.6.5 fork, baseline `59f2e9c43971a216c6981e30796a40141d4a78bb`.
- Upstream `build:libs` and full production build passed locally (Node 24.19.0, Yarn 1.22.22). The native optional/install-script errors did not prevent the Webpack build. Existing upstream warnings remain.
- Adapted production build passed. Chrome first-run created `tari_workspace` with Cargo.toml, Cargo.lock, src, tests and README. Home action created a second Counter workspace, opened lib.rs in the actual Remix editor and exposed Build Tari.
- Browser-to-companion authentication/capability handshake passed. Compile submitted the four Rust/Cargo files and showed the actual Cargo failure and exit 101 in both Tari tools and the Remix terminal.
- Four companion protocol test cases passed: path/bounds/lockfile validation, exact origin/authentication, trusted-action gating, failure truthfulness, request serialization and artifact checks. Their injected runner is a **unit fixture**, not a real build.
- [Linux validation run](https://github.com/marguerite347/ootle-workbench/actions/runs/37220525489): Tari job passed its locked engine tests and release WASM compilation on Rust 1.95.0. The compiled artifact was downloaded from the run. This validates the pinned starter; it is not a live-network deployment.

- Earlier-editor backup import was exercised in Chrome: a fixture workspace appeared in the native file explorer and its Rust source preserved the expected value. Editing that value from 42 to 43 survived reopening the workspace in a fresh tab. The importer validates paths and creates new workspace names.
- Bundled Counter file map matches every tested Cargo/Rust source file.
- Downloaded Linux Counter artifact: 107,667 bytes; SHA-256 `f90dc3ddf6e392caca94af47ca510735018190f0e65a072ed8a1cc657ab27a37`; WebAssembly validation passed.
- [Real companion smoke test](https://github.com/marguerite347/ootle-workbench/actions/runs/37221046410) passed in Linux CI: an authenticated HTTP request ran Cargo, returned WASM bytes, and passed checksum/size/WebAssembly validation.
- Hosted fork verified in Chrome at https://ootle-workbench.vercel.app/ with the real Remix explorer, Ootle Home and Tari tools. Removed the inherited migration banner pointing visitors away from this fork. The Lobby entry switch is tracked in [Lobby PR 29](https://github.com/marguerite347/ootle-lobby-community/pull/29).

## Failed / incomplete

- Local macOS Cargo build/test processes were killed with SIGKILL while starting dependency build scripts. No local compilation success is claimed. Clean Linux CI succeeded instead.
- Ollama `tinyllama:latest` was already installed and detected. The UI sent the real request. Ollama returned HTTP 500 because its Metal backend could not compile against this host SDK. A CPU request also failed in the installed runtime. **No successful AI-generated answer or Tari answer quality is claimed.** The UI showed the provider error; no scripted fallback was supplied.
- Wallet pairing, network deployment, component interaction, public app hosting, Git push authentication and shared Lobby publication have not been validated and are not supplied by the new Tari adapter.
- Rust highlighting is implemented; Rust language-server completion, formatting and debugging are not.

See the developer handoff for locations and completion criteria. The preview must not be advertised as a fully operational hosted Tari IDE.

## Connected agents — implementation verification, 2026-10-04

- Production Remix build passed after resolving the browser TypeScript library compatibility error; 26 inherited warnings remain.
- Five Node integration tests passed using the official MCP SDK client and embedded PostgreSQL: OAuth code exchange and PKCE, read/write, stale-version rejection, cross-account/project denial, read-only grants, resource binding, refresh rotation/replay revocation, CSRF and redirect checks, immediate disconnect, concurrent code consumption, and storage reopen recovery.
- GitHub responses and signed-in browser sessions in those tests are explicit fixtures. They do not prove real GitHub login, Codex login or Cowork login.
- Four existing local Cargo companion regression tests passed.
- Dedicated hosted Supabase project `jjjnmdtiffgdmdhisuzv` provisioned after the user approved GitHub sign-in, dedicated storage, the organization, and the provider's quoted $0/month creation flow. Private `ootle_agents` schema uses RLS, a dedicated server-only role and verified TLS.
- Hosted PostgreSQL smoke check created a disposable project, wrote version 2, read it from a separate connection, rejected a stale update, and removed its test rows. No user workspace data was used.
- Native-client acceptance, actual GitHub OAuth callback, browser round trip and release status remain pending below until observed. Builds and deployment tools are intentionally unavailable to remote agents.
