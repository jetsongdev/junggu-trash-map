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

## Deploy / verification

- **GitHub remote**: `origin → https://github.com/jetsongdev/junggu-trash-map` (private)
- **Vercel project**: `ssssccccchhhhhs-projects/junggu-trash-map`, alias `https://junggu-trash-map.vercel.app`
- 코드 변경 후 사용자가 iPad/모바일에서 검증할 수 있도록 push 후 `vercel deploy --prod` (또는 `vercel`로 preview)로 배포 URL을 새로 굽는다.
- Vercel 대시보드에서 GitHub 자동 연결을 켜면 push만으로 자동 deploy. 첫 link 시도에서 자동 연결 실패한 적 있으니 안 되면 대시보드 → Settings → Git에서 수동 연결.
- `.vercel/`은 `.gitignore`에 포함되어 있음 — 커밋 금지.

## CHANGELOG

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) — `[Unreleased]` at top, then versioned releases under it.

Update **`[Unreleased]`** in the same turn that a notable change ships:
- A `docs/tasks.md` task moves to Done, **and** the change is user-visible OR architecturally meaningful
- A new snapshot is added to `docs/snapshots/`
- A perf/fix/infra change a future reviewer would care about

Skip for: comments-only edits, internal renames, dev-tool tweaks invisible to users, code reviews that don't change behavior.

Group by Keep a Changelog category: `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security` (+ `Performance` and `Infrastructure` as project-specific groupings allowed). One bullet = one user-visible change. Phrase from the user/reviewer perspective, not from the implementation side.

When the user asks for a release / version cut, move `[Unreleased]` content under a new `## [X.Y.Z] - YYYY-MM-DD` heading, leave `[Unreleased]` empty, and update the compare link footnote.
