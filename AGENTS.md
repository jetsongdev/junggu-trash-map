<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Workflow

On pushes to a PR with a `release:*` label, `.github/workflows/version-bump.yml` recalculates and pushes a `chore(release): vX.Y.Z (PR #N)` prebump commit to the PR head.
