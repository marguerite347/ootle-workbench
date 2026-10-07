# Narrow dependency compatibility patches

The canonical parent crate archives were downloaded from static.crates.io and checked against the original Cargo.lock SHA-256 before extraction. Upstream source and licenses are retained.

- `gix-hash` 0.15.1: only Cargo.toml's `faster-hex` requirement changes from 0.9.0 to =0.10.1, the upstream repaired release for RUSTSEC-2026-0306.
- `shared-buffer` 0.1.4: only Cargo.toml's `memmap2` requirement changes from 0.6.1 to =0.9.11, the upstream repaired release for RUSTSEC-2026-0186.

These parents have no compatible published release selecting both fixes. Using path patches preserves the Tari 0.32 template API and 0.41 test-engine integration. Cargo.toml.orig records upstream requirements. No cryptographic or mmap implementation is forked here. Validate both actual engine tests and wasm32 release builds in Linux CI. Remove these patches when maintained compatible parent releases include the fixes. The lockfile also replaces yanked yoke-derive 0.8.3 with 0.8.4.

Primary evidence: https://rustsec.org/advisories/RUSTSEC-2026-0306.html and https://rustsec.org/advisories/RUSTSEC-2026-0186.html
