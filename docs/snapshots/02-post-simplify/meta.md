---
index: 02
slug: post-simplify
date: 2026-04-28
phase: "Phase 1 — 리팩터·캐시·메모이제이션 적용 후 안정 상태"
git_sha: 6c3c69e (dirty, 13 변경)
viewport: 390x844
---

# 02 — 리팩터 후 안정 상태

`/simplify` 패스(divIcon 캐시·React.memo·`force-cache`·정렬 비교자 수정 등)와 스냅샷 시스템 글로벌 승격(`~/.claude/skills/snapshot/`) 직후. **시각적으론 01과 동일** — 마커 59·보라 56·파랑 3·초록 0. 이 캡처는 두 가지 기록 가치:

1. simplify 패스가 **시각 회귀 없이** 끝났다는 증거 (before=01, after=02 픽셀 비교 가능)
2. 글로벌 스킬로 처음 찍은 스냅샷 — 시스템 자체가 작동한다는 베이스라인

## 보이는 것
- 헤더: 🗑️ 중구 휴지통 지도 + PROTO 배지 (변화 없음)
- 필터 칩: 전체 / 일반 / 재활용 (변화 없음)
- 통계: 📍 59 / 전체 59개 (변화 없음)
- 지도: 보라 56 / 파랑 3 / 초록 0 (변화 없음)

## 무엇이 끝났나 (01 이후)
- `/simplify` 3-에이전트 리뷰 후 10개 픽스 적용
  - `scripts/transform.ts` 정렬 비교자 버그 수정, CSV 컬럼 상수화, 코멘트 정리, `RawBin` 타입 별칭, `mergeInto`/`idPrefix` 헬퍼
  - `BinMarker` `divIcon` 모듈 캐시 (3 인스턴스) + `React.memo`
  - `BinPopup` 주소 fallback 1줄
  - `page.tsx` `dynamic` 단순화, `clear` no-op 가드
  - `data.ts` `cache: 'force-cache'` 재추가
  - `types.ts` `styleFor` 시그니처 타이트닝
- snapshot 스킬 추상화 (프로젝트 종속 → config 기반)
- snapshot 스킬 `~/.claude/skills/snapshot/`로 글로벌 승격
- `.snapshot.config.json` 추가

## 다음 것
`docs/tasks.md` Phase 2 후보:
- P2.1 내 위치 + 가까운 휴지통 강조 (Geolocation API)
- P2.2 PWA manifest + 설치 프롬프트
- P2.4 다크 타일 (CartoDB Dark Matter 등)
- P2.5 URL 쿼리스트링으로 필터 상태 공유

이 중 다음 손댈 것 결정 필요.
