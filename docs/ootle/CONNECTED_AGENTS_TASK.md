# Connected agents: implementation instructions

## Mandate
Build the direct authorization experience requested by the user: agents connect to Ootle as they connect to Vercel. Codex, Claude Cowork and other compatible clients should operate on the same explicitly shared project. The agent remains in its own application. A local model is optional, not a prerequisite. Keep builds and agent identity separate.

## Source of truth and working discipline
- Repository: https://github.com/marguerite347/ootle-workbench. Product base: `ootle`, starting revision `8dbdbf6ce78facfea9e076f6761f8bfd12c81f0b`. Work on `feat/connected-agents`.
- Read root AGENTS.md, DEVELOPER_HANDOFF.md and VALIDATION.md. Preserve Remix editor/filesystem/plugin APIs, notices, existing browser workspaces and import/export recovery.
- Implement actual behavior. Never label a provider as connected because its button was clicked. Never invent a build result, model response, account, token or deployment receipt.
- Persist code and this handoff in GitHub. Record source revision for builds. Separate implemented, locally tested, provider-tested, preview-deployed and production-deployed.

## User experience
1. Open Connected agents from Home or Tari tools.
2. Sign in to Ootle through the configured identity provider.
3. Explicitly share a selected workspace; show files/limits and what leaves the browser.
4. Copy a real MCP endpoint and follow client-specific instructions. The client initiates OAuth; Ootle presents the actual client identity/redirect, chosen project and requested permissions.
5. Consent grants read access and optional edit access. No build/deploy permissions unless a real implementation enforces them.
6. List authorized connections, project scope, expiry and recent activity. Disconnect revokes access server-side immediately.
7. Review remote changes and synchronize using version checks. Concurrent edits must produce a recoverable conflict, never silent overwrite. Recover cloud files into a new local workspace if needed.

## Architecture and resource selection receipt
Reuse the actual Remix file APIs and styling; installed and already exercised by this repository. Reuse the official MCP TypeScript SDK for Streamable HTTP, schema validation, discovery and OAuth protocol routes; pin dependencies and lockfiles. Reuse GitHub as an identity provider if chosen, requesting only basic identity, never repository privileges. Keep upstream Remix credentials out of the fork.

Gap: the deployed Workbench is static and has no account service or durable database. Build a separately deployable Node service with durable PostgreSQL storage and explicit environment configuration. The user approved GitHub identity and a new dedicated Supabase project in their existing organization; the provider quoted $0/month. Use the private ootle_agents schema and a limited server role. Do not repurpose the unrelated inactive Supabase project found in resource discovery. Never expose the local Cargo companion as this public service. Test a minimal real SDK-client read/write/revoke round trip before expanding UI.

## Authorization invariants
- Every workspace belongs to a verified account. Server-side owner checks on every management operation; every agent operation restricted to its approved project and scopes.
- OAuth authorization code + S256 PKCE, exact registered redirects, state protection, intended-resource validation, short-lived opaque access tokens, rotating refresh tokens, immediate grant revocation. Store credential hashes, not bearer plaintext. Bind pending consent to the signed-in browser session.
- No API keys, GitHub OAuth secrets or server credentials in browser bundles, URLs, logs, Git or screenshots. Browser login uses HttpOnly cookies and CSRF protection.
- HTTPS for public deployments; exact browser-origin allowlist; public-client registration does not grant access. Validate redirect schemes/credentials and input sizes. Limit requests and persistent state growth.
- Treat agent names, file content, paths and tool arguments as untrusted. Validate paths, bound workspace size, exclude secrets/build outputs by default, escape rendered content. Do not provide arbitrary shell or URL-fetch tools.
- Deployment, wallet transactions and public publishing stay distinct unavailable integrations until separately implemented and tested.

## Acceptance checks
- Official SDK client performs initialize -> tools/list -> list/read -> version-checked edit -> read updated content.
- Real browser shows remote changes in the Remix workspace after review; fresh service process retains project and grants.
- Account B cannot discover, read, edit, grant or revoke account A's workspace/connections; read-only agent cannot write; cross-project access denied.
- Missing, malformed, expired, wrong-audience and revoked credentials fail; code/refresh replay and wrong PKCE fail; unregistered redirects and CSRF fail.
- Stale file/workspace versions fail with a conflict, preserving both versions. Path traversal, secrets, oversized input and missing files produce truthful errors.
- Failed/offline service, canceled login, denied consent, empty connections and clipboard errors have usable states. No hosted setup means a truthful setup state.
- Existing local build and Ollama paths continue working. Hosted Cargo is not simulated.
- Inspect desktop and narrow layouts in Chrome. Check production build and meaningful backend integration tests. Run targeted regression checks once; broaden only for an identified risk.

## Release and evidence
Document exact setup variables, callback URL, persistent storage, start/test commands, backup/restore and revocation semantics. Use a dedicated disposable project for tests. State whether Codex and Cowork were actually exercised, not merely compatible by protocol. Record external requirements explicitly as DEV_REQUIRED identifiers. If deployment needs credentials, account creation, spending or permissions not available, finish code, tests and a reviewable PR first and identify the specific remaining action. Do not claim the user's goal complete while deployment/provider acceptance remains outstanding.

## Scope extension approved by the user
The user subsequently approved hosted compilation/testing and a fully usable agent-to-build workflow. Follow [Operational Workbench instructions](OPERATIONAL_WORKBENCH_TASK.md) for the separately scoped build capability and release acceptance. The original prohibition on exposing the local Cargo companion still applies.
