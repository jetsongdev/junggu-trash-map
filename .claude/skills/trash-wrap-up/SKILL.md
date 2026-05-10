---
name: trash-wrap-up
description: junggu-trash-map의 P*.* feature 또는 I.* 인프라 작업을 일단락하기 직전에 docs/tasks.md, CHANGELOG.md `[Unreleased]`, docs/snapshots, 빌드·테스트 상태가 모두 갱신됐는지 점검하는 정찰형 체크리스트. 사용자가 "마무리할 때 체크", "빠진 거 없나", "정리할 거 있나", "wrap up", "끝내기 전에 확인", "이거로 끝내도 돼?", "다 됐나" 같이 **머지·종료 직전 점검을 요청**하거나, 큰 변경을 commit·push 직전에 멈춰 점검이 자연스러운 시점에 자동 트리거. `feat/p*.*-*` feature 브랜치뿐 아니라 `chore/i.*-*` 인프라 브랜치(예: I.3 lighthouse 게이트, I.5 chrome 톤 정비)에도 동일하게 적용 — 두 종류 모두 tasks.md / CHANGELOG 갱신 의무가 있어 게이트가 빠지면 안 된다. `trash-feature-merge-flow`가 머지까지 적극 진행하는 흐름이라면, 이 스킬은 그 앞 단계에서 누락만 잡아내고 사용자가 결정하게 한다 — 자동으로 문서를 수정하지 않는다.
---

# trash-wrap-up

junggu-trash-map의 feature 작업이 끝났을 때 **머지로 넘어가기 전에 빠진 후처리가 있는지 점검**한다. 점검만 한다. 자동으로 tasks.md를 옮기거나 CHANGELOG에 항목을 박지 않는다 — 누락 리스트를 사용자에게 주고 사용자가 결정한다.

## 왜 점검만 하나

자동으로 채워 넣으면 **사용자/리뷰어 관점에서의 한 줄 요약**(CHANGELOG 본문)이나 **task 분류 판단**(어느 P*.* 항목인지, 부분 완료인지)을 모델이 추측하게 된다. 이 둘은 짧지만 사용자 의도가 강하게 들어가는 부분이라, 자동 생성보다 "어디가 비었는지" 알려주고 사용자가 한 줄을 찍는 편이 결과 품질이 일관됐다.

또 머지까지 가는 적극형 흐름은 이미 `trash-feature-merge-flow` 가 처리한다. 이 스킬은 그 흐름의 입력을 깨끗하게 만드는 게 목적.

## 언제 트리거

- `feat/p*.*-*`, `chore/i*.*-*`, `fix/*` 브랜치에서 코드 변경이 있고, 사용자가 "마무리", "정리", "wrap up", "끝내자", "체크" 같이 점검 의사를 표현
- `git commit` 직후 / push 직전 / `gh pr create` 직전
- `trash-feature-merge-flow` 진입 직전 — 머지 흐름이 의존하는 문서들이 다 맞춰져 있는지 확인하고 싶을 때

기준: **변경이 user-visible / 아키텍처에 의미** 있는 경우에만 점검할 가치가 있음. comment-only / 내부 리네임 / dev-tool tweak 같은 PR이면 스킵해도 됨.

## 점검 항목 (6개)

각 항목은 ✅ / ⚠️ / ❌ 중 하나로 보고. ⚠️ 는 "사람이 판단해야 하는 회색 지대", ❌ 는 "명백히 빠짐".

### 1. git 상태

```bash
git branch --show-current
git status --short
git log --oneline main..HEAD 2>/dev/null
git diff --name-only main...HEAD 2>/dev/null
```

- ✅ 브랜치가 `feat/p*.*-*` / `chore/i*.*-*` / `fix/*` 형식이고 워크트리 깨끗
- ⚠️ uncommitted 변경이 남아있음 — 의도적인지 확인 필요
- ❌ main 브랜치에서 직접 작업 중 (워크플로 위반)

`git diff --name-only main...HEAD` 의 출력은 이후 항목에서 카테고리화 (src/ vs docs/ vs .github/ 등)에 사용한다.

### 2. docs/tasks.md — 해당 task 항목이 ✅ Done으로 이동했나

이 프로젝트에는 **두 종류의 task 식별자**가 있고, 둘 다 같은 무게로 다뤄야 한다:

- **`P*.*` (Phase task)**: feature 작업. 예: `P2.17`, `P3.1b`, `P3.2`. 브랜치 `feat/p2.17-...`, commit `feat(P2.17): ...`
- **`I.*` (Infrastructure task)**: CI / 관측 / 워크플로 / Lighthouse 임계 / chrome 톤 정비 등. 예: `I.3`, `I.5`. 브랜치 `chore/i.5-...`, commit `feat(I.5): ...` 또는 `chore(I.3): ...`

`I.*`를 빠뜨리면 **이 스킬의 핵심 게이트가 무력화된다** — `chore/i.5-light-mode` 같은 브랜치가 점검을 통과해버려 tasks.md가 갱신 안 된 채 머지될 수 있음 (실제로 그런 PR이 있었음).

#### 케이스 정책 (중요)

이 저장소는 ID 케이스가 위치마다 다르다:
- **commit·PR title**: `feat(P2.17):`, `feat(I.5):` — 보통 대문자
- **브랜치명**: `feat/p3.1b-cluster`, `chore/i.5-light` — 슬러그라 소문자
- **tasks.md 본문**: `**P3.1b**`(소문자 suffix), `**P2.17**`(suffix 없음), `**I.5**` — phase suffix는 거의 항상 소문자

따라서 추출된 ID를 **대문자화하지 말 것**. `tr '[:lower:]' '[:upper:]'` 같은 정규화를 거치면 `P3.1b` → `P3.1B` 가 되어 tasks.md grep이 빗나감(또는 `-i` 플래그로 살리려 하면 이번엔 Phase 헤더의 inline 본문 — `다음 P3.1b (markercluster)` 같은 줄 — 이 잡혀서 진짜 task 라인을 못 가리킴). 추출 시점부터 원본 케이스 유지하고, 비교 시에만 case-insensitive로.

#### 추출

```bash
# main..HEAD commit subject + 브랜치명 양쪽에서 추출, 첫 매치 케이스 유지
{
  git log --format=%s main..HEAD 2>/dev/null
  git branch --show-current
} | grep -oE '([Pp][0-9]+\.[0-9]+[a-zA-Z]?|[Ii]\.[0-9]+[a-zA-Z]?)' \
  | awk '!seen[tolower($0)]++'
# commit subject의 표기(I.5, P3.1b)를 우선하고, 브랜치의 소문자 slug는 fallback source로만 사용
```

#### tasks.md 매칭 — bold + checkbox prefix로 한정

```bash
# 추출된 각 ID를 escape 후 한 번에
IDS_RE=$(... | sed 's/\./\\./g' | paste -sd'|' -)
grep -niE "^[[:space:]]*-[[:space:]]*\[[ x]\][[:space:]]*\*\*(${IDS_RE})\*\*" docs/tasks.md
```

이 패턴이 중요한 이유:
- `**ID**` (굵은체) — task 항목의 식별자만 잡음. Phase 헤더 inline `다음 P3.1b (...)` 같은 본문 줄은 자동 제외됨
- `^[[:space:]]*-[[:space:]]*\[[ x]\]` — 줄이 list item + checkbox로 시작해야 함. **Done/Open 판정은 섹션이 아니라 이 prefix의 `[x]` vs `[ ]`로 직접** (섹션 헤더 추적은 Markdown 구조 변경에 약함)
- `-i` — `P3.1b`/`P3.1B`/`p3.1b` 어떤 표기든 매치

#### 판정

매칭된 줄의 `[x]` vs `[ ]` 로:
- ✅ `[x]` 줄 매치 — Done에 있음
- ⚠️ `[x]`와 `[ ]` 둘 다 매치 — 같은 ID가 두 번 나옴(부분 완료 분기일 수 있음, 사용자 판단)
- ❌ `[ ]` 만 매치 — Open 그대로
- ❌ 매치 0건 — tasks.md에 항목 자체가 없음. 새 task면 사용자가 먼저 항목을 추가해야 함
- ⚠️ 브랜치명·commit에 P/I 번호 모두 없음 — pure docs·release-bot·hotfix일 수 있음. 변경 파일 분류로 의도 확인

또 「현재 상태」 헤더의 날짜가 오늘이 아니면 ⚠️ — phase 진행 중이면 갱신 후보.

### 3. CHANGELOG.md `[Unreleased]` 비어있지 않나

```bash
awk '/^## \[Unreleased\]/{f=1; next} /^## \[/{f=0} f' CHANGELOG.md
```

출력된 본문이:
- ✅ `### Added/Changed/Fixed/Performance/Infrastructure` 중 하나 이상에 bullet 1개 이상
- ❌ 비었음 — release 워크플로 fail 트리거 (CLAUDE.md 「Release」 섹션 참고)

비었으면 변경 파일을 분류해서 후보 카테고리를 제시:
- `src/`, `app/`, `components/` 변경 → `Added` / `Changed` 후보
- `lib/` 순수 함수 변경 → `Performance` 또는 `Fixed` 후보
- `.github/`, `vercel.json`, `lighthouserc.*` → `Infrastructure` 후보
- `*.test.ts`만 변경 → 보통 CHANGELOG 스킵 OK

**중요**: 한 줄 본문은 모델이 추측하지 말고 사용자에게 "어떤 카테고리의 어떤 변화로 적을지" 물어볼 것. 사용자/리뷰어 관점이 깨지면 이 파일의 가치가 사라진다.

### 4. docs/snapshots — 시각 변화에 대응되는 새 snapshot 있나

```bash
git diff --name-only main...HEAD | grep -E '^(src/(app|components)|app|public/data)' | head
# NN-slug 패턴만 추출 — `^[0-9]+-`만으론 `2026-05-09`도 잡히니 1~3자리로 한정
ls docs/snapshots/ | grep -E '^[0-9]{1,3}-' | sort -t- -k1,1n | tail -3
```

휴리스틱:
- `src/components/`, `src/app/page.tsx`, `app/page.tsx`, `public/data/` 변경 → 시각 변화 가능성 높음
- 마지막 snapshot 디렉토리(`NN-slug`)의 NN보다 큰 새 디렉토리가 `git diff --name-only main...HEAD` 에 있는가?

판정:
- ✅ 시각 변화 있고 새 snapshot 디렉토리 추가됨
- ⚠️ 시각 변화 있지만 새 snapshot 없음 — 의도적 스킵(작은 polish)인지, snapshot 빠뜨렸는지 사용자 판단
- ✅ 시각 변화 없음(내부 리팩터·테스트만) → snapshot 불필요
- ❌ snapshot 디렉토리는 추가됐는데 `meta.md`나 `screenshot.png` 누락 (incomplete capture)

snapshot이 있다면 `meta.md` 의 `git_sha:` 를 확인 — 현재 HEAD와 다르면 ⚠️ "SHA 정합 commit 필요". 이건 `trash-feature-merge-flow` 6단계에서 처리되지만 미리 알려두면 사용자가 commit 묶을 때 의식할 수 있음.

### 5. 빌드 / 테스트

```bash
bun run test 2>&1 | tail -20
bun run build 2>&1 | tail -10
```

- ✅ 둘 다 통과
- ❌ 테스트 실패 → 머지 절대 X, 즉시 보고
- ❌ 빌드 실패 → 머지 절대 X, 즉시 보고
- ⚠️ 사용자가 명시적으로 "빠른 점검" 요청한 경우 이 단계 스킵 가능 — 다만 스킵했다고 명시

기본은 둘 다 돌리지만, 변경이 docs-only(예: `docs/`, `CHANGELOG.md`, `README.md`만)면 빌드만 돌리거나 둘 다 스킵해도 합리적.

### 6. (선택) commit author 이메일

```bash
git log -1 --format=%ae
```

- ✅ `jetsong.dev@gmail.com` — Vercel deploy 통과
- ❌ 다른 이메일 — Vercel block 위험, fix 필요

이건 trash-feature-merge-flow 1단계에서도 잡지만, push 전에 미리 알아두면 amend로 바꿀 기회가 있음.

## 출력 형식

체크리스트 형태. 항목별 한 줄. ❌가 하나라도 있으면 머지 흐름 진입 X. ⚠️는 사용자가 OK 라고 답하면 진행 가능.

```
trash-wrap-up 점검 (브랜치: feat/p3.1b-cluster, main..HEAD 4 commits)

✅ git 상태 — 워크트리 깨끗
❌ docs/tasks.md — P3.1b 항목이 「Open」에 그대로 있음. ✅ Done으로 이동 필요
⚠️ CHANGELOG `[Unreleased]` — 비어있음. 후보: `Added` (markercluster 도입) 또는 `Performance` (다구 패닝 비용 절감)
✅ snapshot — 21-cluster-density 추가됨, meta.md SHA = parent (push 후 SHA 정합 필요)
✅ 빌드 — bun run build 통과
✅ 테스트 — 105개 통과

→ ❌ 1건, ⚠️ 1건. tasks.md 갱신 + CHANGELOG 한 줄 박은 후 trash-feature-merge-flow 진입 권장.
```

마무리 멘트는 점검 결과에 따라:
- 다 ✅ → "전부 OK. `trash-feature-merge-flow` 진입해도 됨."
- ❌ 있음 → "❌ N건 — 위 항목 처리 후 다시 wrap up."
- ⚠️만 있음 → "⚠️ N건 — 의도적 스킵이면 진행 OK."

## 함정

- **`I.*` task 누락 = 게이트 무력화**: 정규식이 `P[0-9]+\.[0-9]+`만 잡으면 `chore/i.5-...` 같은 인프라 브랜치가 점검을 그냥 통과한다. 두 패턴 (P*.* + I.*) 모두 추출하고, 어느 한쪽도 못 잡았다고 "task 외 작업"으로 단정짓지 말 것 — 변경 파일 분류로 한 번 더 확인.
- **suffix 케이스 변환 금지**: tasks.md는 `**P3.1b**`(소문자 suffix), commit은 `feat(P3.1b)` 또는 `feat(P2.17)` 형식. 추출 결과를 `tr '[:upper:]'` 로 일괄 대문자화하면 `P3.1b → P3.1B`로 바뀌어 tasks.md 매치가 비고, `-i`만으로 살리면 이번엔 Phase 헤더 inline 본문(`다음 P3.1b (markercluster)`)에 매치돼 진짜 task 라인을 못 가리킨다. 케이스는 원본 유지 + grep은 `**ID**` 굵은체 + checkbox prefix로 한정.
- **Done/Open을 섹션 헤더로 추적하지 말 것**: tasks.md의 `## ✅ Done`, `## 다음 우선` 같은 섹션 라벨은 phase 진행하면서 자주 재구성됨. 매치 라인 자체의 `[x]` vs `[ ]` prefix로 판정하는 편이 견고하다.
- **자동으로 tasks.md / CHANGELOG에 박지 말 것**: 사용자 의도 추측이 자주 어긋난다. 누락만 알리고 사용자가 한 줄 찍게 한다.
- **build·test를 매번 풀로 돌리지 말 것**: docs-only 변경이면 두 단계 다 스킵 가능. 변경 파일 분류로 판정.
- **`main..HEAD` 빈 출력**: 브랜치가 main과 동일 (아직 commit 없음). 점검 항목 대부분이 "변경 없음 → ✅"으로 떨어지는데, 이건 진짜 OK가 아니라 "점검할 게 없음" — 사용자에게 먼저 commit하라고 알려야 함.
- **snapshot의 NN 카운팅 (자릿수 한정 필수)**: `ls docs/snapshots/`는 영문 정렬이라 `21` 다음에 `3-`이 끼면 순서 어긋남. 또 `docs/snapshots/`에는 `2026-05-09` 같은 날짜 디렉토리(I.6 a11y 등)가 NN-slug와 섞여있어서 `^[0-9]+-`만으론 부족 — `2026-`도 매치된다. NN은 1~3자리이므로 반드시 자릿수까지 한정: `ls docs/snapshots/ | grep -E '^[0-9]{1,3}-' | sort -t- -k1,1n | tail -3`. NN이 1000 넘으면 그때 확장. trash-status도 같은 함정이라 함께 점검.
- **`trash-feature-merge-flow`와 중복 안 됨**: 이 스킬은 "점검만", 그 스킬은 "실행". 사용자가 "마무리 ㄱㄱ"라고 하면 점검 후 머지 흐름까지 가는 게 자연스럽지만, 별도 스킬 invoke 결정은 사용자에게 맡긴다.
- **commit body 예시 인용 false positive**: subject·브랜치명만 추출 소스로 쓰고 body(%B)는 피한다. body엔 설계 설명·다른 task 인용·CHANGELOG 발췌 등이 자주 들어가 P/I 패턴이 noise로 잡힌다. subject scope(feat(P3.1b):)와 브랜치 슬러그(feat/p3.1b-...)가 의도의 1차 출처.
