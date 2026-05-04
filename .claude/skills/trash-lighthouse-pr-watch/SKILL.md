---
name: trash-lighthouse-pr-watch
description: junggu-trash-map의 PR이 main을 향할 때 자동 트리거되는 Lighthouse CI 게이트의 결과를 모니터링하고, 통과 시 PR 머지 + main sync까지 처리하는 자동화 흐름. 사용자가 "lighthouse 확인", "lighthouse 점수", "PR 머지", "게이트 통과", "merge PR <num>" 같이 요청하거나, `gh pr create` 또는 PR push 직후 자연스럽게 트리거. PR이 만들어진 후 ~4~5분 내 결과가 나오므로 Monitor 도구로 폴링하고 점수 표를 사용자에게 출력. 임계치 미달이면 lighthouserc 조정 가이드.
---

# trash-lighthouse-pr-watch

I.3에서 도입한 GitHub Actions 기반 Lighthouse CI 게이트의 결과를 사람 손 안 거치고 모니터링·머지하는 흐름.

## 언제 사용

- `gh pr create` 직후
- 사용자가 PR 머지 의사 표현 (`머지`, `점수 확인 후 머지`, `통과되면 머지`)
- 새 commit이 PR head 브랜치에 push되어 워크플로우 재실행됐을 때

## 왜 자동화

Lighthouse CI는 build + collect 3 runs + assert 단계를 거쳐 보통 4~5분 소요. 이 시간 동안 사용자가 다른 작업을 못 하게 막지 않으면서, 결과가 나오자마자 점수 표를 출력해 머지 결정을 빠르게 내릴 수 있도록 한다.

또 PR이 첫 baseline일 때는 임계치 조정이 필요할 수 있어 — fail 시 점수와 임계치 비교 분석을 함께 제공.

## 절차

### 1. 대상 PR + workflow run 식별

```bash
# 최근 PR 가져오기 (지정 안 됐으면 가장 최근 것)
PR_NUM=$(gh pr list --state open --head <branch> --json number --jq '.[0].number')

# 해당 브랜치의 Lighthouse CI run id 추출
RUN_ID=$(gh api "/repos/jetsongdev/junggu-trash-map/actions/runs?head_branch=<branch>&per_page=5" \
  --jq '.workflow_runs[] | select(.name == "Lighthouse CI") | .id' | head -1)
```

run id가 없으면 → 워크플로우가 아직 트리거 안 된 상태. 5~10초 대기 후 재시도. 그래도 없으면 `pull_request: branches:` 트리거 설정에 문제 있을 수 있으므로 사용자에게 보고.

### 2. Monitor로 status 폴링

`Monitor` 도구를 써서 status 변화 마다 알림 한 줄 받기. 무조건 sleep 폴링은 토큰 낭비.

```bash
# Monitor command 예시
prev=""
while true; do
  s=$(gh api /repos/jetsongdev/junggu-trash-map/actions/runs/$RUN_ID \
       --jq '.status + " " + (.conclusion // "null")')
  if [ "$s" != "$prev" ]; then echo "$s"; prev="$s"; fi
  if echo "$s" | grep -qE "completed (success|failure|cancelled|timed_out)"; then break; fi
  sleep 20
done
```

- `timeout_ms`: 600000 (10분, 빌드 통상 4~5분이면 여유)
- `persistent`: false

events:
- `queued null` → 아직 큐 대기
- `in_progress null` → 빌드 또는 lighthouse 실행 중
- `completed success` → 모든 단계 통과
- `completed failure` → assertion 또는 build 실패

### 3. 결과 분류

#### 3a. completed success

```bash
gh pr view $PR_NUM --json comments \
  --jq '.comments[] | select(.body | contains("lighthouse-ci-report")) | .body'
```

응답 본문에서 점수 표 추출해 사용자에게 출력.

다음으로 진행:
- 자동 머지 또는 사용자 확인 후 머지
- main sync

#### 3b. completed failure

빌드 실패인지 assertion 실패인지 구분:

```bash
gh run view $RUN_ID --log-failed | tail -80
```

**Assertion 실패** (점수 미달):
- 측정 점수 vs 임계치 표로 보여주기
- 임계치 조정 제안:
  - 측정값이 임계치보다 0.05 이상 아래면 → fix PR로 임계치 측정값 - 0.03 으로 하향
  - 측정값이 임계치보다 0.02 이내면 → flaky일 가능성, retry 권장

**Build 실패** (lighthouse 도달 전):
- 일반 next build 에러처럼 처리. import 누락·type error 등.

### 4. PR 머지 (성공 시)

사용자 확인 받거나 자동:

```bash
gh pr merge $PR_NUM --merge --delete-branch
```

`--squash` 대신 `--merge`로 — phase 흐름이 git log에 보이도록.

### 5. main sync

```bash
git checkout main
git pull origin main
```

main이 production 자동 배포 트리거. ~16~22초 후 production 반영.

### 6. 머지 후 후속 PR 게이트도 확인 (선택)

본 PR이 lighthouse config 자체를 바꾼 경우(예: 임계치 조정 fix PR), main 머지 후 다음 PR이 잘 게이트되는지 확인하는 게 좋음.

## 점수 표 형식 (사용자 출력)

```
| Category | Score | minScore | 상태 |
|----------|-------|----------|------|
| Performance | 0.75 | 0.70 | ✅ +0.05 |
| Accessibility | 0.96 | 0.95 | ✅ +0.01 |
| Best Practices | 0.93 | 0.90 | ✅ +0.03 |
| SEO | 1.00 | 0.90 | ✅ +0.10 |
| PWA | n/a | - | (LH12에서 제거) |

[Full report](URL)
```

이전 PR 점수와 delta도 같이 보여주면 회귀 추세 파악 쉬움.

## 함정

- **gh run list가 빈 응답**: 워크플로우 등록 안 된 상태. 보통 첫 도입 시 chicken-and-egg (워크플로우 파일이 main에 없음). [TIL](../../../docs/til/2026-05-04-github-actions-first-workflow-bootstrap.md) 참고.
- **점수가 매번 ±0.02 흔들림**: lighthouse는 본질적으로 jitter 있음 (network, CPU contention). 임계치는 측정 median - 0.03 마진으로 잡을 것.
- **assertion 실패 시 재시도하지 말 것**: 점수가 0.74인데 0.85 임계치라면 retry해도 동일. 임계치 자체를 바꿔야 함.
- **Lighthouse CI run + Copilot review run 헷갈림**: API 응답에 둘 다 나옴. `name == "Lighthouse CI"` 필터 필수.
- **`gh pr merge`가 502 / "Merge already in progress"**: GitHub 일시 오류 또는 직전 머지가 처리 중. 5~10초 후 retry.

## 출처

- 워크플로우: `.github/workflows/lighthouse-ci.yml`
- 설정: `lighthouserc.json`
- 도입 기록: `docs/til/2026-05-04-github-actions-first-workflow-bootstrap.md`, `docs/til/2026-05-04-lighthouse-ci-config-traps.md`
