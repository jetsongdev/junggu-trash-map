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

**Snapshot pipeline (이 프로젝트 한정)**: 글로벌 `snapshot` 스킬이 캡처·meta·README 갱신을 끝낸 직후 자동으로 `trash-snapshot-commit` 프로젝트 스킬로 이어진다 — 추가 사용자 확인 없이 두 commit (1차: snapshot 본체, 2차: SHA 정합) + push까지 한 파이프라인. snapshot 산출물이 단독 변경인 경우만 적용. 코드 변경이 같이 staged면 `trash-feature-merge-flow`가 흡수. 빠뜨리기 쉬운 SHA 정합을 자동화하는 게 핵심.

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
- **Vercel project**: `jetsongdev/junggu-trash-map`, production alias `https://junggu-trash-map.vercel.app`
- **GitHub auto-deploy 연결됨** — main push → production, 그 외 브랜치 push → preview. 둘 다 16~22초 빌드. 수동 `vercel deploy`는 hotfix·우회 시에만.
- **Preview branch alias** — 같은 브랜치에 다시 push해도 URL 유지 (위 워크플로 7단계 참고). 공유·북마크 가능.
- **Analytics + Speed Insights 설치됨** (`@vercel/analytics`, `@vercel/speed-insights`) — `app/layout.tsx`에 컴포넌트 마운트. dashboard의 Analytics/Speed Insights 탭에서 RUM 데이터 확인.
- **Telegram 배포 알림** (`.github/workflows/telegram-preview-notify.yml`) — `deployment_status` 이벤트 → 단일 그룹 + Topics 분기 (Preview/Production/Errors). secrets `TG_BOT_TOKEN`/`TG_CHAT_ID` + vars `TG_TOPIC_PREVIEW`/`TG_TOPIC_PROD`/`TG_TOPIC_ERROR` 등록돼 있음. 셋업 가이드 gist: https://gist.github.com/jetsongdev/bd80cb02e5e3fb9a26b892cc5fef2dcc
- `.vercel/`은 `.gitignore`에 포함되어 있음 — 커밋 금지.

## CHANGELOG

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) — `[Unreleased]` at top, then versioned releases under it.

Update **`[Unreleased]`** in the same turn that a notable change ships:
- A `docs/tasks.md` task moves to Done, **and** the change is user-visible OR architecturally meaningful
- A new snapshot is added to `docs/snapshots/`
- A perf/fix/infra change a future reviewer would care about

Skip for: comments-only edits, internal renames, dev-tool tweaks invisible to users, code reviews that don't change behavior.

Group by Keep a Changelog category: `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security` (+ `Performance` and `Infrastructure` as project-specific groupings allowed). One bullet = one user-visible change. Phrase from the user/reviewer perspective, not from the implementation side.

## Release (자동 cut)

버전 cut은 PR 라벨로 자동. 사람이 직접 `[Unreleased]`를 옮기거나 `package.json`을 bump하지 않는다 — 라벨 붙은 PR이 main으로 머지되면 `.github/workflows/release-on-merge.yml` 이 처리한다.

라벨 → bump 매핑:
- `release:patch` — bug fix·미세 조정 (0.9.0 → 0.9.1)
- `release:minor` — 새 기능·사용자 가시 변화 (0.9.0 → 0.10.0). **기본값**, 새 P*.* 머지 시 거의 항상 이쪽
- `release:major` — 호환성 깨는 변화 (0.9.0 → 1.0.0). 1.0 가기 전엔 거의 안 씀

라벨이 없으면 워크플로 skip — telegram routing·lighthouse 임계 조정·docs-only 같은 인프라 PR은 자연스럽게 우회된다.

PR 만들 때 라벨 붙이기:
```bash
gh pr edit <num> --add-label release:minor
```

자동으로 일어나는 일 (라벨 머지 시):
1. `package.json` 버전 bump
2. `CHANGELOG.md` `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD` + 새 빈 `[Unreleased]` + compare link 갱신
3. main에 `chore(release): vX.Y.Z` 직접 push
4. annotated tag `vX.Y.Z` push
5. GitHub Release 생성 (해당 버전 CHANGELOG 섹션이 release notes)
6. 머지된 PR에 release 링크 코멘트

**Vercel 배포 동작** (hobby plan, 동시 1 슬롯):
- 머지 commit이 main에 들어올 때 Vercel이 production build → 사용자 가시 변경 반영
- 그 직후 bump commit이 push되지만 **Vercel project Settings → Build and Deployment → Ignored Build Step**의 `git log -1 --pretty=%B | grep -qE '^chore\(release\): v[0-9]+\.[0-9]+\.[0-9]+' && exit 0 || exit 1` 가드로 deployment registration 자체를 거부 → 큐 슬롯 안 잡음. 결과적으로 release cut 1회 = production build 1회.
- 정규식이 `v[0-9]+\.[0-9]+\.[0-9]+`까지 요구하므로 일반 `chore(release):` prefix(예: 워크플로 정리 commit)에는 매치 안 됨 — 그런 commit은 정상 빌드된다.

**전제 조건**: `[Unreleased]` 가 비어있지 않아야 함 — 비었는데 라벨이 붙으면 워크플로 fail (의도적; release 의미 없음). 따라서 PR 작성 시 CHANGELOG `[Unreleased]` 갱신은 필수.

partial-fail 복구: workflow_dispatch escape hatch 있음 — Actions 탭 → "Release on merge" → "Run workflow" → kind 선택. 라벨 단계 우회하고 직접 bump.

bump 로직은 `scripts/bump-version.ts` 순수 함수(`nextVersion` / `transformChangelog` / `extractReleaseNotes`) + vitest 17개로 회귀 방어. 변경 시 같이 갱신.
