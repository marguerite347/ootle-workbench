# Validation record — 2026-10-04

## Confirmed

- Actual Remix v2.6.5 fork, baseline `59f2e9c43971a216c6981e30796a40141d4a78bb`.
- Upstream `build:libs` and full production build passed locally (Node 24.19.0, Yarn 1.22.22). The native optional/install-script errors did not prevent the Webpack build. Existing upstream warnings remain.
- Adapted production build passed. Chrome first-run created `tari_workspace` with Cargo.toml, Cargo.lock, src, tests and README. Home action created a second Counter workspace, opened lib.rs in the actual Remix editor and exposed Build Tari.
- Browser-to-companion authentication/capability handshake passed. Compile submitted the four Rust/Cargo files and showed the actual Cargo failure and exit 101 in both Tari tools and the Remix terminal.
- Four companion protocol test cases passed: path/bounds/lockfile validation, exact origin/authentication, trusted-action gating, failure truthfulness, request serialization and artifact checks. Their injected runner is a **unit fixture**, not a real build.
- [Linux validation run](https://github.com/marguerite347/ootle-workbench/actions/runs/37220525489): Tari job passed its locked engine tests and release WASM compilation on Rust 1.95.0. The compiled artifact was downloaded from the run. This validates the pinned starter; it is not a live-network deployment.

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

## Operational Workbench extension — 2026-10-04
- Written execution/acceptance instructions: `OPERATIONAL_WORKBENCH_TASK.md`.
- Official Vercel Sandbox SDK 3.5.1 created isolated Ubuntu Linux workers through the dedicated project's OIDC identity. The pinned Rust 1.95.0 Counter passed both real engine tests and release WASM compilation. First cold trial: 2m08s test compilation, 13.97s WASM compilation.
- Real service job adapter: successful build and valid 107595-byte WASM; SHA-256 `a8141b0df0e861ff1c3d339243130bac442eff4c7a9f32f54daaede04e86a594`. Cached compilation about one second; cached test compilation 4.56s and both engine tests passed in 11.19s.
- Intentional Rust syntax error returned actual Cargo exit 101 and source diagnostics. Actual worker cancellation passed.
- A completed worker was stopped/snapshotted before collection; a fresh adapter recovered the valid artifact and then deleted the job VM/private snapshot. This tests browser-closure recovery, not only process-local memory.
- A deny-all egress trial failed to reach example.com (curl exit 6). Deployed build policy permits only crates.io index/artifact hosts. No provider or database credentials are forwarded into the worker.
- Nine backend tests pass: OAuth/PKCE/replay/revoke, owner/project isolation, CSRF, file/version validation, persistence, job snapshots/quotas/cancellation/timeout/invalid-WASM rejection, and explicitly approved build tools. Job unit-test runners are fixtures; compilation proof comes from the separate real Sandbox tests above.
- GitHub OAuth app registration/credentials and native Codex/Cowork acceptance remain pending. Do not advertise live agent authorization as verified.

- Browser dashboard with explicitly labeled LOCAL ACCEPTANCE FIXTURE identity initiated a real Vercel build from shared version 2, displayed Cargo exit 0, diagnostics/source digest and the matching 107595-byte WASM. Desktop and 390px layouts were inspected. This does not validate real GitHub sign-in. The explicit download control completed in Chrome; downloaded template.wasm matched the worker SHA-256. The link now declares its download intent to avoid treating WASM as document navigation.
- Production IDE build passed with 26 inherited warnings; four existing local-companion regression tests passed.

- Backend source revision `9bb73e6` deployed to https://ootle-workbench-agents.vercel.app (deployment `dpl_4hVSx6X7MRNQXk2J89PaCUKGZwSQ`). Live health confirms builds configured and GitHub login not configured; OAuth metadata advertises exactly the supported public-client auth method and read/edit/build scopes. No live login success is claimed.

- Production IDE revision `9bb73e65d3ba71ca6bb3e8f6ebc5a80920bea9ed` deployed to https://ootle-workbench.vercel.app (`dpl_39eC6EunpNMHDe5d81uQm47gp1CF`). Chrome confirmed the cloud-build entry, configured Agents panel and popup into the correct service. Public build receipt matches the commit.
- Native Codex CLI 0.160.0 initiated real DCR and PKCE against the local fixture, discovered scopes and displayed project-specific consent. Chrome blocked consent navigation with ERR_BLOCKED_BY_CLIENT; token exchange was not completed, so native-client authorization remains unverified. The consent CSP now permits the exact registered callback origin, with a regression assertion; this does not establish that the browser block is resolved. No browser protection was disabled.

## GitHub identity setup and native token exchange — 2026-10-04
- User approved registering the dedicated GitHub OAuth app. GitHub confirmed application 3904623, Ootle Workbench, was created. Homepage/callback remain the exact Workbench URLs; wildcard callbacks and device flow are disabled. No repository scopes are requested.
- GITHUB_CLIENT_ID is installed as a production-only Vercel variable. GitHub requires account verification before issuing the client secret; GITHUB_CLIENT_SECRET and production GitHub login remain pending user credential setup.
- All checks for revision a545c10 passed: IDE build/service/companion tests (8m23s), Tari tests/build/companion smoke (2m34s), inherited Solidity checks (43s). Run 37226180992. Earlier run 37225825163 was superseded/cancelled, not a build failure.
- Native Codex CLI 0.160.0 completed DCR, S256 PKCE, consent API exchange and local credential persistence against the explicitly labeled LOCAL ACCEPTANCE FIXTURE. The harness submitted consent through the fixture HTTP API and supplied the returned callback to the CLI's documented no-browser flow; it did not complete Chrome consent or real GitHub sign-in. Hidden terminal input requires a carriage-return Enter key. The fixture CLI credential was removed afterward.
- Chrome still reports ERR_BLOCKED_BY_CLIENT when submitting the local consent form. No browser security protection was disabled. Production browser/native acceptance remains pending.
- Latest backend deployment from a545c10: dpl_3Qw4wwTUteVdLNns6P1JUsZ2pNiJ. Post-deploy health reports buildsConfigured=true, loginConfigured=false.

## Production acceptance after OAuth fixes — 2026-10-04
Supersedes the earlier pending GitHub/Codex/Cowork checkpoints above.
- Real GitHub sign-in succeeded as marguerite347. Fresh real editor workspace Tari_Counter_muu7drsj was shared as project 57c287b3-3b2a-446f-992f-90697067a47d.
- Native Codex CLI 0.160.0 completed OAuth against production, read src/lib.rs, created AGENT_ACCEPTANCE.md with optimistic version 1 -> 2, and read it back. The real model called the service, not a fixture.
- Codex initiated cloud test job 0606783d-efe0-4fd0-a052-d43352d0841e, succeeded exit 0. The editor reviewed and applied the added file using Remix's file permission flow; unchanged local files were preserved.
- Production dashboard compiled shared version 2: job ac09f61c-2952-4450-b857-031419655862, exit 0, source digest ec61884e9fcd7498f793ab82a65ad811a53cb33f75e96cf2b05a179fc249e7f4. Download event completed; WASM 107595 bytes, SHA-256 a8141b0df0e861ff1c3d339243130bac442eff4c7a9f32f54daaede04e86a594.
- Native Claude Cowork connected after preserving same-origin Referrer-Policy and explicitly returning HTTP 303 from consent. Production logs showed the previous implicit redirect used 307, forwarding POST to Claude's GET-only callback. Strict Origin/CSRF validation remains enabled.
- Cowork listed projects, read Counter, wrote CLAUDE_ACCEPTANCE.md, and read it back. Independent database read confirms shared version 3 and the genuine Counter description.
- Twelve backend tests pass, including new OpenRouter PKCE/session/replay/encryption, ownership/CSRF, selected-file context, free-price enforcement, quota and provider failure coverage. Provider responses in unit tests are fixtures.
- Cursor detected the real MCP server and reached the existing consent screen. Final approval is pending. OpenRouter public models API trial returned 18 free text models; actual authorization/answer remains pending.

- Both AGENT_ACCEPTANCE.md and CLAUDE_ACCEPTANCE.md were applied through the real editor review UI and remained visible after a full Workbench reload. Production-downloaded template (1).wasm was hashed on disk and matches the advertised a8141b0d... checksum above.
- Production Codex grant was disconnected in the dashboard. Native Codex transport then failed with Bearer invalid_token (expired, revoked or invalid), and no project tools loaded. Reauthorization with the same project permissions succeeded. The ootle-workbench definition is now saved in the user's Codex MCP configuration; no other servers were changed. The unused grant from Claude's failed callback was disconnected.
- Cursor setup and OpenRouter connection UI deployed from 227d151 at dpl_22bUm4jjW3SGwWK661N2ik6RmhX5. Native Cursor authorization is waiting for the user's grant approval. OpenRouter's real PKCE flow reached its sign-in page; the browser is signed out, so real provider response and connected-chat UI acceptance remain unverified.

## OpenRouter production acceptance — 2026-10-04
- User completed account sign-in and approved the provider flow. The original request exceeded its 10-minute state lifetime before the callback. A fresh request with the same $0 credit limit and 30-day expiration completed successfully; session binding and expiry checks remain intact.
- The production dashboard shows OpenRouter connected until 2026-11-03. Selected only src/lib.rs from shared Counter version 3 and submitted a real request to openrouter/free. The actual answer correctly described the zero initial value, public value() access, default denial of increment(), and checked overflow panic. No project writes were performed.
- Reloading the dashboard preserved the connected state and actual saved answer. The earlier OpenRouter pending-auth/response checkpoints above are superseded. Cursor's final grant approval and native tool acceptance remain pending.
- The IDE was rebuilt from e131fa8, including current ootle changes through af29461; production build passed and the served build.json matched e131fa83c17821b0cc3d11dbf8a77d6be9f8ff12. Real Chrome inspection verified Agents & OpenRouter in the AI panel while retaining both agent acceptance files and current product links.
