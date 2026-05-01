---
index: 02
slug: post-simplify
date: 2026-05-01
phase: "Phase 1 — 리팩터·캐시·메모이제이션 적용 (재활용 필터 적용 상태)"
git_sha: 10ac013
viewport: 390x844
state: "재활용 필터 활성"
---

# 02 — 리팩터 후 안정 상태 (재활용 필터)

`/simplify` 패스(divIcon 캐시·React.memo·`force-cache`·정렬 비교자 수정 등) + 스냅샷 시스템 글로벌 승격 + CHANGELOG 도입 직후. 01과 다른 시각 컨텍스트로 캡처하기 위해 **"재활용" 필터 토글한 상태**를 잡음 — 같은 코드, 다른 화면.

## 보이는 것
- 재활용 칩 active 상태 (초록 `#10b981`)
- 통계: `📍 56 / 전체 59개` (일반-only 3곳 빠짐)
- 마커 56 모두 보라(혼합) — 이 데이터셋에서 재활용 단독 케이스 0
- 헤더·레이아웃·타일은 01과 동일

## 무엇이 끝났나 (01 이후)
- `/simplify` 3-에이전트 리뷰 후 10개 픽스 적용 (정렬 비교자 버그, divIcon 캐시 + memo, 코멘트 정리, RawBin 타입, 주소 fallback, dynamic 단순화, force-cache 재추가, styleFor 타이트닝)
- snapshot 스킬 추상화 + `~/.claude/skills/snapshot/`로 글로벌 승격
- `.snapshot.config.json` (프로젝트별 오버라이드)
- CHANGELOG.md 도입 (Keep a Changelog) + CLAUDE.md 운영 규칙
- foundation commit `10ac013`

## 다음 것
`docs/tasks.md` Phase 2 후보 중 P2.1(Geolocation: 내 위치 + 가까운 휴지통 강조)이 추천. 그 외 P2.2(PWA), P2.4(다크 타일), P2.5(URL 필터 상태).
