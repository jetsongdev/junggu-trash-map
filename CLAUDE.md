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

## 작업 워크플로 (P*.* 단위)

새 task는 main에 직접 commit하지 말고 **feature branch → preview → main** 순서로 흘린다. preview에서 검수하는 한 단계가 production 회귀를 막는다 (특히 GPS·hydration·검색처럼 SSR/CSR가 갈라지는 동작은 local dev로는 못 잡는 게 있다).

1. **브랜치 만들기** — `git checkout -b feat/PX.Y-short-slug` (hotfix는 `fix/...`, 인프라는 `chore/...`)
2. **구현 + `bun run build` 통과**
3. **시각 변화 있으면 `/snapshot`** — `docs/snapshots/NN-slug/` 누적
4. **`docs/tasks.md`** — 해당 P 항목을 ✅ Done으로 이동, 새로 발견한 함정은 함정 메모에 추가
5. **`CHANGELOG.md` `[Unreleased]`** — 사용자 관점 한 줄 (Keep a Changelog 분류)
6. **commit + `git push -u origin <branch>`** — Vercel이 자동 preview 빌드 (16~22초)
7. **preview에서 검수** — 브랜치 stable alias `https://junggu-trash-map-git-<branch-slug>-jetsongdev.vercel.app` 가 같은 브랜치 push마다 갱신됨. iPad/모바일 GPS·HTTPS 의존 기능은 여기서만 검증 가능
8. **OK면 main 통합** — `gh pr create --base main` 후 squash merge, 또는 `git checkout main && git merge --no-ff <branch> && git push` → production 자동 배포

브랜치 alias 형식: 브랜치명의 `/`·`.`이 `-`로 변환됨 (`feat/p2.12-search` → `feat-p212-search`). 즉 영구 URL을 미리 짐작할 수 있음.

snapshot의 `git_sha`는 capture 시점의 parent HEAD가 박힘 — commit 직후 새 SHA로 한 번 갱신하고 추가 한 줄 commit ("docs: snapshot NN SHA 정합") push (이전 commit들 패턴 참조).

## Deploy / verification

- **GitHub remote**: `origin → https://github.com/jetsongdev/junggu-trash-map` (private)
- **Vercel project**: `ssssccccchhhhhs-projects/junggu-trash-map`, production alias `https://junggu-trash-map.vercel.app`
- **GitHub auto-deploy 연결됨** — main push → production, 그 외 브랜치 push → preview. 둘 다 16~22초 빌드. 수동 `vercel deploy`는 hotfix·우회 시에만.
- **Preview branch alias** — 같은 브랜치에 다시 push해도 URL 유지 (위 워크플로 7단계 참고). 공유·북마크 가능.
- **Analytics + Speed Insights 설치됨** (`@vercel/analytics`, `@vercel/speed-insights`) — `app/layout.tsx`에 컴포넌트 마운트. dashboard의 Analytics/Speed Insights 탭에서 RUM 데이터 확인.
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
