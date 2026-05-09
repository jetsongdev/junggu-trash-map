---
index: 32
slug: topn-light-slate-polish
date: 2026-05-06
phase: "P2.20 후속 — 라이트 거리선 slate 톤 + 콘트라스트 보강"
git_sha: bfa86a5d79f7a940464dcc913c30f55ed6fd3088
viewport: 390x844
---

# 32 — Top-N 거리선 라이트 톤 폴리싱 (slate 8/6/5 + opacity 보강)

스냅샷 31에서 라이트 톤은 sky 계열이라 **거리선이 sky 빈 마커·UserMarker(sky-500)와 같은 hue**라 시각적으로 묻혀 보였다. 거리선이 "경로 가이드"임이 약했음. P2.20의 후속 폴리싱 라운드:

1. **라이트만 sky → slate 교체** — 거리선이 마커류와 톤 분리되어 "경로선"으로 즉시 인식
2. **slate 한 단계 darken** — 첫 시도 slate-700/500/400은 라이트 타일(off-white) 위에서 콘트라스트 약함. slate-800/600/500 + opacity 0.9/0.85/0.9로 끌어올림

다크는 sky 톤(P2.11) 그대로 — CartoDB Dark Matter 위에서 잘 뜨므로 미터치.

## 보이는 것
- **light**:
  - rank 1: slate-800 `#1e293b` 굵은 실선 (weight 4, opacity 0.9)
  - rank 2: slate-600 `#475569` 대시 `8 6` (weight 2.5, opacity 0.85)
  - rank 3: slate-500 `#64748b` 도트 `3 5` (weight 2, opacity 0.9)
- **dark** (변경 없음):
  - rank 1: sky-500 `#0ea5e9` 실선
  - rank 2: sky-300 `#7dd3fc` 대시 `8 6`
  - rank 3: sky-200 `#bae6fd` 도트 `3 5`
- 양 테마 모두 위계: 패턴(solid > dash > dot) + 굵기(4 > 2.5 > 2) + opacity 보강
- 라이트 타일에서 거리선과 sky 마커류가 명확히 구분됨

## 무엇이 끝났나
- 라이트 거리선 slate 교체 + 한 단계 darken (총 2라운드)
- rank 3 dashArray `2 6` → `3 5` (도트 두께/간격 균형)
- rank 3 weight 1.5 → 2, opacity 보강
- light 모드에서 sky 마커와 거리선 톤 충돌 해소

## 다음 것
- I.6 a11y 라운드 (aria-label·키보드 탐색·미발행 18구 빈 자치구 라벨)
- P2.18 통계바/에러 분리, P2.19 hidden feature 발견 경로
- GitHub Actions 빌링 풀리면 PR #29 Lighthouse 게이트 → 머지
