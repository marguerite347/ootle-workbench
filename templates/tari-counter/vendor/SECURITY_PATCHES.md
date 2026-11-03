# Narrow dependency compatibility patch

The remaining shared-buffer 0.1.4 patch pins memmap2 to 0.9.12. Upstream source and dual MIT/Apache-2.0 licenses remain unchanged; Cargo.toml.orig preserves the upstream requirement. This selects the repaired mmap dependency without forking its implementation or changing the Tari template ABI.

The starter now uses template library 0.37.0 and engine test tooling 0.49.2. Its dependency graph resolves gix-hash 0.18.0 and faster-hex 0.10.1 directly; the unused gix-hash 0.15.1 vendor patch has been removed. Its original source and patch remain in Git history.

November 3 registry review: shared-buffer 0.1.4 is still latest and does not select current memmap2 without this patch. Validate actual engine authorization/rollback tests, release WASM build and embedded-template parity in Linux CI. RustSec informational maintenance warnings and the separate current Ootle engine/builtin advisories remain tracked; these tests are not a security certification.

Primary repair references: https://rustsec.org/advisories/RUSTSEC-2026-0186.html and https://rustsec.org/advisories/RUSTSEC-2026-0306.html
