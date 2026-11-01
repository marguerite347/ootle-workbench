# Isolated browser filesystem regression

This harness imports the actual IndexedDBStorage adapter and uses only the dedicated database `ootle-maintenance-filesystem-20261031`. It never opens a user workspace.

From the repository root, use the installed esbuild to bundle into a temporary directory, then serve it locally:

```sh
mkdir -p /tmp/ootle-filesystem-regression
node_modules/.bin/esbuild scripts/ootle/filesystem-regression/review.ts --bundle --platform=browser --outfile=/tmp/ootle-filesystem-regression/review.js
cp scripts/ootle/filesystem-regression/index.html /tmp/ootle-filesystem-regression/index.html
python3 -m http.server 4358 --bind 127.0.0.1 --directory /tmp/ootle-filesystem-regression
```

Open http://127.0.0.1:4358/. Click **Write test files** and require PASS for UTF-8, bytes, rename, listing, stat, and the inherited callback API. Reload the page, click **Verify persistence**, and require PASS for persisted text, bytes, and renamed paths. A failed check shows FAIL; do not treat the presence of buttons as acceptance. Use another local port if 4358 is occupied.

October 31 acceptance passed both phases against LightningFS 4.10.4 and type package 4.4.8. The full production build passed with 26 existing warnings. External maintenance evidence: `work/daily-2026-10-31/lightning-fs-browser-{write,reload}-final.txt` and `lightning-fs-build-accepted.log`. This is a real browser IndexedDB check, not an on-chain or wallet test.
