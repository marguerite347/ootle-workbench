# Remove unused utility declarations

Repository-wide source and tooling searches found no runtime imports, requires or commands for the root Effect printer pair or Gradio client, the Solidity library eslint-scope/minixhr declarations, or the e2e adm-zip declaration. Their only matches were manifests and a pre-existing generated projects.json graph snapshot. Remove those six direct declarations while preserving packages still needed transitively and the separately scoped root minixhr declaration.

Reused workflow: prior unused-dependency pruning, Yarn lockfile regeneration with the isolated Node 24.22.2 toolchain, existing config/browser dependency tests, and the real production build. No wallet/provider credentials or third-party app execution is needed.

Validation results are retained in the dedicated maintenance evidence; publication requires the exact merged CI artifact and live acceptance.

Validation: eight existing configuration/browser dependency tests passed; the real production build completed in 61.43 seconds with 26 pre-existing webpack warnings.
