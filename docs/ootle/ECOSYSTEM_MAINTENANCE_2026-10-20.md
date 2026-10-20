# Tari ecosystem maintenance — October 20, 2026

Run began at 13:59 UTC (09:59 Eastern), after the 05:00 scheduled time. It is not an on-time run. The existing daily lock was acquired; earlier releases and source checkpoints were retained.

## Discovery and existing-entry review

Enumerated 55 existing catalog surfaces / 50 canonical resources before additions. All 50 received primary-source review attempts: 42 complete within the declared scope, 8 partial/blocked; no existing resource was skipped entirely. At surface level: 45 complete, 10 partial/blocked. Two additional canonical resources were reviewed and published. Six existing resources received copy/link/version/evidence updates.

New resources:
- Séance — [original forum post](https://community.tari.com/t/october-build-contest-thread-spooky-secrets/396/15), [Radicle source](https://radicle.network/nodes/iris.radicle.network/rad:zqLEV4RxeFNAuZxxwwNtjJdFvRuA). Source/CLI for sealed group ballots. Fee-pot deposits are irreversible. Maintainer test/network claims are attributed, not reproduced here.
- Sealed Bids at Midnight — [original Reddit post](https://www.reddit.com/r/tari/comments/1xas9x4/sealed_bids_at_midnight_a_tari_auction_where/), [source](https://github.com/xB0unty911/sealed-bid-auction). Community gallery entry, not misrepresented as a forum submission. Testnet-only; forfeited bonds remain locked forever. Distinct from Sealed Coffin.

Updated:
- Payment Gateway's [original forum post](https://community.tari.com/t/october-build-contest-thread-spooky-secrets/396/10) now points to [a new HTTP-only public test shop](http://172.105.101.24/shop/). Store/product browsing inspected; no cart, checkout, payment or wallet. Old IP timeout retained in history.
- Phantom Drop [original post](https://community.tari.com/t/october-build-contest-thread-spooky-secrets/396/8) and GitLab README now lead to an [interactive narrated browser replay](https://hycorange.github.io/phantom-drop/). Link-holder, riddle, expiry and replay-rejection panels changed under real input. This is not new engine execution or a network transaction.
- Official SDK Details distinguish TypeScript 0.10.0, Python package/tag 0.3.2 versus release page 0.3.1, and Go tag/module 0.5.0 versus release page 0.4.0. Ghostline's original forum edit digest/date were refreshed.

Coverage: known forum topics/replies and a paginated latest feed through the October8 overlap; primary repository README/root/release information; five creator repository inventories; six Bluesky feeds and retained reply trees; Reddit's new feed through the overlap. Native Discord access recovered and development messages October10–20 were read. Native Tari Telegram General was opened and visible October18–19 messages read, but scrolling returned an accessibility error. X search redirected to login. Full native-channel overlap, all video streams and some social replies remain incomplete. Ghostline returned two replies against a counter of three. Hauntboard, several explorer/faucet URLs and the old payment shop retained exact failed-read evidence and prior successful dates. No outbound social messages, credentials, wallet actions or expanded grants.

The source ledger records exact observations, hashes, attempts and preserved last-good successes. A successful HTTP read is not functional certification. The original sharing trail remains in `outputs/resource-provenance.json`; original/discussion links are visible in both catalogs.

## Genuine recordings

Opening, middle and closing frames inspected for every new clip. Séance was deployed and played through before batch capture. Raw recordings and screenshots remain outside Git; reviewed MP4/poster pairs are published.

- [Séance — Announcement](https://ootle-lobby-preview.vercel.app/previews/community/resource-seance-announcement-20261020.mp4)
- [Sealed Bids at Midnight — Docs walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-sealed-bids-at-midnight-20261020.mp4)
- [Payment Gateway — Public shop browsing](https://ootle-lobby-preview.vercel.app/previews/community/resource-payment-gateway-shop-20261020.mp4)
- [Phantom Drop — Concept overview](https://ootle-lobby-preview.vercel.app/previews/community/resource-phantom-drop-walkthrough-20261020.mp4)

The auction recording includes the maintainer's embedded terminal GIF inside the actual README; it does not represent our execution. Phantom's footage shows the real interactive replay page. All eight served video/poster hashes matched the reviewed local files. Existing recordings and prior scope remain in history.

## Dependencies and compatibility

25 manifests, 13 lockfiles and 708 direct declarations inventoried against current registries and official releases. Six npm graphs reported zero vulnerabilities. Legacy Yarn graphs retain advisory debt: root 436 paths / 113 distinct advisories; desktop 910/212; e2e 213/75; Git HTTP backend 18/10; solhint 39/33. These are not all necessarily shipped browser vulnerabilities. Existing exposure checks and maintained compatibility pins remain; no blanket fully-current or audited claim.

Merged Workbench Rust advisory jobs passed with zero vulnerabilities in both locked graphs. Informational warnings remain: starter 4 unmaintained; Remix example 4 unmaintained, 2 unsound, 1 yanked. Current runtime/CLI/Actions releases and deferred migrations are in dependency-inventory.json. No global tooling or unrelated apps were updated.

**Breaking integration hold:** [Ootle 0.47.0](https://github.com/tari-project/tari-ootle/releases/tag/v0.47.0) requires wallet upgrades, verified reads/finality, removal of GraphQL settings and removed template debug host calls, template_lib 0.35 rebuilds, and new confidential-output proof behavior. Workbench's existing starter pins template_lib 0.32.0 / test_tooling 0.41.0. These remain locally/CI tested at their locked versions; live 0.47 compatibility is not established. Catalog updates do not migrate the integration. A separately validated code/lock/API migration is carried forward.

## Validation and publication

- Lobby: 52 root tests, content/schema/integration-gap validation, actual TypeScript/Vite build and packaged server smoke passed. Six source-review tests include changed-source/new-demo follow-up and failure-preserves-success trials.
- Eleven ProjectCard rendering tests passed. Live acceptance found and corrected generic builder captions and Séance's decorative-autoplay classification; native controls are now retained.
- Workbench: local catalog/companion/browser-dependency suite (20 tests), catalog/security suite (10), template parity and final CI validation recorded separately below.
- Lobby desktop 1440px, tablet 768px and phone 390px inspected. No horizontal overflow in tablet/phone observations. All eight gallery/builder recordings played to 12 seconds on phone; desktop gallery/builder playback also completed. Original-post links, Details, media controls and material restrictions are visible. Representative project and builder title states: rest/exit rgb(236,238,255), hover/focus rgb(201,235,0). Keyboard focus remained inside the target card.
- Lobby-to-Workbench navigation reached the Workbench home and retained the existing Dead_Drop workspace without editing its contents.

## Exact application release

Lobby PRs [69](https://github.com/marguerite347/ootle-lobby-community/pull/69), [70](https://github.com/marguerite347/ootle-lobby-community/pull/70), [71](https://github.com/marguerite347/ootle-lobby-community/pull/71), [72](https://github.com/marguerite347/ootle-lobby-community/pull/72) merged. Final deployed revision: `4b664b558e4bda35dff5c6d742d2f4149f71982e`; merged CI run39440705350 passed.

Workbench PRs [27](https://github.com/marguerite347/ootle-workbench/pull/27), [28](https://github.com/marguerite347/ootle-workbench/pull/28) merged. Final deployed revision: `7cc45e815bb4d15fa47a39638f3a1362b224bffc`; merged CI run39440321125 passed, including IDE packaging/exposure, Rust engine/WASM and both Rust advisory jobs. The initial artifact download failed with a storage egress-limit HTTP503; one bounded retry succeeded. The exact CI artifact was deployed without new access or a replacement pipeline.

Both production aliases returned the exact merged build markers. Packaged reference TypeScript diagnostics remain nonfatal in Lobby's build; this is not a warning-free build claim. Subsequent closeout commits contain maintenance documentation only and are separate from these tested application releases.


Final Workbench acceptance: all four recordings advanced under actual native-control input on desktop and phone and reached 12 seconds (Phantom phone observed 9.134–12 seconds). Across Lobby gallery/builder and Workbench, 24 playback cases completed. New captions, source links, restrictions and Details rendered. The existing Dead_Drop workspace was retained without editing files. Phone catalog is readable with the optional file pane collapsed; tablet global header overlap persists. Viewport and file-pane state were restored. Screenshots remain outside Git. No new or refreshed recording remains pending.

The daily release is complete with open holds, not a claim of full source-stream coverage, security certification or network integration readiness. See release.json for exact deployments and CI, source-coverage.json for all failed/partial attempts, and dependency-inventory.json for upgrade dispositions.
