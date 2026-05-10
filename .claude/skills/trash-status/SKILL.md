---
name: trash-status
description: junggu-trash-map에서 사용자가 "어디까지 했지", "지금 뭐 하던 중", "지금 상태", "작업 어디", "현재 상황", "어디서 멈췄지" 같이 **현재 작업 진행 상황을 물을 때** 트리거. 글로벌 work-status가 git+PR+문서로 일반 보고하는 위에, 이 프로젝트 고유 신호 — `docs/tasks.md` 「현재 상태」 헤더 + 활성 P*.* / I.* 항목, `docs/snapshots/` 마지막 NN, `CHANGELOG.md` `[Unreleased]` 첫 줄들, `docs/superpowers/specs/` 진행 중 spec — 을 한 화면에 모아 "지금 P*.*-* 작업 중, spec 있음, 마지막 snapshot N, CHANGELOG 비어있음" 형태로 요약. 자동 수정 안 함, 읽기만. trash-wrap-up이 머지 직전 누락 점검이라면, 이 스킬은 그 앞 단계에서 "지금 내가 뭘 하던 중인지" 자기 자신에게 보고하는 용도.
---

# trash-status

junggu-trash-map 컨텍스트에서 "지금 어디까지 했지?"에 한 화면으로 답한다. **읽기만 한다** — 자동으로 tasks.md 옮기거나 CHANGELOG 박지 않는다.

## 왜 trash-wrap-up과 다른가

- **trash-wrap-up**: 머지 직전 점검. "빠진 거 없나?". ❌/⚠️/✅ 형태로 게이트.
- **trash-status**: 작업 *중간*에 쓰는 상황 보고. "지금 뭐 하고 있더라?". 평가 안 하고 **현재 상태만 모음**.

작업 끊겼다 돌아왔을 때 / Codex 백그라운드 task 완료 후 / 새 세션에서 컨텍스트 회복할 때.

## 언제 트리거

- 사용자가 "어디까지 했지", "지금 상태", "지금 뭐 하던 중", "작업 어디", "어디서 멈췄지", "현재 상황" 같이 상황 파악 요청
- 세션 시작 직후 사용자가 명확한 task 지시 없이 "음...", "다시 보자" 같은 신호
- Codex / 백그라운드 task 완료 알림 직후 인계 받을 때

**트리거 안 함**: 사용자가 이미 "X 추가해", "이거 고쳐" 같이 명확한 task 지시를 한 경우.

## 점검 항목

### 1. git 상태 + 워크트리 감지

```bash
git branch --show-current
git status --short
git log --oneline -3
git log --oneline main..HEAD 2>/dev/null
git diff --name-only main...HEAD 2>/dev/null | head -10

# 워크트리 감지 — junggu-trash-map은 .claude/worktrees/, .worktrees/ 두 패턴 사용
COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null)
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
[ "$COMMON_DIR" != "$GIT_DIR" ] && echo "worktree: $(git rev-parse --show-toplevel)"
git worktree list 2>/dev/null | head -10
```

브랜치명 또는 spec 파일명에서 P*.* / I.* 추출 (case 보존, 워크트리 브랜치는 `worktree-{slug}` 형식이라 P/I 없을 수 있음 → spec 파일명에서 보충):

```bash
# spec 파일명은 p3-5-p2-26 같은 dash 형식, 브랜치/commit은 p3.5/p2.26 dot 형식 — 둘 다 잡고 정규화
{ git branch --show-current
  git status --porcelain | awk '{print $2}' | grep 'docs/superpowers/specs/'
} | grep -oE '(p[0-9]+[\.-][0-9]+[a-z]?|i[\.-][0-9]+[a-z]?)' \
  | sed 's/-/./g' \
  | awk '!seen[tolower($0)]++' \
  | head -3
```

워크트리 안이라면 `worktree-*` 브랜치명만 보고 "할 일 없음"이라 판단하지 말 것 — 다음 항목(uncommitted 분류)이 진짜 신호.

### 1.5 uncommitted 분류 — draft work 신호 (워크트리에서 핵심)

워크트리는 commit 없이 spec/plan만 그려두는 단계가 흔하다. uncommitted 파일을 카테고리별로 묶어 단계 추론:

```bash
git status --porcelain | awk '{print $2}'
```

카테고리 (junggu-trash-map 기준, 있는 것만):
- `docs/superpowers/specs/*.md` → **spec 작성됨** (design phase)
- `docs/superpowers/plans/*.md` → **plan 작성됨**
- `.claude/skills/*/SKILL.md` → **새 skill 추가**
- `src/{app,components,lib}/**` → **코드 작업 중**
- `docs/snapshots/[0-9]*-*/` → **새 snapshot 추가** (시각 변화 완료)
- `CHANGELOG.md` → **CHANGELOG 갱신 중**
- `docs/tasks.md` → **task 큐 정리 중**

단계 추론:
- spec only → "design phase 끝, implementation plan 차례"
- spec + plan → "planning complete, 코드 작업 직전"
- spec + plan + src/ → "implementing"
- src/ + snapshot + CHANGELOG → "feature 완성, 머지 준비 (trash-feature-merge-flow 후보)"

### 2. docs/tasks.md — 「현재 상태」 + 활성 항목

```bash
# 「현재 상태 (YYYY-MM-DD)」 헤더와 그 다음 5~8줄
awk '/^## 현재 상태/{f=1} f && /^---$/{exit} f' docs/tasks.md | head -10
```

추출된 P/I 번호로 tasks.md에서 해당 항목 라인 찾기 (trash-wrap-up과 동일 패턴):

```bash
grep -niE "^[[:space:]]*-[[:space:]]*\[[ x]\][[:space:]]*\*\*(${ID})\*\*" docs/tasks.md
```

판정:
- `[x]` 매치 → "이미 Done으로 옮겨짐 (작업 끝났을 가능성)"
- `[ ]` 매치 → "아직 Open — 진행 중"
- 매치 없음 → "tasks.md에 항목 없음 (새 task일 수 있음)"

### 3. docs/superpowers/specs/ + plans/ — 진행 중 spec/plan

```bash
# 최근 7일 이내 수정된 spec/plan
find docs/superpowers/specs docs/superpowers/plans -type f -name '*.md' -mtime -7 2>/dev/null | head -5
# 브랜치의 P/I 번호와 매치되는 파일 우선
ls docs/superpowers/specs/ 2>/dev/null | grep -iE "(${ID})" | head -3
```

매치된 파일 1~2개의 첫 줄(제목)만 발췌. 본문은 인용 안 함.

### 4. docs/snapshots/ — 마지막 NN

```bash
# 핵심: NN-slug 패턴만 1차 필터링 후 NN 추출.
# `^[0-9]+-`만으로는 부족 — `2026-05-09` 같은 날짜 디렉토리도 매치된다 (2026이 1차 그룹).
# NN은 항상 1~3자리 (현재 47, 100 넘으면 4자리 허용해야 — 그때 다시 확장)이므로 `{1,3}`으로 한정.
LAST_NN=$(ls docs/snapshots/ 2>/dev/null | grep -E '^[0-9]{1,3}-' | grep -oE '^[0-9]+' | sort -n | tail -1)
LAST_DIR=$(ls docs/snapshots/ 2>/dev/null | grep "^${LAST_NN}-" | head -1)
echo "마지막 snapshot: ${LAST_DIR}"
```

`git status --porcelain` + `git diff --name-only main...HEAD`에 새 snapshot 디렉토리(`docs/snapshots/[0-9]+-`)가 있으면 "이번 브랜치/워크트리에서 추가됨" 표시.

### 5. CHANGELOG.md `[Unreleased]`

```bash
awk '/^## \[Unreleased\]/{f=1; next} /^## \[/{f=0} f' CHANGELOG.md | grep -v '^[[:space:]]*$' | head -10
```

- 본문 있음 → 첫 3줄 인용
- 비어있음 → "비어있음 (release 라벨 필요시 한 줄 추가 필요)" 안내

### 6. 열린 PR

```bash
gh pr view --json number,title,state,reviewDecision,statusCheckRollup,mergeable 2>/dev/null
```

PR 있으면 번호·제목·상태. 없으면 "PR 없음 (push 후 gh pr create 가능)".

### 7. (선택) 빌드/테스트 캐시

`.next/`, `node_modules/.bin/vitest` 마지막 실행 흔적 있으면 표시. 없으면 skip.

## 출력 형식

```
trash-status (브랜치: worktree-linear-sleeping-grove)

📍 현재 작업
  브랜치: worktree-linear-sleeping-grove
  ⓦ 워크트리: .claude/worktrees/linear-sleeping-grove (격리 dir, 주 저장소 아님)
  main..HEAD: 0 commits, uncommitted 2 파일
  마지막 commit: 82d39ce feat(P2.25): 토스트 stacking 큐 (#46) — 이미 머지됨

📦 draft work 분류 (P3.5 / P2.26 추정 — spec 파일명에서)
  spec: docs/superpowers/specs/2026-05-10-p3-5-p2-26-bundle-design.md
  새 skill: .claude/skills/trash-status/
  → 단계: design phase 끝, implementation plan 차례

📋 docs/tasks.md
  현재 상태 헤더: 2026-05-10 — Phase 3 마무리 + P2.25 완료
  P3.5 항목: ❑ Open ("자치구 전환 시 경로 상태 초기화")
  P2.26 항목: ❑ Open ("확대/축소 시 사용자 위치 기준")

📐 spec / plan
  spec: 2026-05-10-p3-5-p2-26-bundle-design.md (오늘)
  plan: 없음 — implementation plan 차례

📸 snapshots
  마지막: 47-toast-stacking-no-cap (이번 워크트리 추가 없음 — logic-only 작업이라 spec에 snapshot 불필요로 명시)

📝 CHANGELOG [Unreleased]
  비어있음 — release 라벨 붙일 PR이면 한 줄 필요

🔀 PR
  없음 — 아직 push 안 됨

📌 추정 다음 단계
  1. (워크트리 안) feature branch cut 또는 worktree branch 그대로 PR
  2. spec + 새 skill commit
  3. writing-plans → 코드 작성
  4. CHANGELOG 한 줄 → trash-feature-merge-flow
```

추정 어려우면 "추정 어려움 — 어떤 방향으로 가실지" 로 끝낸다. 잘못된 추정은 오도한다.

## 함정

- **자동 수정 금지**: tasks.md 옮기기, CHANGELOG 박기, commit 만들기 일체 X. trash-wrap-up은 점검, trash-status는 보고. 둘 다 read-only. 실행은 trash-feature-merge-flow 같은 별도 스킬에서.
- **수정 명령은 사용자에게 위임**: "tasks.md를 Done으로 옮길까요?" 같은 질문도 하지 말 것 — 그건 사용자가 명령했을 때 할 일. 보고하고 끝.
- **P/I suffix 케이스 보존**: trash-wrap-up과 동일 함정. `P3.1b` → `P3.1B`로 정규화하면 tasks.md grep 빗나감. 추출 시 원본 유지, 비교만 case-insensitive.
- **「현재 상태」 헤더의 날짜는 추정에 쓰지 말 것**: 갱신이 누락된 채로 남아있을 수 있음. 신호 정도로만 사용.
- **`main..HEAD` 빈 출력**: 브랜치가 main과 동일. "아직 commit 없음, 새 작업 시작 직전" 으로 보고.
- **장문 spec 인용 금지**: 첫 줄(제목)과 파일명만. 본문은 사용자가 필요하면 직접 열어보게.
- **trash-wrap-up과 혼동 안 됨**: 사용자가 "마무리 체크" / "정리할 거 있나" 같이 머지 직전 톤으로 물으면 trash-wrap-up이 맞고, "어디까지 했지" / "지금 상태" 같이 *상황 파악* 톤이면 trash-status가 맞음. 둘 다 매치되는 애매한 발화면 trash-status를 먼저 — wrap-up은 더 무거운 게이트라 사용자가 명시적 머지 의사를 보일 때만 트리거.
- **글로벌 work-status보다 우선**: 같은 발화에 글로벌 work-status도 매칭되지만, 이 스킬이 더 specific하므로 우선 트리거. 이 프로젝트가 아니면 자동으로 글로벌 fallback.
- **워크트리 안에서 `main..HEAD` 0 commits = 정상**: junggu-trash-map은 superpowers `using-git-worktrees`로 만든 `.claude/worktrees/{slug}` 격리 dir에서 작업하는 패턴이 자주 쓰인다. 워크트리 브랜치명(`worktree-{slug}`) + 0 commits + uncommitted draft가 보이면 "design phase 진행 중"이지 "할 일 없음"이 아님.
- **P/I 번호 추출은 spec 파일명도 fallback**: 워크트리 브랜치명에는 P/I 번호가 없을 수 있어(`worktree-linear-sleeping-grove` 같이) tasks.md 매치가 빗나갈 수 있다. untracked spec/plan 파일명에서도 추출해서 합집합으로 매치.
- **snapshot NN 추출 함정 (자릿수 한정 필수)**: `docs/snapshots/`에는 `47-toast-stacking-no-cap` NN-slug 외에 `2026-05-09` 같은 날짜 디렉토리도 섞임. `^[0-9]+-`만으론 부족 — `2026-`도 매치된다. NN은 1~3자리이므로 반드시 `^[0-9]{1,3}-`로 자릿수까지 한정. NN이 1000 넘으면 그때 확장. trash-wrap-up도 같은 패턴.
- **P/I 추출은 dot/dash 두 형식 모두 잡고 정규화**: 브랜치/commit은 `p3.5`/`p2.26` dot 형식, spec 파일명은 `p3-5-p2-26-...` dash 형식. `p[0-9]+\.[0-9]+` 정규식만 쓰면 spec 파일명을 못 잡는다. `p[0-9]+[\.-][0-9]+[a-z]?`로 둘 다 매치 후 `sed 's/-/./g'`로 정규화.
- **다른 워크트리 활동은 신호로만**: `git worktree list`에 `feat/p3.1b-markercluster` 같은 다른 워크트리가 있어도 우리 작업과 무관. 표시는 하되 추정에는 안 씀 (병렬 작업 컨텍스트일 뿐).
