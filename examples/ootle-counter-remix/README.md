# Workbench Counter remix

Adds owner-only `increment_by(amount)` to the pinned Counter starter. All three real cloud engine tests passed, including access denial and overflow rollback. Release WASM built successfully.

Source: shared Workbench project 57c287b3-3b2a-446f-992f-90697067a47d, version 5. Source digest: dbc9aeb66b1cb2ae5a982b9943b1bc46ead817b516714d07d008154b00733231.

Run `cargo test --locked` and `cargo build --locked --release --target wasm32-unknown-unknown`. Use the project’s pinned Rust 1.99.1 toolchain. Network publication is not yet verified; see docs/ootle/TEMPLATE_DEPLOYMENT_TASK.md.

The example includes the same `shared-buffer` parent repair as the starter, with `memmap2` pinned to 0.9.12 to remove RUSTSEC-2026-0186. Vendored source and upstream MIT/Apache notices are retained. November 2 local validation passed all three engine tests on Rust 1.99.1; no network publication or wallet operation was performed.
