# October13 dependency maintenance

Registry checks covered25 manifests,415 npm package names and708 dependency declarations;13 actual lockfiles were inventoried. Six npm audit roots reported zero vulnerabilities. Workbench Yarn reports436 advisory instances/113 unique URLs, retained as an inherited unresolved baseline.

Applied Lobby root PGlite0.5.8→0.5.9 and Workbench DOMPurify3.4.16→3.4.17. PGlite:51 root tests pass. DOMPurify: frozen install,10 security/catalog tests, seven real-browser sanitization cases and full production build pass. Initial plain-text fixture incorrectly expected entity escaping; corrected to assert exact original text preservation, all cases passed. Sources: https://registry.npmjs.org/@electric-sql/pglite and https://github.com/cure53/DOMPurify/releases/tag/3.4.17 .

Compatibility holds remain explicit per-package in outputs/dependency-inventory.json: frozen Remix/UI and EVM test harness, agent-service OAuth dependencies, private-chat nostr-tools2.25.2 requiring two-browser delivery acceptance, isomorphic-git requiring workspace clone/edit/commit/recovery acceptance, protected Spline wheel2.0.57→2.0.77, and optional capture/render tool migrations. Node, Vercel and pinned Actions updates were assessed; no unrelated global tool changes. Vercel62.2.0 used vs63.1.2 available. Node24.19.0 used vs24.21.0 available; target Node22 latest22.23.3. Yarn1.22.22 remains current. Major Actions migration requires CI workflow validation.

Official network packages checked: Tari template library0.34.0, test tooling0.45.0, official JS SDK0.8.0/WASM0.45.0, Python0.3.0, Go0.3.0; retain pinned toolchain/template compatibility. Source catalog links are not installed dependencies or transaction-test evidence. No unknown external code executed.
