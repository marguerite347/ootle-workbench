# Daily maintenance completion contract

A deployed catalog update is a publication milestone. It does not complete the daily maintenance run.

## Required scope and outcome

Before checking sources, save `outputs/completion-YYYY-MM-DD/completion.json` with a dated run and seven sections: `discovery`, `existingResources`, `dependencies`, `editorial`, `recordings`, `validation`, and `publication`. Each section declares `expectedIds` and has one item per ID. Derive the scope from the source registry, catalog review queue, maintained manifest inventory, changed entries, recording manifest and release acceptance requirements. Do not shrink the scope to whatever was convenient to finish. Report canonical resources separately from duplicated product surfaces.

Each item includes `id`, `status`, `checkedAt`, and local `evidence` paths relative to the maintenance workspace. A complete item additionally requires `coverageComplete: true` and zero pending work. `blocked` requires an actual attempted failure, `failureKind`, a specific `reason`, and `nextAction`. Authentication, unavailable content, HTTP errors, timeouts, rate limits and unavailable authorized clients qualify when evidenced. Not read, not attempted, an unfinished editorial pass, or insufficient time are pending work, not blockers. Preserve the last successful date on failure. An assessed dependency migration can be `deferred` with its target version, concrete incompatibility or migration risk, validation evidence, and follow-up. Do not use deferrals for unread source streams.

## Execute and verify

1. Acquire the existing run/deployment lock. Resume its unfinished queue before beginning a competing release; never discard another active owner.
2. Enumerate every existing catalog resource independently of feed discovery. Read original discussions and replies, README/homepages/releases and linked public destinations. Follow pagination through the overlapping checkpoint window. Use an available authorized browser when an HTTP client cannot read the public page.
3. Save actual observations before editorial reconciliation. Reuse unchanged source hashes only when they correspond to a current read and a previously accepted version. Reading a feed does not imply every comment tree was read.
4. Retain every original sharing permalink. A creator-documented URL replacement can supersede an old active destination only with replacement URL, reason and evidence; keep the old URL and failed-read history. Merely finding a similar site is insufficient.
5. Finish all reachable editorial, dependency, recording and publication work. Validate compatible updates with relevant tests and real builds. Record failures and revert or hold incompatible updates; package installation is not validation.
6. Run `node scripts/check-maintenance-completion.mjs /absolute/path/to/completion.json /absolute/path/to/maintenance-workspace` from the Lobby checkout. Exit 1 means unfinished or unsupported claims; exit 2 means invalid input. Exit 0 means all declared scope has an evidenced terminal disposition, possibly with explicit external or migration exceptions. The CLI cross-checks discovery, listing and package IDs against the maintained source registry and dependency inventory, rejecting omitted identities. The gate checks structure and evidence existence; it does not read sources or certify the truth of evidence for the operator.
7. Save the gate output, exact merged revisions, deployments and independent desktop/mobile acceptance. A real build without publication is not a completed release. Do not advance a stream checkpoint on partial reads.
8. If interrupted, save the unfinished queue and mark the run incomplete. Resume it in the next available turn. Report completed public changes separately from pending work and evidenced exceptions; never summarize an incomplete run as complete.

Run `node --test test/maintenance-completion.test.mjs creator-hub/hub/server/test/sourceMonitoring.test.mjs` after changes to these rules. The tests cover omitted scope, unread work mislabeled blocked, stale or absent evidence, superseded URLs, and preservation of last-good dates.

Public catalog `lastCheckedAt` must match the latest successful full source review for reviewed records in both catalogs. Preserve blocked records and all recording/publication dates. The completion gate rejects stale reviewed dates.
