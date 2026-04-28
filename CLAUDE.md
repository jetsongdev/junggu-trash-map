@AGENTS.md

## Project task queue

Read `docs/tasks.md` at the start of every session. It is the single source of truth for:
- Current phase / done items
- Next priorities (P1.x → P2.x → P3.x)
- Open decision points
- Gotchas discovered while building

Update it as you work — see "운영 규칙" at the bottom of that file.

## Visual history

Each major milestone gets one mobile screenshot in `docs/snapshots/NN-slug/`. After finishing a phase or shipping a visible UX change, invoke the user-level `snapshot` skill (installed at `~/.claude/skills/snapshot/`) to capture and update the index.

Project-specific overrides live in `.snapshot.config.json` at the repo root — viewport, dev URL, wait text, etc. The skill reads it automatically.

## CHANGELOG

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) — `[Unreleased]` at top, then versioned releases under it.

Update **`[Unreleased]`** in the same turn that a notable change ships:
- A `docs/tasks.md` task moves to Done, **and** the change is user-visible OR architecturally meaningful
- A new snapshot is added to `docs/snapshots/`
- A perf/fix/infra change a future reviewer would care about

Skip for: comments-only edits, internal renames, dev-tool tweaks invisible to users, code reviews that don't change behavior.

Group by Keep a Changelog category: `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security` (+ `Performance` and `Infrastructure` as project-specific groupings allowed). One bullet = one user-visible change. Phrase from the user/reviewer perspective, not from the implementation side.

When the user asks for a release / version cut, move `[Unreleased]` content under a new `## [X.Y.Z] - YYYY-MM-DD` heading, leave `[Unreleased]` empty, and update the compare link footnote.
