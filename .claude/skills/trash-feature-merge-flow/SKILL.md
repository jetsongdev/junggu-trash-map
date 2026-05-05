---
name: trash-feature-merge-flow
description: junggu-trash-map의 P*.* feature 작업이 끝난 후 main 머지까지 표준 흐름을 안내·실행. 사용자가 "마무리", "머지", "main으로", "main 머지", "ㄱㄱ" 같이 다음 단계 진행을 요청할 때 자연스럽게 트리거. snapshot 캡처 → tasks/CHANGELOG 갱신 → commit → push → SHA 정합 → main 머지 → snapshot SHA 정합 commit까지 한 번에 처리해 손순서·잊기 쉬운 후처리(특히 SHA 정합)를 빠뜨리지 않게 만든다. 코드 작업이 푸시 직전 상태이거나 PR 검증이 끝난 시점에도 자동 적용.
---

# trash-feature-merge-flow

junggu-trash-map의 feature 브랜치를 main에 통합할 때까지의 표준 워크플로우. CLAUDE.md의 「작업 워크플로 (P*.* 단위)」 8단계를 코드와 문서 일관성을 깨뜨리지 않으며 한 번에 통과시킨다.

## 언제 사용

- `feat/p*.*-*` 또는 `chore/i*.*-*` 브랜치에서 코드 변경 + 테스트 통과 후 사용자가 머지 의사를 표현 (`마무리`, `머지 ㄱㄱ`, `main으로`, `이제 통합`)
- preview 검수가 끝났거나 사용자가 시각 검증 결과 OK라고 응답한 시점
- snapshot이 필요한 시각 변화가 있는 작업

## 왜 한 번에 묶나

각 단계가 독립적이지만 **순서를 바꾸거나 빼먹으면 production 회귀**가 자주 났다. 특히:
- snapshot meta.md의 `git_sha`는 capture 시점의 parent HEAD를 박는데, 그 후 commit하면 실제 변경은 새 SHA에 들어가므로 SHA 정합 추가 commit이 필요. 빠뜨리면 snapshot이 자기 자신을 가리키지 못함.
- tasks.md를 안 옮기면 다음 세션 시작 시 같은 작업이 "Open"으로 남아 있어 혼란.
- CHANGELOG `[Unreleased]` 갱신을 빠뜨리면 release 시점에 사용자/리뷰어 관점 변화 누락.

이 스킬이 빠뜨리지 않도록 강제한다.

## 절차

### 1. 사전 검증

현재 브랜치를 확인하고 작업이 진짜 마무리 상태인지 점검.

```bash
git status              # 워크트리가 깨끗한지 (uncommitted 변경 없음)
git branch --show-current   # feat/p*.*-* 또는 chore/i*.*-* 형식인지
git config --get user.email # jetsong.dev@gmail.com 인지 확인 (Vercel block 방지)
bun run test            # 모든 테스트 통과
bun run build           # production 빌드 통과
```

테스트나 빌드가 깨지면 **머지 흐름 진입 X** — 사용자에게 보고하고 멈출 것.

### 1b. 워크트리 race 방지 (본 세션이 백그라운드 task와 같은 디렉토리 공유 시)

**리스크**: 본 세션이 `Agent` 도구 또는 `codex:rescue` 등으로 백그라운드 task를 띄운 상태이면, 그 task가 별도 브랜치를 checkout하면서 같은 워크트리의 파일을 갈아낄 수 있다. 결과로 본 세션의 commit이 의도한 브랜치 대신 task의 브랜치에 들어갈 수 있음 (실제 사고: P2.9 commit이 chore/i.3에 잘못 들어가 복구 라운드 필요).

이 race는 **검증 가능한 셸 명령으로 진단 불가** — 본 세션이 직접 spawn한 Agent task가 있는지는 conversation 메모리(어떤 `agentId`를 받았고 완료 알림이 왔는가)에서 확인해야 한다. 외부 코드로 점검할 수 없다는 점을 솔직하게 받아들이고, 다음 두 가지 액션 중 택일:

- **사전 예방 (권장)**: 본 세션이 백그라운드 Agent를 띄운 상태이면 머지 흐름 진입 전에 그 Agent의 완료 알림을 받았는지 확인. 모르겠으면 `git worktree add ../<branch>-merge <branch>` 로 별도 워크트리에서 작업해 격리.
- **사후 복구 (반드시 검증 가능)**: commit이 잘못된 브랜치에 들어간 게 발견되면:
  ```bash
  git log --oneline -5      # 잘못 들어간 commit SHA 확인
  git branch -f <올바른-branch> <commit-sha>   # 올바른 브랜치 ref를 그 commit으로 이동
  git checkout <원래-브랜치>
  git reset --hard <원래 위치 SHA>             # 원래 브랜치 정리
  git push origin <올바른-branch> --force-with-lease
  ```
  reflog와 origin 모두 commit 보존하므로 데이터 손실 없음.

### 2. snapshot 캡처 (시각 변화 있을 때만)

UI에 보이는 변화가 있으면 `snapshot` 스킬을 invoke. 내부 리팩터·테스트 추가만으로 UI 무변화면 skip.

snapshot 스킬이 끝나면 다음 산출물이 있어야 함:
- `docs/snapshots/NN-slug/screenshot.png` (390×844 PNG)
- `docs/snapshots/NN-slug/meta.md` (frontmatter + 본문)
- `docs/snapshots/README.md`에 한 줄 추가

### 3. tasks.md 갱신

`docs/tasks.md` 의 해당 P*.*  / I.*  항목을:
- ✅ `[x]` 로 변경
- 「Open」 섹션에서 「Done」 섹션 위로 이동
- 한 줄 요약 유지 (long-form은 commit message에)

### 4. CHANGELOG.md 갱신

`[Unreleased]` 섹션에 사용자/리뷰어 관점 한 줄. Keep a Changelog 분류:
- `Added` — 새 기능
- `Changed` — 기존 기능 개편
- `Fixed` — 버그 픽스
- `Performance` — 성능 개선
- `Infrastructure` — 인프라/관측/CI

코멘트만 수정·내부 리네임·dev-tool 변경엔 skip.

### 5. 1차 commit + push

코드와 문서 변경을 한 commit에 묶거나(작은 작업), 분리해서(큰 작업) commit. 마지막 commit이 끝나면 push.

```bash
git add <changed-files>
git commit -m "<type>(P*.*): <한 줄 요약>

<선택적 본문 - 무엇·왜>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin <branch>
```

push 후 ~16~22초 뒤 Vercel preview 자동 배포 완료. URL 형식:
`https://junggu-trash-map-git-<branch-slug>-jetsongdev.vercel.app`

### 6. snapshot SHA 정합 (snapshot이 있을 때만)

snapshot meta.md의 `git_sha:` 줄은 capture 시점의 parent HEAD가 박혀있다. 5단계 commit 후 새 SHA를 반영해야 self-consistent.

```bash
NEW_SHA=$(git rev-parse HEAD)
# meta.md의 git_sha를 NEW_SHA로 Edit
git add docs/snapshots/NN-slug/meta.md
git commit -m "docs: snapshot NN SHA 정합"
git push origin <branch>
```

이 단계를 빠뜨리지 말 것 — snapshot이 자기 commit이 아닌 직전 commit을 가리켜 추적이 어그러진다.

### 7. (선택) preview 사용자 검증

iPad/모바일 GPS·HTTPS 의존 기능이 있으면 사용자에게 preview URL 알려주고 검증 받기. 검증 결과 OK 응답 받기 전엔 8단계 진행 X.

### 8. PR 생성 + Lighthouse 게이트 (기본 흐름)

I.3 도입 이후 모든 main 통합은 PR 단위. PR 게이트가 회귀를 차단하므로 직접 merge 흐름은 hotfix·docs 외엔 사용 X.

```bash
gh pr create --base main --title "<type>(<scope>): <한 줄 요약>" --body "..."
```

PR 생성 직후 `trash-lighthouse-pr-watch` 스킬로 점수 모니터링 + 통과 시 머지. 자세한 절차는 그 스킬 참조.

PR 머지 시 `gh pr merge <num> --merge --delete-branch` (squash X — phase 흐름이 git log에 보이도록).

### 9. main sync

```bash
git checkout main
git pull origin main
```

production 자동 배포 (`https://junggu-trash-map.vercel.app`) 트리거됨 (16~22초 후 반영).

### 머지 conflict 발생 시

`gh pr merge`가 502 또는 "not mergeable: merge commit cannot be cleanly created" 응답 → main이 분기 후 더 진행됨.

```bash
git fetch origin main
git merge origin/main --no-edit   # local 브랜치에서 main 병합
# 충돌 파일 수동 해결 → git add → git commit
git push origin <branch>
gh pr merge <num> --merge --delete-branch  # 재시도
```

## 변형 — small fix / docs only / hotfix (직접 merge OK)

PR 게이트가 무의미한 경우(예: README typo)에만 직접 merge:

```bash
git checkout main && git pull
git merge --no-ff <branch> -m "merge: <한 줄>"
git push origin main
```

기준: 사용자 visible 변화·번들 영향 없음. 의심되면 PR 흐름 사용.

## 변형 — small fix 머지 (snapshot 없음)

snapshot 단계를 skip하고 1 → 1b → 3 → 4 → 5 → 8 → 9 순. 6단계 SHA 정합도 skip.

## 함정

- **테스트 안 돌리고 commit**: 빌드는 됐지만 테스트가 깨졌을 수 있음. 두 개 다 통과 확인 필수.
- **CHANGELOG `[Unreleased]` 빼먹기**: release 시점에 사라진 변경이 됨.
- **SHA 정합 빼먹기**: snapshot이 잘못된 commit을 가리킴. 즉시 안 보이고 한참 뒤 발견.
- **`--no-ff` 빼먹기**: fast-forward 머지로 phase 흐름이 평면화. branch context 사라짐.
- **commit author 이메일 미스매치**: Vercel deploy block (`jetsong.dev@gmail.com`이어야 함).
