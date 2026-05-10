---
index: 48
slug: routing-reset-baseline
date: 2026-05-10
phase: "Phase 3 마무리 + P3.5/P2.26 머지 (v0.23.0)"
git_sha: 94262f0
viewport: 390x844
---

# 48 — Routing reset & GPS-anchor zoom 후 baseline

P3.5(자치구 전환 시 routing reset) + P2.26(GPS anchor zoom) 머지 직후 baseline. 두 변경 모두 사용자 인터랙션 trigger 시에만 보이는 transient/behavioral 변화라 정적 스크린샷에는 직접 드러나지 않는다 — 이 캡처는 v0.23.0 release 시점의 visual continuity를 위한 마일스톤 표식.

## 보이는 것
- 좌상단 floating 필터 row (✓ / 🗑️ / ♻️) — Liquid Glass 톤
- 우상단 floating stack: 즐겨찾기 / 직선·격자 / 헤드업 / 25구 셀렉터 (P2.24 + P3.3)
- 좌하단 ➕/➖ 줌 버튼 + GPS 위치 cycle (P2.26이 anchor 로직만 이 버튼에 추가, 외관은 동일)
- 출발/목적지 segmented 박스 (좌하단 메뉴, P2.23)
- 우하단 데이터 출처 카드 (접힘, P2.22+)
- 다크 타일 (CartoDB Dark Matter)
- 중구 폴리곤 outline (검정 halo + amber 점선, P3.4)
- 자치구 이름 라벨 "중구" 폴리곤 중앙

## 무엇이 끝났나
- **P3.5** 자치구 전환 시 routing reset — 검색·셀렉터 탭으로 다른 구로 이동 시 출발/목적지 자동 초기화 + info 토스트. 손 드래그(panning)는 유지.
- **P2.26** GPS anchor zoom — 키보드 `=`/`-` + 좌하단 ➕/➖ 버튼만 anchor 적용. 우선순위 origin+dest midpoint > origin > 기본. dest only는 무시. 휠/핀치는 Leaflet 기본 cursor anchor 유지.
- 새 `lib/zoom-anchor.ts` 순수 함수 + vitest 4 케이스 (총 109 → 185 케이스)
- 보조 도구: 글로벌 `work-status` 스킬 + 프로젝트 `trash-status` overlay + `trash-wrap-up` snapshot NN grep 함정 fix

## 다음 것
- **P4.1** 타 종류 통 합치기 (담배꽁초·의류수거함·폐의약품함, 별도 공공 데이터셋) — tasks.md 「현재 상태」가 명시한 다음 후보
- 또는 **P5.1** 실제 보행 경로 (OSRM/GraphHopper 통합)
