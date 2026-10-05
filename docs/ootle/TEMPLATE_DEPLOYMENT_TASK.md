# Template deployment: execution instructions

## Objective
Remix the shared Counter, pass locked cloud tests and compilation, publish its WASM to Esmeralda through the official wallet, and retain a verified template address and transaction receipt. Template publication only; component creation, app hosting and Lobby distribution are separate. Never describe a submitted ID, UI toast or build as accepted deployment.

## Resource selection
Reuse the actual Workbench MCP project (57c287b3-3b2a-446f-992f-90697067a47d), isolated build service, signed-in dashboard, private store and official Tari wallet v0.43.0. Official macOS ARM64 artifact hash verified: 9a8e32927ff9f2941600231401da02b078db5a6f2f42c6f5ac1624addd9d8c32. A dedicated loopback test wallet is running with WebAuthn; user must register its passkey. No existing wallet was reset or imported.

The official wallet already handles upload, optimization, fee estimation and signing. Its current daemon has same-origin CORS and localhost WebAuthn; do not disable these to make a hosted IDE appear connected. First prove the wallet publication path. Reuse its supported transport only after a small compatibility trial. A guided wallet handoff must be labeled honestly until direct transport is tested.

## Build and publication invariants
- Use an immutable successful build and matching successful test source digest. Preserve the original shared workspace and version conflicts; review remote edits into Remix.
- Counter remix adds owner-only increment_by; test arithmetic, unauthorized access and overflow rollback.
- Record input WASM SHA-256, source digest/version, network and wallet version. Wallet optimization can alter deployed bytes; do not equate the original file hash with a template address without verifying the actual published binary.
- Keep wallet keys and auth credentials out of hosted service, logs and source. Wallet approval controls network writes. Show fee account, intended network and estimated fee before publishing.
- Capture transaction ID before polling; timeout means unknown/pending, not failure or success. Reconcile existing ID before any retry. Rejected, invalid, and fee-only accepted results must not be marked deployed.
- Independently retrieve the published template and inspect ABI on the intended network; retain a receipt with null fields for anything not verified.
- Test cancellations, network failure, wrong network, stale builds, unauthorized owner, reload recovery and invalid transaction/template identifiers.

## Current representative trial
Official wallet binary is callable and connected to the Esmeralda indexer; passkey setup is pending user action. Live MCP edited Counter to shared version 5. Three real engine tests passed, including increment_by access and overflow. Cloud compile passed: job 632b7198-80a8-4a84-b1ce-2815e077a048, exit 0, 108479 bytes, SHA-256 eeef38ba1c341c5031b90a650183d7158ae9cdce65f60c2d04d6e83f7966e465. Both jobs used source digest dbc9aeb66b1cb2ae5a982b9943b1bc46ead817b516714d07d008154b00733231. The two changed files were reviewed/applied through Remix; browser is linked to version 5. Continue independent product work while waiting for wallet registration; do not bypass authentication or fabricate a funded wallet/publication.

The public indexer https://ootle-indexer-a.tari.com/network returned esmeralda, network byte 38. v0.43.0 source confirms wallet same-origin CORS and localhost WebAuthn, so direct hosted-page RPC is not yet a verified transport. Do not use the SDK example guidance to disable CORS or authentication. First complete the official-wallet publication trial, then select the supported app transport or accurately labeled guided handoff. Wallet http://localhost:5100 remains open awaiting user passkey registration. No network write, fee spend or template address is claimed.

## Product implementation checkpoint
The hosted dashboard now prepares an immutable successful WASM build only when the current shared source digest matches and the same digest has passing engine tests. The private owner-scoped record archives its artifact beyond the seven-day build retention. The official-wallet handoff supplies a download and Esmeralda instructions; there is no direct wallet RPC pairing or secret in the hosted service.

The user records the wallet transaction ID, which is saved before network calls. Verification checks the fixed Esmeralda indexer/network, transaction identity, accepted main result, newly created Template substate, catalogue hash and ABI. Pending/indexing, rejection (including fee-only acceptance), unrelated transactions and indexer failure stay distinct. A wallet-optimized binary mismatch is explicitly `published_unmatched`, not a verified build deployment. Direct transport and a reproducible optimizer identity are remaining gaps. No fixture is a publication receipt.

Selection update: official wallet setup remains blocked on user-created passkey. The independent dashboard implementation reuses existing authenticated routes/private records and read-only public indexer APIs. This is a guided wallet handoff, not a replacement signing pipeline. Its representative trial is the real prepared Counter build plus public Esmeralda reads; wallet execution remains pending. Existing agent scopes do not gain wallet or publication tools.

## Existing Sapient wallet correction — 2026-10-05
The user reports an existing Sapient Chrome wallet. Do not treat registering the newly started daemon passkey as a universal prerequisite. Prefer the existing wallet where its supported capabilities cover the operation. Sapient's public source at f2f48bf1ef9a938afc0eb5e92a04255eab7784a5 documents window.tari, native self-custody signing without a daemon, account connection, network/balance reads and persisted create/approve/submit requests.

Publication compatibility gap: that revision's src/lib/messages.ts instruction request accepts instructions/maxFee/inputs/feeType, and src/background/index.ts forwards those to account.execute without transaction blobs. There is no documented publish-template method. Tari v0.43.0 bindings/src/types/Instruction.ts defines PublishTemplate.binary as an index into the transaction blobs containing the WASM bytes. Ordinary transaction signing support therefore does not establish new-template publication support. An installed version may differ; it has not been inspected. Browser security blocked opening chrome://extensions/; do not work around that restriction or claim inspection occurred.

Next selection trial: use a supported Sapient template-publication API if available in the user's version; otherwise the missing work spans Workbench's injected-wallet adapter and Sapient's WASM/blob publication support, not merely a connect button. Do not access seeds or silently change the wallet. Keep the already tested Counter source/artifact and saved receipt. No network transaction has been submitted.

Primary references: https://github.com/chironbuilds/tari-wallet/blob/f2f48bf1ef9a938afc0eb5e92a04255eab7784a5/docs/integration/provider-api.md ; https://github.com/chironbuilds/tari-wallet/blob/f2f48bf1ef9a938afc0eb5e92a04255eab7784a5/src/lib/messages.ts ; https://github.com/tari-project/tari-ootle/blob/v0.43.0/bindings/src/types/Instruction.ts

## Supported Sapient connector — 2026-10-05
Resource selection: reuse Sapient's documented injected provider. Rechecked public source 7ad3c4f117a76c64d472fd371b7d75bbe297abec (package 0.6.6); the instruction request still has no WASM/blob publication field. Do not invent a publication method or change the installed wallet. The official publisher remains an alternative, not a universal setup requirement.

The hosted dashboard now connects the existing wallet, reads the public account, checks Esmeralda before balances, and displays only revealed balances. It clears stale data on account changes and checks account/network again after asynchronous reads. Missing provider, cancellation, wrong network, malformed responses and timeouts are actionable. Disconnect calls the documented provider method; reload restores an existing site grant without prompting. No signing, private-view grant, seed or wallet credential enters the hosted service.

Representative trial: production deployment dpl_EUMUDHcx4W2tK2Z2HHCasBrz9WxE at source bf0ac1c loaded the dashboard with Counter version 5 and its saved prepared receipt. Connect Sapient opened the real wallet popup for the exact agent-service origin. Approval returned Sapient, Esmeralda and the existing public account; revealed balances were empty. Empty revealed balances are not evidence about private funds. All 21 service tests passed. Reload restoration is a follow-up change awaiting deployment verification.

Remaining acceptance: choose the official publisher for this first publication or explicitly scope a wallet-source change; check a funded fee account, estimate the fee, obtain wallet-controlled approval, capture the transaction ID, and verify accepted publication, catalogue binary identity and ABI. If optimization changes the file, resolve the identity gap rather than relabeling published_unmatched as verified. No transaction was submitted in this trial.
