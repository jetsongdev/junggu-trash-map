---
index: 50
date: "2026-05-11"
phase: "Refactor + Playwright e2e baseline"
git_sha: "4ed64a8"
viewport:
  mobile: "390x844"
  desktop: "1920x1080"
files:
  - screenshot-mobile.png
  - screenshot-desktop.png
---

# 50 — 리팩터 + Playwright e2e baseline

`src/app/page.tsx`의 자치구 로드 상태 계산을 `src/lib/district-progress.ts` 순수 모듈로 분리한 뒤, 기능 변화가 없는지 확인하기 위한 기준선이다.

## 캡처

- `screenshot-mobile.png` — 390×844 모바일 첫 화면.
- `screenshot-desktop.png` — 1920×1080 데스크톱 첫 화면.

## 검증

- `file docs/snapshots/50-refactor-e2e-baseline/screenshot-mobile.png docs/snapshots/50-refactor-e2e-baseline/screenshot-desktop.png`
  - mobile: `390 x 844`
  - desktop: `1920 x 1080`

## 비고

리팩터 자체는 시각 변경을 목표로 하지 않는다. 이 snapshot은 PR 검수용 before/after 기준선으로, 주요 HUD와 지도 shell이 기존 위치에 유지되는지 확인하기 위한 기록이다.
