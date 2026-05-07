---
index: 34
slug: location-hint
date: 2026-05-08
phase: "P4.3 위치 힌트 — 운영자 큐레이션 한 줄 텍스트가 popup에서 주소 위 primary로"
git_sha: 3ac19e6
viewport: 390x844
---

# 34 — P4.3 위치 힌트 텍스트 (사진 원안 폐기)

P4.3은 본래 "휴지통 사진 1장"이었으나, 사진 경로 3종(수동 발품 / 사용자 제보 / Street View 자동) 모두 골목 안쪽 케이스에 트레이드오프 폭주 → **운영자가 데스크에서 카카오·Naver 보면서 손으로 단 한 줄 위치 힌트 텍스트**로 재정의. 발품 0, 즉시 가치 발생.

## 데이터 흐름

- 별도 파일: `public/data/hints/<district>.json` (`{ version, hints: { binId: text } }`)
- 자치구별 lazy fetch — `lib/hints.ts`의 `fetchHints` (404·네트워크 에러는 EMPTY fallback)
- `mergeHints(bins, hints)` 순수 immutable 머지 → `TrashBin.locationHint?: string` 런타임 주입
- `transform.ts`는 이 필드를 읽지도 쓰지도 않음 → 데이터 갱신 시 hint 안 사라짐

## 보이는 것

### `screenshot-overview-light.png`
중구 시드 위치(JG-0001 남산 국립극장 정류장)에 origin 셋업, 라이트 타일. 통계바·필터·타이틀·검색 박스 모두 변화 없음. 헤더는 `[PROTO]` 그대로.

### `screenshot-popup-with-hint-light.png` ⭐ P4.3 핵심
JG-0001 popup 오픈. **힌트 "반얀트리 호텔 셔틀 정차 지점 옆, 산 방향 보도"가 주소 위에 primary (text-neutral-700, sm)** 로 뜸. 그 아래 도로명 주소가 secondary (text-neutral-500, xs)로 후퇴. detail("버스정류장")·관리자 정보는 변화 없음.

### `screenshot-popup-without-hint-light.png`
바로 옆 통(JG-0002 반얀트리 호텔 앞)은 hint 없음 → **주소가 primary 그대로**, hint 슬롯 안 깔림. 회귀 0. 빈 placeholder UI 안 만들어진 게 핵심.

### `screenshot-popup-with-hint-dark.png`
JG-0001 popup 다크 타일. popup 자체는 leaflet 기본 흰 배경이라 변화 없음 (spec §6.3대로). 다크 타일 위에서 hint·주소 콘트라스트 OK.

## 분업 흐름 (설계 의도)

| 단계 | 단위 | 파일 |
|---|---|---|
| A | 타입 + lib/hints + 테스트 | `types.ts` (1줄) · `hints.ts` 신규 · `hints.test.ts` 신규 (8 케이스) |
| B | BinPopup 변경 | `BinPopup.tsx` 주소 블록 conditional 분기 |
| C | 시드 데이터 | `public/data/hints/junggu.json` 3건 placeholder |
| D | page.tsx 통합 | 3 fetch site 모두 `Promise.all([fetchDistrict, fetchHints]) + mergeHints` |
| E | 시각 검증 + 문서 | snapshot 34 · tasks.md · CHANGELOG |

A·B·C는 서로 다른 파일이라 완전 병렬. 본 PR에선 인라인 순차 실행했지만 미래 유사 패턴(사용자 제보 P4.2·기타 메타 데이터 큐레이션)에 그대로 재사용 가능.

## 수용한 위험

`scripts/transform.ts`의 id 발번이 lat/lng 정렬 후 순차 인덱스(`<prefix>-<NNNN>`)라 새 통이 중간에 끼면 뒷 통 id가 한 칸씩 밀려 **hint orphan** 발생. 공공 데이터 갱신은 연 1회 빈도이고 hint 볼륨 작아 수동 재키잉 OK. hint 50+ 또는 자동 transform CI 시 stable id 리팩터로 hardening 예정.

## 시드 데이터 — ship 시점 비어 있음

이 snapshot 4장은 dev 세션에서 일회성 placeholder 시드 3건(JG-0001/0003/0005)을 임시로 채운 상태로 캡처한 시각 검증 기록이다. **production으로 ship되는 `public/data/hints/junggu.json`은 `hints: {}` 빈 객체** — 검증되지 않은 placeholder를 사용자에게 노출하는 위험을 차단하기 위함(advisor 리뷰 반영). 운영자가 카카오·Naver로 골목 안쪽 통을 직접 확인한 뒤 별도 commit으로 진짜 큐레이션 hint를 추가한다.

캡처 시점 사용된 placeholder (참고):

```
JG-0001 → 반얀트리 호텔 셔틀 정차 지점 옆, 산 방향 보도
JG-0003 → 약수역 7번 출구 나와서 다산로 보도, 주민센터 입구 옆
JG-0005 → 손기정체육공원 입구 정류장 — 새마을금고 간판 바로 아래
```

## 관련 문서

- 설계: `docs/superpowers/specs/2026-05-08-p4-3-location-hint-design.md`
- 구현 계획: `docs/superpowers/plans/2026-05-08-p4-3-location-hint.md`
