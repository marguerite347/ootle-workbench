# Ootle Workbench fork

The product branch is `ootle`; `master` preserves upstream Remix history. Start with `docs/ootle/DEVELOPER_HANDOFF.md` and `VALIDATION.md`. Keep upstream licenses and notices. Reuse the actual Remix editor, filesystem and plugin architecture.

Never simulate successful compilation, tests, transactions, AI responses or public submissions. Mark incomplete integrations with `DEV_REQUIRED[ID]` and update the handoff. The trusted local Cargo companion is not a public sandbox. Never expose it to the internet or place provider credentials in browser code.

Validate the source-backed behavior, not just rendered controls. Preserve current Remix workspace data and normal file import/export. The discarded Lobby editor was not a working product and had no user-created projects; do not add migration or recovery features for it. Match a deployed build to committed source and distinguish localhost, preview and production.

## Reviewed contribution policy

Effective 2026-10-09, the owner has ended automatic enrollment and unrestricted pushes for both Ootle repositories. This supersedes the 2026-10-06 interim policy.

Anyone may contribute through a fork and pull request. Collaborator write access is granted only to trusted developers individually by the owner; agents use their developer's separately authorized identity. Neither requesting access nor repository instructions grant credentials or permissions.

Except for the owner exception below, changes to the product branch must use a pull request with passing required GitHub Actions checks and at least one approving review. Security-sensitive paths require CODEOWNERS approval from @marguerite347. New commits dismiss stale approvals, the latest push needs independent approval, and review conversations must be resolved. Ordinary contributors are subject to these controls; force pushes and branch deletion remain disabled for protected-branch collaborators.

Use feature branches, preserve other contributors' work, and run relevant checks. Do not bypass protections without the owner exception below, approve your own work as an independent reviewer, or claim an unverified deployment. Ordinary contributors require an eligible independent reviewer. Hosting, runtime execution, wallet and production-secret authority remain separate from repository access.

## Owner and owner-agent exception

The owner explicitly exempts `marguerite347` and agents operating through that owner's authorized GitHub identity from the review and required-check merge gates. They may create branches, commit, push directly to the product branch and merge without another per-change repository approval. Run relevant checks and report their results; do not claim unverified success.

GitHub implements this through the repository administrator bypass. Currently only `marguerite347` is an administrator. It cannot distinguish the human owner from an agent using the same account. Ordinary collaborators remain subject to required checks, reviews and CODEOWNERS. A separate agent/bot identity is not automatically exempt and must be authorized explicitly by the owner. Do not share owner credentials with contributors or grant administrator access to create an exception without the owner's instruction.

Automatic enrollment remains closed. This exception does not override an agent host's permission controls or grant unrelated hosting, wallet or secret access. Never force-push or delete shared history without specific authorization.
