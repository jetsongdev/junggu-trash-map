# Lighthouse CI 첫 baseline — `preset: mobile` 무효, PWA 카테고리 LH12에서 제거, 임계치는 측정값에서 시작

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: I.3 Lighthouse CI 도입 (run 25329428528 → 25329738364)

## 문제

`treosh/lighthouse-ci-action@v12` (Lighthouse 12 기반)으로 첫 워크플로우 실행 → collect 단계가 즉시 실패.

```
Run #1...failed!
Error: Lighthouse failed with exit code 1

Invalid values:
  Argument: preset, Given: "mobile", Choices: "perf", "experimental", "desktop"
```

`lighthouserc.json`엔 이렇게 박혀 있었다:

```json
{
  "ci": {
    "collect": {
      "settings": {
        "preset": "mobile"
      }
    }
  }
}
```

## 진단 — 세 가지 함정

### 1. `"preset": "mobile"` 은 유효한 값이 아니다

`preset`은 Lighthouse가 미리 정의한 **설정 번들**을 고르는 옵션. 유효 값:

| preset | 의미 |
|--------|------|
| `perf` | 성능 카테고리에만 집중 (audit 일부만) |
| `experimental` | 실험 audit 포함 |
| `desktop` | 데스크톱 form factor + 설정 |

**모바일은 그냥 default**다. preset을 빼면 자동으로 mobile form factor + 4G 모바일 throttling. `"mobile"`이라고 적으면 문법 오류.

### 2. PWA 카테고리는 Lighthouse 12에서 제거됨

assertion에 PWA가 있었다:

```json
"categories:pwa": ["error", { "minScore": 0.85 }]
```

LH 12부터 PWA는 별도 카테고리에서 제거되고 개별 audit으로 흩어졌다 (`installable-manifest`, `service-worker` 등). category lookup이 missing → assertion fail.

> Deprecated since Lighthouse v12.0.0 (released early 2025). Use installable-manifest, service-worker audits directly if you need them.

남은 카테고리: performance / accessibility / best-practices / seo.

PR 코멘트에서 `PWA: n/a` 같은 식으로 표시되면 자연스러움.

### 3. 첫 baseline 임계치는 일반적 권장치보다 측정값에서 시작

처음 박았던 임계치 (모바일 web app 일반 권장):

| Category | minScore | 첫 측정 (median) | 결과 |
|----------|----------|------------------|------|
| performance | 0.85 | 0.74 | ❌ FAIL |
| accessibility | 0.95 | 0.96 | ✅ |
| best-practices | 0.95 | 0.93 | ❌ FAIL |
| seo | 0.90 | 1.00 | ✅ |

**둘이나 fail**. 일반 가이드라인 점수는 production 최적화된 SPA 기준. 우리 PROTO는 leaflet + OSM 타일 + 3rd-party gateway 등으로 first paint·blocking JS 무게가 있어 그 수준에 즉시 도달 X.

baseline은 **현재 측정값 - 약간의 마진**으로 시작:

```
performance: 0.74 → minScore 0.70  (- 0.04)
best-practices: 0.93 → minScore 0.90  (- 0.03)
```

이렇게 두면:
- 첫 PR이 일단 통과 (게이트 작동 검증)
- 점수 회귀(예: perf 0.74 → 0.65)는 즉시 차단 (마진 안)
- 시간이 흘러 점수가 올라가면 임계치를 단계적으로 올려서 ratchet up

> "처음부터 빡센 임계치 = 모든 PR 차단 + 임계치 자체에 대한 신뢰 상실"

`lighthouserc.json` 주석에 미리 박아둠:

```json
"_comment": "임계치 너무 빡세면 한 단계씩 낮춰서 baseline 확보 가능."
```

## 최종 작동 점수

`treosh/lighthouse-ci-action@v12` PR #2:

| Category | Score | minScore | Margin |
|----------|-------|----------|--------|
| Performance | 0.75 | 0.70 | +0.05 |
| Accessibility | 0.96 | 0.95 | +0.01 |
| Best Practices | 0.93 | 0.90 | +0.03 |
| SEO | 1.00 | 0.90 | +0.10 |

PR 코멘트로 표 자동 게시 + Lighthouse 리포트 링크. 다음 PR부터 자동 회귀 차단 작동.

## 교훈

### 1. 라이브러리 메이저 버전 변경은 카테고리/preset 양쪽 다 검사

LH 12 같은 메이저 변경은:
- 새 카테고리 추가 (없음 in v12)
- 기존 카테고리 제거 (PWA)
- preset 값 변경 가능

새 워크플로우 작성 시 **현재 버전의 docs를 직접 확인** — 모델 학습 데이터의 LH 11 정보로 짜면 즉시 깨진다.

### 2. 첫 baseline은 "통과 가능한 임계치"가 우선

Quality gates는 **차단해야 할 회귀**를 막는 게 목적. 처음부터 도달 못한 점수를 기준으로 잡으면 모든 PR이 차단되고 게이트가 무력화됨 (사람들이 우회하기 시작).

순서:
1. 측정 → 현재 점수 파악
2. 임계치 = 측정값 - 작은 마진
3. baseline 통과 확인
4. 시간 두고 점수 끌어올리며 임계치도 단계적 상향 (ratchet pattern)

### 3. workflow_dispatch는 baseline 측정용 escape hatch

`workflow_dispatch`로 main에서 직접 한번 돌려보고 임계치 조정하는 게 PR 라운드트립보다 빠름. 별도 TIL: [github-actions-first-workflow-bootstrap.md](./2026-05-04-github-actions-first-workflow-bootstrap.md).

## 김동현 원펀치

`preset: mobile`은 무효 값(default라서 빼야 함). PWA 카테고리는 LH 12에서 제거. 첫 baseline 임계치는 일반 가이드 점수가 아니라 **현재 측정값 - 마진**에서 출발해 ratchet up.
