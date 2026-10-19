# October 19 ecosystem maintenance

Ghostline is newly listed, and Crypt now links its playable, wallet-free WebAssembly demo. Both have genuine recordings and original sharing links in Lobby and Workbench. Shadow Swap’s Details now acknowledge the committed MIT license; Payment Gateway’s Details record today’s test-shop connection refusal.

## Published resources and evidence

- Ghostline: [original forum post](https://community.tari.com/t/october-build-contest-thread-spooky-secrets/396/14), [original Reddit thread](https://www.reddit.com/r/tari/comments/1x8m0xh/ghostline_private_paypercall_payments_for_ai/), [source](https://github.com/AduAkorful/ghostline), [concept recording](https://ootle-lobby-preview.vercel.app/previews/community/resource-ghostline-20261019.mp4). Release v0.3.1 at 5e4c754635f2b3dd1a7fc1b19d87dd95b140171d. The hosted motion explainer is static; no paid call or transaction was tested. The Reddit UI showed two returned replies against a three-comment counter, so new-entry reply scope remains partial.
- Crypt: [original forum post](https://community.tari.com/t/october-build-contest-thread-spooky-secrets/396/7), [new creator announcement](https://bsky.app/profile/ogboy92.bsky.social/post/3my5n2j23ps2y), [follow-up](https://bsky.app/profile/ogboy92.bsky.social/post/3my5p2qkhhs2l), [playable demo](https://lrifton92.github.io/crypt/), [interactive recording](https://ootle-lobby-preview.vercel.app/previews/community/resource-crypt-20261019.mp4). Source 242f11bb8d570e434ed0a21b3aecde1b71d51c91. Manual BUY/OPEN/DISPUTE input reached The Forger’s Curse. The separate recording shows role selection and a local purchase followed by the ghost fading. These are local demo outcomes, not new network transactions.
- Shadow Swap: README/license at 49d3d26a5370711120557130dca2646c54a3cc76. Added screenshots are illustrative fixtures, not execution evidence. Its October14 docs footage remains dated; no new application behavior was asserted.
- Payment Gateway: source 3606ab25988eab6e33d2b93cb6189b2c2326411b unchanged; October17 forum edit read. Its previously linked HTTP shop refused connection. Source listing and accurate October15 docs recording remain; no checkout claim.

## Coverage and gaps

The existing-entry pass enumerated **53 catalog surfaces / 49 canonical resources**, independently of new discoveries. Every existing record received a review attempt: **39 canonical reviews complete within their declared source scope, 10 partial or blocked, zero skipped**. One new canonical resource, Ghostline, was added separately. Three existing listings changed. The earlier 40/9 subtotal omitted the Payment Gateway’s failed shop URL; the corrected ledger includes it and retains October16 as its last successful full-review date. Hauntboard’s about-page HTTP403 also retains its last-good date.

Known forum topics were read with missing-post pagination; the latest listing was paginated through the retained October8 overlap. Primary repository READMEs, heads, roots, release metadata, linked HTTP targets, five creator inventories, six Bluesky author feeds and returned known-post reply trees were collected. The Reddit browser feed displayed 28 posts through August22, covering the overlap; Ghostline and Hauntboard returned replies were read. Collection evidence is in source-reads.json and the work/daily-2026-10-19 files; exact failed observations are retained.

Full X search/reply streams were login-gated. Native Discord was unavailable; Telegram exposed only a public landing. Full video/channel streams were not reviewed. The official Bitcoin Takeover article and sharing posts were retained as a research lead. Witching Hour’s repository remains 404; Channel3 is empty; the old Veil hostname returns402 while its replacement is retained; Tari Market returns401; two official skill endpoints return404. Sealed Coffin’s Reddit body remains removed by filters. These failures do not advance successful checkpoints or establish permanent closure.

The October17/18 schedule gap was not backfilled as completed runs. This trigger arrived 08:30 EDT, not at05:00. October16’s previously completed deployments and ten playback cases were reconciled before taking the October19 lock; that closeout did not imply fresh source reads.

## Reused workflow and validation

Reused the maintained plan, source readers, review-catalog queue, source-monitoring tests and creator-hub browser capture pipeline. Ghostline’s merged trial clip played live before subsequent captures. Crypt required a small optional bounded exact-button sequence in that same pipeline; missing controls fail closed. No new capture service, account or paid generation was introduced. Frames0/6/11 for Ghostline and0/12/23 for Crypt were inspected; raw footage remains outside Git. Served videos/posters match reviewed bytes.

Lobby: 51 tests, content/schema/gap validation and actual app build pass; merged CI39255922600 succeeds. Capture: seven tests pass. Source checkpoint trial: six tests pass, including changed-source and failed-read behavior. Workbench:25 local checks and starter parity pass. Merged CI39255862869 passes all four jobs, including actual editor build, Rust tests/WASM build and two locked Rust audits. The 793-file static artifact verifies; live build marker, index and agent configuration match it.

Dependency inventory:25 manifests,13 actual lockfiles,708 declarations/415 npm names. Six npm graphs report zero vulnerabilities. Legacy Yarn graphs retain113/212/75/10/33 unique advisories, with436/910/213/18/39 affected paths respectively. Both Rust audits report zero vulnerability findings with informational unmaintained/unsound/yanked warnings retained. Compatible candidates, major migrations, pinned Actions, Rust/Tari, Go/Python and build/capture/render tools are recorded with dispositions. No dependency upgrade was applied in this content pass; no blanket current/safe claim.

## Release state

- Ghostline trial: Lobby PR66, merged6e3b489ce6df88dc9582cf54dd2ff5b83ae30f9d, deployment dpl_EU5UJVqMo8EkHUqT3SzEtQHBwe5d.
- Final Lobby: [PR67](https://github.com/marguerite347/ootle-lobby-community/pull/67), merged **ede3ce64509f5cd822d52d752207e911ac340cf3**, live at https://ootle-lobby-preview.vercel.app.
- Final Workbench: [PR25](https://github.com/marguerite347/ootle-workbench/pull/25), merged **bfe087886636f70effe4d733c71f94847beb6ff2**, CI39255862869 artifact, live at https://ootle-workbench.vercel.app. Agent backend not redeployed.

An initial Vercel request using the team slug returned Not authorized. The existing CLI succeeded with the exact existing team ID; no new login or access grant was needed. Packaged reference TypeScript diagnostics remain nonfatal and are not represented as fixed.

Desktop,768px tablet and390px phone observations, playback and hover/focus evidence are saved alongside this report. Lobby’s card-wide lime hover, keyboard focus and pointer-exit restoration pass. The Lobby-to-Workbench link opens the actual IDE with Dead_Drop intact. Workbench retains its known tablet header overlap and cramped phone catalog with the optional file pane open; collapsing the pane restores readable cards. This content release does not claim those inherited layout defects resolved. Existing broader server-suite and IDE integration holds remain separate. No wallets, payments, third-party resource software installation, social messages, permission changes or user-file edits occurred. Existing IDE startup file-provider/no-file-selected races remain documented.

Acceptance closeout and documentation-only checkpoint PRs are recorded in release.json. Application revisions above remain the exact deployed builds; later maintenance-only commits do not change the served application.

Recording acceptance: 12 playback cases across the trial and final releases; both updated clips and posters match reviewed local bytes. No new or refreshed recording remains pending in this release. Earlier dated recordings and evidence are retained.
