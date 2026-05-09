---
index: 41
slug: district-outline
date: 2026-05-09
phase: "P3.4"
git_sha: 8a5cc71cd7 (dirty)
viewport: 390x844
---

# 41 — 자치구 폴리곤 outline

P3.3 셀렉터에서 amber ring으로만 표시되던 "현재 viewing district"를 지도 위에도 영구 outline으로 띄움. 셀렉터를 닫아 둔 상태에서도 어느 구를 보고 있는지 한눈에 알 수 있고, 패닝으로 다른 구에 진입하면 outline이 자연스럽게 따라가 panning auto-add(P3.2)와 시각적으로 같은 신호를 준다.

## 보이는 것
- amber dashed outline (`#fbbf24` 다크 / `#b45309` 라이트, 1.5px, dashArray `6 4`, opacity 0.7) — fill 없음
- TileLayer 직후 첫 레이어로 깔려 마커·distance line·route 모두 outline 위에 살아있음
- 셀렉터 grid의 amber ring과 outline 색이 같아 두 표현이 한 의미("내가 보는 구")로 묶임
- `screenshot-light.png` — 라이트 OSM 타일에서 amber-700 outline. 도로·거리선과 충돌 없음
- `screenshot-dark.png` — CartoDB Dark Matter 타일에서 amber-400 outline. 더 도드라짐
- `screenshot-selector-open.png` — 셀렉터 panel 열린 상태에서 grid의 ring + 지도의 outline 동시 등장

## 무엇이 끝났나
- 새 컴포넌트 `src/components/DistrictOutline.tsx` (~25줄): react-leaflet `<GeoJSON>`을 한 feature만 필터링해 래핑, `key={code}`로 코드 변경 시 강제 remount
- `Map.tsx`: `viewingDistrict` / `districtsGeo` props 2개 추가, TileLayer 직후 outline 렌더
- `page.tsx`: 기존 `viewingDistrict` state + `districtsGeo` 그대로 패스 (2줄)
- `bun run build` / `bun run test` 모두 통과 (157 tests)

## 다음 것
- `docs/tasks.md`의 P3.3-fix1 (empty-toast 스냅샷 재캡처), I.6 (a11y 라운드), P4.1 (타 종류 통)
