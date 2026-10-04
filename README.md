# Ootle Workbench

A Tari Rust/WASM adaptation of **the actual Remix IDE**, forked from [Remix Project](https://github.com/remix-project-org/remix-project) v2.6.5. The product branch is `ootle`; upstream history remains available on `master`.

The editor, files, workspaces and plugin infrastructure come from Remix. Tari support adds a pinned Counter starter, a local Cargo companion, an optional local AI adapter and clear integration boundaries. It is not a fully connected hosted Tari product yet.

- [Developer setup, integration flags and end-to-end task list](docs/ootle/DEVELOPER_HANDOFF.md)
- [Validation evidence and limits](docs/ootle/VALIDATION.md)
- [Original upstream README](docs/ootle/UPSTREAM_README.md)
- [Tari developer reference](https://ootle.tari.com/)

Build the web app using the handoff instructions. Serve `dist/apps/remix-ide` on any static host. Start the opt-in local companion with `node tools/tari-companion/server.mjs --allow-run` to compile trusted Rust code. Wallet deployment and public Lobby publishing are **not connected**; no successful transactions or submissions are simulated.

## Contributing

Target changes to `ootle`. Keep the upstream license and third-party notices. Add a `DEV_REQUIRED[ID]` marker and update the handoff for unfinished integration boundaries. Do not replace unavailable integrations with success messages, fake balances, hashes, deployments or publications. Preserve existing workspaces and export paths when changing storage or navigation.

[Upstream license](LICENSE) and file-level notices apply. Ootle branding does not imply endorsement by Remix or Tari Labs.
