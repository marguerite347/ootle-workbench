# Narrow dependency compatibility patch

The remaining shared-buffer 0.1.4 patch pins memmap2 to 0.9.12. Upstream source and dual MIT/Apache-2.0 licenses remain unchanged; Cargo.toml.orig preserves the upstream requirement. This selects the repaired mmap dependency without forking its implementation or changing the Tari template ABI.

The starter now uses template library 0.38.0 and engine test tooling 0.50.1. Its dependency graph resolves gix-hash 0.18.0 and faster-hex 0.10.1 directly; the unused gix-hash 0.15.1 vendor patch has been removed. Its original source and patch remain in Git history.

November 3 registry review: shared-buffer 0.1.4 is still latest and does not select current memmap2 without this patch. Validate actual engine authorization/rollback tests, release WASM build and embedded-template parity in Linux CI. RustSec informational maintenance warnings and the separate current Ootle engine/builtin advisories remain tracked; these tests are not a security certification.

Primary repair references: https://rustsec.org/advisories/RUSTSEC-2026-0186.html and https://rustsec.org/advisories/RUSTSEC-2026-0306.html

## November 19 heapless repair

Both Counter graphs pin the official faster-hex 0.10.1 source locally, changing only its normalized Cargo.toml to require heapless =0.9.4 and accurately declare Rust 1.88. All upstream Rust source, build.rs, original Cargo.toml and MIT/third-party notices remain unchanged. Registry archive SHA-256: 04839bdf9d8c10f66806fad16b852fc72aab80873aebc3cb69d85b4fa41543ed.

The old 0.8 parent constraint prevents Cargo from selecting heapless 0.9.4, which repairs RUSTSEC-2026-0574 through RUSTSEC-2026-0582. The dependency enters through gix-hash, Tari transaction metadata and dev-only engine tooling. Its absence from the release WASM closure is a scope observation, not a reason to suppress the audit. The Rust gate continues to reject every unsound finding.

This parent patch preserves faster-hex and Tari APIs. Version 1.0.0 of faster-hex is outside gix-hash's declared range; upgrading the full Tari tooling stack is a separate ABI migration. Check default and no-allocation hexadecimal encoding/decoding, both real Counter engine tests/WASM builds, and embedded starter parity.

Primary repair source: https://rustsec.org/advisories/RUSTSEC-2026-0577.html and the other eight dated November 18 advisories.
