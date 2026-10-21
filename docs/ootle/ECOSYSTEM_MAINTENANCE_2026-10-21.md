# October 21 ecosystem maintenance

Published and verified with the open coverage and compatibility holds below. Heartbeat timestamp was 09:12 UTC (05:12 EDT); actual work began 13:23 UTC (09:23 EDT), so this was a delayed run, not on-time execution. The dated run/deployment lock was acquired before edits.

## Discoveries and changes

- **Seance — privacy demo**, by Kylne700: [original forum submission](https://community.tari.com/t/october-build-contest-thread-spooky-secrets/396/17), [original Bluesky announcement](https://bsky.app/profile/kylne700.bsky.social/post/3myda5pbxgk22), [public app](https://kylne700.github.io/seance/). Distinct from DevXTools’ Séance sealed polls. The public prepared transaction returned a live-indexer result; Bob’s example key opened amount/memo, the audit example counted amounts without the memo, and Eve’s wrong example stayed sealed. No personal keys or payment. Details retain the trusted-indexer/fallback, bounded amount search and metadata-linkage limitations.
- **Sapient community bonus contest**: [original sponsor post](https://community.tari.com/t/spooky-secrets-community-bonus-contest/463/1). Community member 0xhra offers 100,000 XTM, divided 50k/30k/20k, for qualifying October projects using the Web Extension. This is outside the official base pool. Sponsor selection conditions remain in Details. No separate deadline was announced; the catalog retires the listing with the parent October contest. Workbench now renders active opportunities that were previously only stored in its catalog.
- **Ghostline v0.3.2**: [release](https://github.com/AduAkorful/ghostline/releases/tag/v0.3.2), [pinned guided setup](https://github.com/AduAkorful/ghostline/blob/0b0ff7dfc5f8a774a5f8176c375b191492757b00/docs/quickstart.md#guided-esmeralda-demo). Fresh docs footage shows the local runner and walletd 0.47+ requirement. Its hosted site remains an explainer. No script, wallet or payment execution.
- **Sealed Bids at Midnight**: [new forum submission](https://community.tari.com/t/october-build-contest-thread-spooky-secrets/396/16) qualifies it for October gallery placement. Original Reddit discovery, unchanged source revision, existing footage and permanent bond-forfeiture restriction retained.
- **Official TypeScript SDK v0.11.0**: [breaking encoding correction](https://github.com/tari-project/ootle.ts/releases/tag/v0.11.0) recorded in Details. No integration migration implied.
- The public October checkpoint was stale at October13; a complete run of the existing monitor now records October21 and 12 returned submission posts. This is a post count, not a count of independently qualified projects. Opportunity links explicitly say Original post.

## Source scope and holds

All 59 existing catalog surfaces were attempted, representing 52 canonical resources: **38 complete within declared source scope; 14 partial/blocked**. No canonical resource was wholly skipped, but individual unread/failed source observations remain explicit. Three existing canonical entries received material copy/placement changes; two new canonical resources were qualified separately. Enumeration itself was not treated as a read.

Known forum topic streams include returned replies/edits; latest feed pagination reached the October8 overlap. Primary repository READMEs, metadata and release sources, five creator inventories, seven Bluesky author feeds and retained post trees were reviewed. Reddit’s new feed reached the overlap. Sealed Bids and burn-wallet announcements had zero comments; Hauntboard had one returned reply. Ghostline returned two replies and retains the prior counter discrepancy. Sealed Coffin’s original Reddit body now displays removed by Reddit filters; its original permalink remains alongside readable forum/repository sources.

X browser search redirected to login. Native Discord development scope remains October10–20 rather than the full overlap/all channels. Telegram AX did not expose a message tree and Tari overlap was not freshly read; unrelated active chat was excluded. Complete video/channel streams remain unread. Hauntboard/explorer/faucet SSL failures, legacy explorer402, market401, old payment-shop timeout and unavailable source URLs retain dated failures and last-good observations. DevXTools’ pinned Radicle files were reread, but the current head was not established. An offline publicity contest proposal was held as an idea, not listed as an established opportunity. No private chat content/permalinks, outbound social messages, wallets or new grants.

Source-coverage.json, review-outcomes.json and source-reads.json retain exact distinctions. SourceMonitoring’s six tests include changed-source/new-demo follow-up and failed-read preservation of successful dates. All earlier provenance is retained in outputs/resource-provenance.json and its readable companion.

## Genuine media

Existing capture pipeline reused with a bounded scroll option, tested by eight capture tests. The representative Seance trial deployed at bc3f30b and played to12seconds before the batch. Opening, middle and closing frames (0/6/11s) inspected for every new clip. Raw recordings and screenshots remain outside Git; reviewed videos and real posters are committed. Earlier footage remains in manifest history.

- [Seance — App demo](https://ootle-lobby-preview.vercel.app/previews/community/resource-seance-privacy-20261021.mp4): continuous read-only prepared transaction view; example-key outcomes separately observed in CUA.
- [Sapient bonus — Announcement](https://ootle-lobby-preview.vercel.app/previews/community/resource-sapient-bonus-contest-20261021.mp4): original sponsor post and eligibility terms.
- [Ghostline — Docs walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-ghostline-guided-20261021.mp4): pinned guided setup, no CLI or transaction execution.

All 16per-surface desktop/phone playback cases advanced;15 were explicitly observed ending at 12 seconds, with the remaining phone bonus case observed at 8.274608 seconds. All 6 served video/poster hashes match the reviewed files. Exact observations are in live-cua-evidence.json and served-media-hashes.json. No static image movie or generated cover was substituted.

## Dependencies and validation

25 manifests, 13 lockfiles, 708 declarations checked against registries and official releases. Root Lobby development dependency PGlite0.5.10→0.5.11 applied;52 tests and the real site build passed. Agent-service0.5.8 migration remains separately held. Six npm audit roots reported zero vulnerabilities. Legacy Yarn graphs retain advisory debt: root448paths/115distinct advisories; desktop910/212; e2e213/75; GitHTTP backend18/10; solhint39/33. These are not necessarily all shipped browser vulnerabilities; existing exposure checks remain authoritative for bundle scope.

Merged Workbench Rust audits passed with zero vulnerabilities: starter4 unmaintained warnings; Remix example4 unmaintained,2 unsound,1 yanked. Ootle0.47/template_lib0.35/SDK0.11 migration is held against the tested starter’s0.32/0.41 pins pending API/network validation. CLI, Node, Python/Go and pinned Actions versions/dispositions are in the inventory. No unrelated global tools or apps updated.

Lobby:52 root tests,6 source-monitoring tests,8 capture tests, content/schema checks and actual TypeScript/Vite build passed. Final checkpoint/label correction passed8 focused card/contest tests and another site build. Two intermediate catalog failures were corrected before release (unsupported readiness and media-scope label); they are not open failures. Workbench:25 focused local tests and the full merged CI run39610993174 passed, including IDE packaging/exposure, Rust engine/WASM and advisory jobs. Nonfatal packaged-reference TypeScript diagnostics and runner/Action deprecation notices remain recorded; no warning-free claim.

## Publication

Lobby PR74 trial, PR75 content/dependency release and PR76 checkpoint correction merged through the authorized owner identity. Workbench PR30 merged. The owner-agent repository exception was used; no independent approving review is claimed. Application deployment and later docs-only closeout revisions are recorded separately in release.json.

Final Lobby revision `4e06ff6bf3a72ddcef795168052830f4630aca9c` and Workbench revision `1323df9ae9dd3f3494d166ea11d1d1f520686884` are live, with exact build markers verified. Merged CI runs39612459402 and39610993174 passed. Desktop/tablet/phone composition, source disclosures and actual playback inspected; Lobby-to-Workbench navigation retained Dead_Drop without file edits. Rest/exit titles were white and card hover/focus titles lime. Workbench phone review used the optional file pane collapsed; pane and viewport were restored. The existing tablet header overlap remains. Startup No file selected and transient fileProviders console diagnostics were retained; the workspace subsequently rendered. No new or refreshed recording remains pending. This release does not certify third-party runtime/security behavior or establish testnet integration readiness.


The initial Vercel invocation failed authorization; the same existing scoped CLI succeeded from the isolated deployment directory. No new grant or credential was requested. Nonfatal packaged-reference TypeScript diagnostics remain in the deployment log. Documentation closeout is separate from the above application builds.
