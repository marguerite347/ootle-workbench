# October 23 ecosystem maintenance

The catalog release is live in [Lobby](https://ootle-lobby-preview.vercel.app/#ecosystem-resources) and [Workbench](https://ootle-workbench.vercel.app/). Four new canonical resources and six existing resource updates were published with original discussion links. Eight genuine recordings and posters passed opening/middle/closing review, live byte checks, and playback through the end on desktop and phone in both products (32 playback cases).

This was a delayed local run starting about 17:40 UTC, after the 09:08 UTC heartbeat. No October 22 receipt was found. The run used the existing release lock and continued the October 21 handoff; it does not establish an on-time daily run or complete social-stream coverage.

## Published additions and corrections

| Resource | Change | Live recording |
| --- | --- | --- |
| Graveyard Shift | Confidential payroll browser replay; creator's later network deployment announcement retained separately from browser behavior | [Replay walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-graveyard-shift-20261023.mp4) |
| HideBox | Encrypted file-sharing project; saved browser-key restriction and metadata scope visible | [Docs walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-hidebox-20261023.mp4) |
| Familiar | Revocable agent payment allowances and limits; creator-recorded transaction outcomes distinguished from browser replay | [Docs walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-familiar-20261023.mp4) |
| Hearth | Confidential humanitarian cash-aid replay; placed in Community, not the October contest | [Replay walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-hearth-20261023.mp4) |
| Caravel Trade | Existing concept now has implemented testnet source and public wallet entry; moved to October; old footage retained as history | [Source walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-caravel-trade-20261023.mp4) |
| Caravel Burn Wallet | October submission and new announcements added; irreversible deposits remain visible; existing docs clip retained | [Retained docs walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-caravel-burn-wallet-20261010.mp4) |
| Séance (DevX) | New public browser interface; local ballot/reveal and historical receipt readback observed; current Radicle head remains unresolved | [Interface walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-seance-20261023.mp4) |
| Crypt | Current Sapient interface has unfinished wallet payouts; restriction made visible; refreshed footage replaces misleading old simulation view | [Interface walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-crypt-20261023.mp4) |
| Ghostline | v0.4.0 browser simulation, separate archived network receipt, and optional relay custody scope clarified | [Simulation walkthrough](https://ootle-lobby-preview.vercel.app/previews/community/resource-ghostline-20261023.mp4) |
| Official TypeScript SDK | v0.11.1 SSE bounds and single-pass scan update recorded; Workbench dependency migration remains separate | Existing source footage retained |

Source provenance is retained in `../resource-provenance.json` and its readable companion. Capture revisions, methods, previous footage, original posts, media URLs, hashes and per-product playback cases are in `../resource-captures.json`. The videos demonstrate only their labeled scope. No wallet creation, deposit, payment, upload or network signing was performed in this maintenance run.

## Source coverage and existing-entry pass

The mandatory initial queue enumerated **62 catalog surfaces representing 54 existing canonical resources**. All were assessed: **40 canonical resources completed their declared source-review scope; 14 were partial or blocked**. At surface level the result is 42 complete and 20 partial/blocked. Six existing canonical entries changed. Four new canonical entries added ten surfaces, bringing the final queue to 72 surfaces. Zero entries were silently skipped; an attempted review with missing reads is not a successful full review. Failed reads preserve prior successful dates.

Known forum topics and the latest feed were paginated, including returned replies and edits. Seven Bluesky author feeds and known sharing trees were read. GitHub repository/readme/release checks and five creator inventories were reviewed. Lookback for incomplete streams retained October 8 rather than advancing from a partial pass.

Signed-in X search recovered, but virtualization left search gaps; Familiar, Caravel Trade, Hearth and DNode post bodies were read individually, without claiming full reply coverage. Reddit's feed reached beyond the lookback, but retained feed/reply coverage is partial; Hearth's original post was read. Native Discord development and announcements were inspected only within the saved visible scope. Telegram exposed no message tree. Full video/channel streams were not read. Private channel contents and permalinks are not published.

Browser retries recovered Hauntboard (including the faucet notice and two replies), TariTracker Faucet's public status page, and SOOON's landing page. These reads do not establish wallet or payment operation. Explorer browser access still failed with an SSL protocol error. Forum topic 396's hidden post 18 and the current Radicle head remain unresolved. XTM-MINER's Android prerelease announcement is held pending a reviewed public release.

The representative changed-source/failed-read workflow trial passed six tests: changed sources trigger follow-up and failed observations do not advance successful-review dates. Full observations and exact failures are in `../source-coverage.json` and `review-outcomes.json`; raw bodies remain outside Git.

## Dependency and acceptance evidence

Inventory: 25 manifests, 13 lockfiles and 708 dependency declarations, with current/latest compatible/latest major dispositions, official registry/release evidence, pinned Actions, Rust, Python/vendor and toolchain scope retained in `../dependency-inventory.json`.

Applied Vitest 4.1.11→4.1.12 and agent-service transitive ip-address 10.7.3→10.7.4 (GHSA-rxp7-6hxx-x8q5). Six npm roots have zero reported advisories after the patch. Both merged-revision Rust advisory jobs report zero vulnerabilities, with informational unmaintained/unsound/yanked warnings retained. Legacy Yarn debt remains: Workbench 418 paths/117 advisories; desktop 913/218; e2e 210/74; git backend 18/10; solhint 39/33. Ootle 0.47 / SDK 0.11 integration migrations and breaking dependency upgrades are assessed holds, not forced updates or claims that everything is current.

Passed: 52 Lobby root tests; 191 client tests; six review-trial tests; Lobby content/schema/gap checks, actual build and packaged-server/chat-capabilities smoke; 25 Workbench catalog/companion/security tests; 23 agent-service tests; merged Workbench CI IDE, Tari engine/WASM and both Rust audits. The toolbar follow-up separately passed five security regression tests.

CUA accepted visible catalog copy, discussion links, Details, desktop/tablet/phone cards, all 32 media playback cases, and the Lobby-to-Workbench navigation. Lobby title feedback was checked at rest, card hover, keyboard focus and pointer exit; video controls remain independent. Existing browser workspace files were preserved. Workbench startup diagnostics (no selected file, early fileProviders/auth activation calls, extension multiplex/listener warnings) remain recorded; this release does not claim a clean startup console or resolve those separate issues.

## Exact releases

- Lobby PR78: representative capture trial, merged `e209878156bac6836113ddc924a8613b1ec718b8`, deployment `dpl_81mA9AXsBka6tg8UYiMVTAEp6SzC`; video advanced before batching.
- [Lobby PR79](https://github.com/marguerite347/ootle-lobby-community/pull/79): merged `16c3a94bc99f4fa28e04f21d3fc7ebd3244c250a`, deployment `dpl_FJTz1yWTi1khedP2RKMk612H4cAK`, CI `40000275342` passed. Served `/build.json` matched.
- [Workbench PR32](https://github.com/marguerite347/ootle-workbench/pull/32): merged `3fc4ecb1ff7321a0705b3ff2cb239e646a89acb2`, exact CI artifact from run `40000205782`, deployment `dpl_CwEWun7fV9FMXhFTtXZQkqCpJcZx`. Served `/assets/ootle/build.json` matched.
- Agent service from the same PR32 revision: deployment `dpl_FGLx9CjmMNg3Es3QfiWTn9MP7fkV`; live `/health` confirmed configured login/builds and the existing Rust/WASM and Node test profiles. No permission or credential changes.
- [Workbench PR33](https://github.com/marguerite347/ootle-workbench/pull/33): tablet toolbar follow-up merged `78732639a7aa7334de9644b20002abdaf07c825a`; exact artifact build and live responsive acceptance recorded below when complete.

Merges used the documented owner-agent exception, not an independent approving review. Documentation closeout commits are distinct from the application revisions actually served. Raw screenshots and recordings remain outside Git in `work/daily-2026-10-23/`.

PR33 final acceptance: CI `40002842139` passed all four jobs. Its exact merged artifact is live at Workbench as deployment `dpl_12YaPYPKneCqPqhA7Ss2be82WVkh` (`https://ootle-workbench-g8ybtr7tr-peekaboo4.vercel.app`). Served build metadata matches `78732639a7aa7334de9644b20002abdaf07c825a`. CUA checked 375, 414, 768, 820, 1024 and 1440 pixel widths with no horizontal page overflow or toolbar collision. Compact navigation and layout menus opened; phone/tablet workspace and layout controls measured 44 pixels high. HideBox's representative recording advanced from 0 to 12 seconds after the new deployment, with no media error. Temporary trial styles were cleared; the final checks use the deployed build. The existing workspace name and files were preserved, and the viewport override was reset.
