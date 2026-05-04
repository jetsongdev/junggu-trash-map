# GitHub Actions 첫 워크플로우 — chicken-and-egg + `pull_request: branches:` 의미 혼동

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: I.3 Lighthouse CI 도입 (PR #1 → #2)

## 문제

I.3을 위한 `.github/workflows/lighthouse-ci.yml`을 만들고 PR #1 (`chore/i.3-lighthouse-ci → main`)을 띄웠는데 **워크플로우가 한 번도 트리거되지 않았다**. PR 페이지에 lighthouse 체크 행 자체가 안 나타남.

```bash
$ gh api /repos/jetsongdev/junggu-trash-map/actions/workflows
{"total_count":0,"workflows":[]}

$ gh api /repos/jetsongdev/junggu-trash-map/actions/runs?per_page=20
{"total_count":0,"workflow_runs":[]}

$ gh run list --workflow=lighthouse-ci.yml
HTTP 404: workflow lighthouse-ci.yml not found on the default branch
```

## 진단 — 두 함정이 동시 작동

### 1. `pull_request: branches:` 필터의 의미

처음 yml은 이렇게 짜여 있었다:

```yaml
on:
  pull_request:
    branches-ignore:
      - main
```

직관적으로 "main에 push될 때는 pull_request 이벤트로 안 돌리겠다" 정도로 읽었는데 **정반대**가 맞다.

> `pull_request:` 트리거의 `branches:` / `branches-ignore:`는 **PR의 base branch (목적지)** 를 필터링한다.

즉 `branches-ignore: [main]`은 "**base가 main인 PR을 무시**" → 우리가 원하던 "main으로 향하는 PR을 게이트" 와 정확히 반대.

올바른 쓰임:

```yaml
on:
  pull_request:
    branches:
      - main   # base가 main인 PR만 트리거
```

### 2. 워크플로우는 default branch에 있어야 등록된다

위의 `branches:` 필터를 고친 뒤에도 여전히 트리거 안 됨. 이번엔 다른 이유:

> GitHub는 **default branch (main)에 있는 워크플로우 파일만** Actions UI에 등록하고 PR 트리거를 인식한다.

PR head 브랜치(`chore/i.3-lighthouse-ci`)에만 워크플로우 파일이 있고 main엔 없으면, GitHub는 그 PR에 대해 워크플로우를 fire하지 않는다. API도 `404 not found on the default branch` 명시.

이건 보안 차원의 정책 — 누가 PR로 악성 워크플로우를 추가했을 때 자동 실행되지 않도록 막는 장치.

## 해결 — chicken-and-egg를 푸는 법

### 옵션 A: 일단 main에 머지하고 다음 PR부터 게이트

가장 간단. 다만:
- 이 PR 자체는 lighthouse를 안 거치고 main 진입
- 다음 PR이 baseline 측정 + 임계치 통과 첫 사례가 됨
- 만약 워크플로우에 버그 있으면 다음 PR에서야 발견 → 또 fix PR 필요

### 옵션 B (선택): `workflow_dispatch:` 트리거 추가 + 머지 후 수동 검증

```yaml
on:
  pull_request:
    branches:
      - main
  workflow_dispatch:   # ← 한 줄 추가
```

흐름:
1. 워크플로우 파일을 **main에 우선 머지** (이때까진 트리거 안 됨)
2. main에 도착 → Actions 탭에 워크플로우 등록됨
3. **`gh workflow run lighthouse-ci.yml --ref main`** 으로 수동 실행 → baseline 측정
4. 점수 확인하고 lighthouserc 임계치 조정 PR (이때부터 자동 게이트 작동)
5. workflow_dispatch는 그대로 둠 — 장기적으로 ad-hoc 측정에 유용 (배포 전후 비교 등)

### 옵션 C (비추): `push:` 트리거 추가

```yaml
on:
  push:
    branches:
      - chore/i.3-lighthouse-ci
```

PR head 브랜치 push마다 트리거. 검증은 되지만:
- 매 push마다 lighthouse 돌아 노이즈
- 머지 후 트리거 정의를 또 정리해야 함
- 실제 PR 단위 게이트와 의미 다름

## 김동현 원펀치

GitHub Actions의 `pull_request: branches:`는 **PR의 base를 필터하는 것**, 그리고 **워크플로우는 main에 있어야 트리거된다**. 첫 도입은 chicken-and-egg라 `workflow_dispatch:` escape hatch를 함께 박는 게 정석.
