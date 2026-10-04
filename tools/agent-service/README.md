# Ootle connected agents service

Remote MCP access to explicitly shared Workbench projects. The browser IDE stays on Vercel; this Node service owns GitHub identity, project-scoped OAuth grants and a dedicated PostgreSQL database. It can compile and test explicitly shared projects in isolated Vercel Sandbox workers. It does not host models, perform wallet operations or expose arbitrary shell tools.

## Run and test

Node 24.3+:

```sh
cd tools/agent-service
npm ci --ignore-scripts
npm test
npm start
```

Without `DATABASE_URL`, the service uses embedded PostgreSQL (PGlite) in `.ootle-agents/postgres`, listening on loopback port 4520. This is real durable storage for development, not a hosted deployment. Sign-in is unavailable until the GitHub OAuth app is configured. Tests inject an external GitHub response fixture and browser sessions in-process; there is no test-login HTTP endpoint in the production service.

Set server-side variables from `.env.example`. Register a dedicated GitHub OAuth app:
- Homepage: the public Workbench IDE URL.
- Authorization callback: `${PUBLIC_URL}/login/callback`.
- Request basic GitHub identity only; do not request repository scopes.

Never check secrets into Git, put them in the IDE config, or share an operator's GitHub token. `ALLOWED_GITHUB_LOGINS` restricts the pilot to named accounts; it is checked against GitHub's verified profile, not user-supplied metadata.

## Hosted storage and deployment

Apply `migrations/001_agent_service.sql` using the database operator. The `ootle_agents` schema is private, not exposed by the Supabase Data API. All tables enable RLS. Provision a dedicated LOGIN role with no superuser, database creation, role creation or bypass-RLS rights; grant it schema usage, DML and sequence usage only within this schema. Add policies limited to that server role. Do not grant `anon` or `authenticated` access. Per-account/project checks also run in the service on every operation.

A server role is intentionally allowed to access all service accounts so it can validate grants. It must only be available as the backend `DATABASE_URL`, never to browsers or MCP clients. Supabase project provisioned for this work: `jjjnmdtiffgdmdhisuzv`, name `ootle-workbench`, region `us-east-1`. No unrelated project was modified.

Use the Supabase transaction pooler. The included public CA certificate was downloaded from the certificate link in the project dashboard:
`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`.
SHA-256 fingerprint: `807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA`.
TLS verifies both certificate chain and hostname; never turn `rejectUnauthorized` off. Refresh the CA when the provider rotates it.

Vercel project root: `tools/agent-service`. `api.mjs` is the stateless Express entrypoint; `vercel.json` includes the static dashboard and CA. Set a stable HTTPS `PUBLIC_URL`, `DATABASE_URL`, GitHub app credentials and exact `IDE_ORIGINS`. Preview deployments must use their own origin and registered GitHub callback if testing login there. Production endpoint: `${PUBLIC_URL}/mcp`.

The IDE build accepts the public `OOTLE_AGENT_SERVICE_URL` origin through `tools/package-web.mjs`. Its public `assets/ootle/agents.json` contains no secrets. If absent, the Agents panel explains that setup is missing and allows a trusted custom service URL.

## Authorization and synchronization

The agent adds the MCP URL and initiates OAuth. The service advertises discovery metadata, supports public-client registration and S256 PKCE, and shows an explicit consent page. Client names are self-reported and are not proof of provider identity. Each grant targets exactly one project, with read access and optionally edits. Access tokens expire in one hour; grants and rotating refresh tokens expire after 30 days. Codes expire after two minutes and are consumed once. Credential hashes are stored server-side. Wrong resources, redirects, sessions, scopes and replays fail. Refresh-token replay revokes the grant. Disconnect takes effect for subsequent requests immediately; already executing requests may finish.

The browser dashboard uses same-origin HttpOnly session cookies with an Origin/CSRF check. The IDE exchanges file snapshots through an exact-origin, exact-window, random-channel popup handshake; it never receives account or agent tokens. If the identity provider isolates the login window, reopen Connect from the IDE after signing in.

File tools: `list_projects`, `list_files`, `read_file`, `write_file`. When hosted builds are configured, separately approved `workspace:build` grants expose `start_build`, `get_build`, `cancel_build`, and `get_build_artifact`. Existing grants do not gain build permissions; reconnect and approve the additional scope. Writes require the last observed workspace version. Concurrent stale writes fail with a conflict. File path and size limits apply on both ends. Shared files remain available when the browser closes. Changes are shown for review in the IDE and can be applied or recovered into a fresh local workspace. The service never silently deletes local files. Review full file content before sharing: filename exclusions cannot detect secrets embedded in source code.

Default limits: 20 projects/account, 50 active grants/account, 300 text files and 3 MiB/project, 10,000 registered clients. Request throttling is per service instance; broad public launch needs a shared abuse limiter and operational quota monitoring. Pilot remains allowlisted. Keep database backups; dashboard downloads recover per-project files but are not a full service backup. For self-hosted development, stop the process before copying its data directory. Restore backups into a separate environment before switching traffic. Revoking grants should be repeated after any database restore that predates revocation.

## Acceptance status

See `docs/ootle/VALIDATION.md` for observed results. Passing SDK protocol tests does not certify every Codex or Cowork release. GitHub OAuth app 3904623 is registered; its production client secret still requires account verification and credential setup. Native Codex token exchange passed with the local fixture using the no-browser callback flow. Production browser consent, GitHub callback and native-client acceptance remain pending until exercised. Hosted builds require `BUILD_SNAPSHOT_ID` and the Vercel project OIDC identity. Deployment and wallet permissions remain unavailable.

## Hosted compile/test operations
Run `node --env-file=.env.local bootstrap-sandbox.mjs` from this directory after linking the dedicated Vercel project and pulling its OIDC development token. This operator-only command creates a clean Linux VM, installs pinned Rust 1.95.0, passes the Counter tests and build, removes the baseline source and saves a reusable toolchain/dependency snapshot. Set its returned `BUILD_SNAPSHOT_ID` on the service. Never bootstrap from user files. The production SDK uses Vercel's automatic OIDC identity; no Vercel token is passed to a build VM.

`RUN_SANDBOX_SMOKE=1 BUILD_SNAPSHOT_ID=... node --env-file=.env.local sandbox.smoke.mjs` exercises real resources and a disposable local database. Unit tests use a clearly labeled runner fixture; they are not compilation proof.

Each build uses a fresh VM cloned from the trusted snapshot, 4 vCPUs/8 GiB and a 20-minute deadline. Network allows only index.crates.io and static.crates.io. Git dependencies, custom Cargo configuration and alternate toolchains are not part of the initial hosted runner. The project must include root Cargo.toml and Cargo.lock. New dependency downloads can fail with truthful compiler diagnostics. Compile output must be one valid WASM library of at most 8 MiB. No user-supplied command strings reach the runner.

The authenticated dashboard starts compile/tests and polls logs every five seconds. MCP tools use the same version, ownership, quota and lifecycle checks. The job captures the selected shared version; upload newer local edits before starting. Jobs do not deploy contracts. If the browser closes, the worker still runs; a stopped worker can retain a private disk snapshot up to seven days for result collection. Completed artifacts/logs are stored in PostgreSQL before disposing of the VM and its private snapshots. Reopen the dashboard within seven days to collect results. Snapshot storage and worker availability are subject to the provider allowance; the pilot is not an uptime guarantee.

Pilot limits: one active job and six starts per rolling 24 hours per account; two concurrent jobs and twelve starts per rolling 24 hours across the service. Failed/canceled attempts consume a start. Database locks enforce limits across service instances. Logs retain their last 100000 characters, results expire seven days after creation, and maximum artifact size is 8 MiB. Hobby usage pauses at the provider's free quota; this integration does not enable paid overages. For broader availability, configure operations/backup/abuse monitoring and choose capacity explicitly.

### Cursor and OpenRouter
Choose Cursor in Connected agents for the native install link or copy its mcp.json. The same project-scoped OAuth controls apply.

OpenRouter chat uses account authorization via S256 PKCE. Configure `PROVIDER_ENCRYPTION_KEY` as a server-only 32-byte random hex Secret (64 hexadecimal characters). Never expose or log it; rotating it invalidates existing encrypted provider keys unless migrated. No OpenRouter operator API key is needed. Users authorize their own key. The dashboard permits only verified free text models with zero-price routing, explicitly selected files, and bounded requests. Local disconnect removes the Workbench credential; revoke it at OpenRouter using the displayed settings link for provider-side invalidation.
