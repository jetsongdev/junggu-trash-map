---
name: url-share
title: "🔗 URL 쿼리스트링 공유 + 딥링크"
index: 17
date: 2026-05-03
phase: P2.5
git_sha: 89a8b6614cda09d573a8b0e2c1a25c0bdf7ba2c5
viewport: 390x844
---

## 이 시점에 보이는 것

- 칩 행 맨 끝에 **🔗 공유** 버튼 추가
- 보행 속도·라이트 테마 칩과 나란히 배치

## 끝난 것

- P2.5: URL 쿼리스트링 공유 — `types/theme/mode/speed/origin/dest` 6개 파라미터
- `src/lib/url-share.ts` — `parseUrlParams` / `buildShareUrl` 순수 함수, 영문 alias 양방향 매핑, 좌표 범위 검증
- `src/components/ShareButton.tsx` — `navigator.share` 우선 → clipboard → `window.prompt` 폴백, 복사됨 1.5초 피드백
- URL 우선 → localStorage 폴백 우선순위: `prefsHydratedRef` 가드 패턴 안에서 URL 키 존재 여부 확인

## 다음 것

- preview 검수 (feat/p2.5-url-share 브랜치 Vercel 알리아스)
- 이상 없으면 main 머지
- P2.9, P2.10, P2.13, P2.14 등 잔여 Phase 2 태스크
