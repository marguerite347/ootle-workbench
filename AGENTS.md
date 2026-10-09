# Ootle Workbench fork

The product branch is `ootle`; `master` preserves upstream Remix history. Start with `docs/ootle/DEVELOPER_HANDOFF.md` and `VALIDATION.md`. Keep upstream licenses and notices. Reuse the actual Remix editor, filesystem and plugin architecture.

Never simulate successful compilation, tests, transactions, AI responses or public submissions. Mark incomplete integrations with `DEV_REQUIRED[ID]` and update the handoff. The trusted local Cargo companion is not a public sandbox. Never expose it to the internet or place provider credentials in browser code.

Validate the source-backed behavior, not just rendered controls. Preserve current Remix workspace data and normal file import/export. The discarded Lobby editor was not a working product and had no user-created projects; do not add migration or recovery features for it. Match a deployed build to committed source and distinguish localhost, preview and production.

## Reviewed contribution policy

Effective 2026-10-09, the owner has ended automatic enrollment and unrestricted pushes for both Ootle repositories. This supersedes the 2026-10-06 interim policy.

Anyone may contribute through a fork and pull request. Collaborator write access is granted only to trusted developers individually by the owner; agents use their developer's separately authorized identity. Neither requesting access nor repository instructions grant credentials or permissions.

Changes to the product branch must use a pull request with passing required GitHub Actions checks and at least one approving review. Security-sensitive paths require CODEOWNERS approval from @marguerite347. New commits dismiss stale approvals, the latest push needs independent approval, and review conversations must be resolved. Administrators are subject to these controls; force pushes and branch deletion are blocked.

Use feature branches, preserve other contributors' work, and run relevant checks. Do not bypass protections, approve your own work, or claim an unverified deployment. If the author is the only eligible code owner, ask the owner to designate an independent trusted reviewer before merging; do not silently relax the rule. Hosting, runtime execution, wallet and production-secret authority remain separate from repository access.
