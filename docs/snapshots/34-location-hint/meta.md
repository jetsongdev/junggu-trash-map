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
JG-0001 남산 국립극장 정류장에 origin 셋업, 라이트 타일. 통계바·필터·타이틀·검색 박스 모두 변화 없음. 헤더는 `[PROTO]` 그대로. (overview 캡처 시점은 placeholder 시드 사용 — 현 production은 빈 시드.)

### `screenshot-popup-with-hint-light.png` ⭐ P4.3 핵심 (kakao source 스타일)
JG-0009 중림로10 가로변 popup. 첫 ship hint 9건은 모두 **Kakao Local API 0~3m 반경에서 추출한 자동 데이터**라 운영자가 손으로 단 hint와 시각적으로 구분된다:
- 📍 아이콘 prefix
- "근처:" 라벨
- 본문 (`text-neutral-600`)
- 우측 작은 회색 ` · KAKAO` 라벨 (출처 명시)

운영자가 `source: 'curated'`로 직접 단 hint는 prefix·라벨 없이 `text-neutral-700` 단일 라인으로 primary 표시되어 권위가 높아 보이도록 디자인.

### `screenshot-popup-without-hint-light.png`
hint 없는 통(JG-0002 반얀트리 호텔 앞)은 **주소가 primary 그대로**, hint 슬롯 안 깔림. 회귀 0. 빈 placeholder UI 안 만들어진 게 핵심.

### `screenshot-popup-with-hint-dark.png`
같은 JG-0009 다크 타일. popup 자체는 leaflet 기본 흰 배경이라 popup 내부 콘트라스트 변화 없음 (spec §6.3대로). 다크 타일 위에서 마커 색·주변 톤만 달라짐.

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

## 시드 데이터 — Tier 1 9건 (kakao source)

`scripts/hint-scan.ts`가 Kakao Local API로 각 통 좌표 50m 반경 5개 카테고리(관광명소·지하철·은행·주차장·편의점) POI를 거리순으로 모은 뒤, **POI 0~3m 반경에 단일 명확한 랜드마크가 잡힌 통 9개**만 첫 ship으로 채택. 모두 `source: "kakao"`로 명시되어 popup에서 자동 데이터임이 가시화된다.

```
JG-0009 중림로10 가로변              → 롯데ATM 세븐일레븐 충정로2호
JG-0019 명동역 6번출구 앞             → 이마트24 밀리오레호텔명동점
JG-0029 서소문로124 (서소문2청사)     → GS25 씨티스퀘어점
JG-0031 서소문로 125                  → 서소문한화빌딩 주차장
JG-0045 을지로입구 로얄호텔 02-156    → 하나은행365 영업부 ATM
JG-0047 을지로6가 국립중앙의료원      → GS25 동대문패션점
JG-0052 을지로입구역 1-1번출구 앞     → 제주은행 강북더존금융센터
JG-0056 세종대로124 (서울신문사)      → NH농협은행 광화문금융센터
JG-0059 황학동 롯데캐슬 02-273        → CU 청계베네치아점
```

운영자(Mr. Song) curated hint는 추후 `source: "curated"` 객체 또는 단순 string으로 추가 가능 — string은 backward compat 경로로 자동 curated 처리.

`overview-light` 캡처 1장은 P4.3 초기 dev 세션의 placeholder 시드(`JG-0001/0003/0005`)로 잡힌 통계바 그대로지만 production 동작에 영향 없음 — popup 캡처 2장이 실제 ship 데이터·스타일 반영.

## 관련 문서

- 설계: `docs/superpowers/specs/2026-05-08-p4-3-location-hint-design.md`
- 구현 계획: `docs/superpowers/plans/2026-05-08-p4-3-location-hint.md`
