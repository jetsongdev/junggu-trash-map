---
index: 33
slug: topn-deep-blue-final
date: 2026-05-07
phase: "P2.20 마무리 — Top-N 거리선 최종 색·패턴 (light deep blue + RouteLine 실선)"
git_sha: 0d2955a2c0995b00d9063fad3c08ad7fb9c2968c (dirty)
viewport: 390x844
---

# 33 — Top-N 거리선 P2.20 최종 (light deep blue + RouteLine 실선화)

스냅샷 31에서 시작한 P2.20 패턴 분리가 색·콘트라스트·destination 모드 회귀까지 다 잡힌 최종 상태. 여러 라운드의 시각 검수·Codex 리뷰를 거쳐 정착.

## 진화 경로
1. **31**: rank 1 실선 / 2 dash / 3 dot 패턴 첫 분리 (sky 톤, light 옅음 문제)
2. **31 → 32**: rank 2/3 opacity·weight 보강 → 라이트 slate-700/500/400 → slate-800/600/500 darken
3. **32 → 33**: slate가 차분해도 거리선 의미가 약함 → fuchsia 실험 → **deep blue 정착** (light blue-800 단일 톤 + 굵기·패턴으로 위계) + RouteLine을 rank 1과 톤 동기화 → Codex 리뷰 P2 반영해 RouteLine 실선화로 candidate dash 패턴과 충돌 해소

## 보이는 것 (최종)

**Light**:
- rank 1 (no destination): blue-800 `#1e40af` 실선 weight 4 opacity 0.9
- rank 2: blue-800 `#1e40af` dash `8 6` weight 3 opacity 0.85
- rank 3: blue-800 `#1e40af` dot `3 5` weight 2.5 opacity 0.85
- **RouteLine** (destination 모드): blue-800 `#1e40af` 실선 weight 4 opacity 0.9 (rank 1 슬롯 이어받음)

**Dark** (P2.11 sky 베이스 유지):
- rank 1: sky-500 `#0ea5e9` 실선 weight 4 opacity 0.85
- rank 2: sky-300 `#7dd3fc` dash `8 6` weight 2.5 opacity 0.75
- rank 3: sky-200 `#bae6fd` dot `3 5` weight 2 opacity 0.7
- **RouteLine** (destination 모드): sky-500 `#0ea5e9` 실선

## 캡처 3장
- `screenshot-light.png` — light, no destination, Top-3 거리선 패턴 분리
- `screenshot-dark.png` — dark, no destination
- `screenshot-light-destination.png` — light, destination 설정 → RouteLine(solid) + candidate(dash/dot) 시각 분리

## 무엇이 끝났나
- light 거리선 색상 deep blue로 정착 (sky 마커류와 hue 분리, "경로선" 의미 즉시)
- 색 통일(blue-800) + 굵기·패턴 차이로 위계 유지 → 색맹 친화 보강
- RouteLine theme-aware (rank 1 색 따라감) + 실선 → destination 모드도 deep blue 일관, 그러나 candidate(dash/dot)와 패턴 분리

## 다음 것
- I.6 a11y 라운드 (aria-label·키보드 탐색·미발행 18구 빈 자치구 라벨)
- P2.18 통계바/에러 분리, P2.19 hidden feature 발견 경로
- GitHub Actions 빌링 풀리면 PR #29 Lighthouse 게이트 → 머지
