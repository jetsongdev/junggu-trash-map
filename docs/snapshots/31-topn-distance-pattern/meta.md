---
index: 31
slug: topn-distance-pattern
date: 2026-05-06
phase: "P2.20 — Top-N 거리선 시각 분리"
git_sha: 04b780f23266f709b471b4d17a2d38363fc59adc
viewport: 390x844
---

# 31 — Top-N 거리선 패턴 분리 (rank 1 실선 / 2 대시 / 3 도트)

P2.10에서 Top-3 후보를 색·굵기·opacity로만 구분했었지만 색맹·소화면·고휘도 환경에서는 셋이 비슷해 보이는 문제가 있었다. P2.20은 **dash 패턴 자체로 rank를 분리**해 색에 의존하지 않는 시각 위계를 만든다 — 색맹 친화 패턴 보강은 I.6 a11y 라운드의 첫 한 조각이기도 하다.

## 보이는 것
- **rank 1**: 굵은 실선(weight 4, opacity dark 0.85 / light 0.9) — 1순위 후보로 시선 즉시 안착
- **rank 2**: 대시(`8 6`, weight 2.5, opacity dark 0.75 / light 0.85) — "다음 후보"임을 패턴으로 알림
- **rank 3**: 도트(`3 5`, weight 2, opacity dark 0.7 / light 0.9) — 가독성 보강된 보조 후보
- 색은 dark는 sky 톤(P2.11 균형) 유지, **light는 slate 톤**(slate-800 / 600 / 500)으로 교체 — sky 빈 마커·UserMarker와 톤 분리되어 "경로선" 의미 또렷, 라이트 타일 위 충분한 콘트라스트
- RouteLine(detour 시 cyan `8 6`)은 미터치 — 별 개념이라 패턴이 겹쳐도 OK

## 무엇이 끝났나
- `DISTANCE_LINE_STYLE` 객체에 rank별 `dashArray` 필드 추가 (옵셔널, rank 1만 비움)
- `DistanceLine`의 하드코딩된 `dashArray: '6 6'` → `style.dashArray`로 교체
- 라이트·다크 양 테마에 동일 패턴 분기
- 1차 캡처에서 rank 3 도트가 `2 6` weight 1.5 + opacity 0.4(dark)/0.6(light)로 거의 보이지 않던 문제를 가독성 라운드로 보강 — dashArray `3 5`(도트 두께·간격 균형), weight 2, opacity 일제히 끌어올림. 위계는 패턴(solid > dash > dot)+굵기(4 > 2.5 > 2)로 충분히 유지되어 1순위가 묻히지 않음.

## 다음 것
- I.6 a11y 라운드 (aria-label·키보드 탐색·미발행 18구 빈 자치구 라벨)
- P2.18 통계바/에러 분리, P2.19 hidden feature 발견 경로
