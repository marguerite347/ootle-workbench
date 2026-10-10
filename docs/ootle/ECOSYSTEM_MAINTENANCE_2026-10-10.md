# Ecosystem maintenance — October 10, 2026

## Selection receipt
Reuse the existing contest monitor and reviewed card schemas, catalog read projection and resource details, Remix home grid, frozen package installs, security checks and established Vercel projects. These are installed and callable; the representative October/Clew trial passed content validation and the real Lobby build before the resource batch. The missing capability was a reviewed language/tool reference set: a small data overlay feeds the existing catalog and Home, with an identical checked-in snapshot in Workbench. This adds no runtime database, wallet integration or separate editor. Source-only cards reuse the schema's existing null-media support; the media test now honors it.

## Listing changes
Two October entries (GhostKey and Candy Summoner), Clew in Community Projects, and twelve builder references in both products. The twelfth was discovered during the live Reddit scan: Caravel Burn Wallet. GhostKey is Tari L1; Candy has only a README and no Play link. Clew is a Mac community wallet with separate XTM/mainnet and Ootle/testnet boundaries. Veil stays source-only because its advertised site remains paused. The DNode/Erebus opportunity links to the organizer's October 10 post and expires after the October 26 drawing. Official agent docs are surfaced; the advertised skill index and Codex skill return 404. No library execution, faucet claim, wallet operation, social post or calendar mutation occurred.

Public metadata and source coverage: `ecosystem-source-registry.json`. Runtime checks do not become source audits. Complete forum topic streams were fetched including replies; overall social and forum coverage is partial. GitHub repo listings were paginated for Tari and the four initial creators. Additional miner/GUI, lottery concept and council-only governance candidates are explicitly held or scoped out. All raw source text and browser/account snapshots remain outside public source.

## Dependency disposition
`ecosystem-dependencies.json` records declared, locked, installed, latest in range, latest same major and latest package versions. Twenty-five manifests across both products contain 705 declarations / 413 distinct package names. Compatible does not mean validated: inherited Remix editor/plugin and optional media migrations remain separately held with reasons; no forced audit fix or global upgrade was used.

- Lobby `@vercel/blob` 2.8.0 → 2.8.1. Official patch adds explicit emulator-origin support without changing normal production behavior. Root tests, schema validation and build passed.
- Workbench Node pins 24.3.0 (and inherited app pin 10.15.3) → 24.19.0, matching the actual successful build runtime. Yarn stays 1.22.22. Node 24.21.0 is available but not the runtime validated here.
- Lobby root and hub, and Workbench agent service, each report zero npm vulnerabilities. Workbench's complete Yarn lock still has 34 advisory-matching package names / 2,964 names, unchanged from the existing security baseline. The existing reachability and unsuppressed remediation report remains authoritative.
- Rust compiler/templates remain pinned; newer crate/compiler releases require network/ABI and actual engine acceptance. The existing Linux CI runs the actual engine/WASM and Rust advisory checks.
- Backend MCP, Express, Sandbox and rate-limit updates remain held for separate live OAuth/session/worker acceptance. The current 21 backend tests pass; no connected agent test was restarted.
- Checkout Action updated within v4 to verified v4.3.1 SHA in both products; other latest majors recorded and held for runner/runtime migration.
- Spline, Vercel CLI, language SDKs, Python/Go registries and Codex app availability are recorded in `ecosystem-tool-releases.json`. A busy app updater is not an up-to-date result.

## Validation boundaries
The public website checks are root tests + content validation, actual production build, client tests, selected content/metrics/chat/trivia/Workbench server tests, and packaged runtime/wheel checks. Workbench runs security/dependency/companion tests, backend tests, template parity, full library/production builds and static artifact verification, followed by Linux CI.

An extra full Lobby server-suite probe exposed an omitted upstream placeholder `.env.example` in the public Hugging Face bundle; restored only the pinned, public placeholder and explicitly allowed that exact file through packaging. Four unrelated broad-suite test failures remain: two private growth-registry expectations, one absent private calendar draft, and one obsolete preview expectation. No private metrics/calendar were copied into public source and no evidence was deleted. Required public-route checks are separate from that broader probe.

Home-only responsive correction: at narrow widths, cap the existing file sidebar and allow the Home panel to shrink rather than clipping resource cards. The editor layout outside Home is unchanged.

## Release acceptance
This file records implementation and local validation, not production completion. Exact PR, merged source, deployed source, stable URLs, screenshots and independent live acceptance are recorded in the release receipt on the PR and dedicated maintenance chat after deployment. Re-fetch product heads and deploy exact merged source; keep existing aliases and chat/workspace storage.
