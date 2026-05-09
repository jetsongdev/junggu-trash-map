---
index: 41
slug: district-outline
date: 2026-05-09
phase: "P3.4"
git_sha: b56efbaa3b
viewport: 390x844
---

# 41 — 자치구 폴리곤 outline

P3.3 셀렉터에서 amber ring으로만 표시되던 "현재 viewing district"를 지도 위에도 영구 outline으로 띄움. 셀렉터를 닫아 둔 상태에서도 어느 구를 보고 있는지 한눈에 알 수 있고, 패닝으로 다른 구에 진입하면 outline이 자연스럽게 따라가 panning auto-add(P3.2)와 시각적으로 같은 신호를 준다.

## 보이는 것
- 두 겹 stack outline: 굵은 halo(weight 4, opacity 0.55~0.85) + 얇은 dashed inner(weight 1.5, opacity 0.95). 다크 = 검정 halo + amber-400 inner / 라이트 = 흰 halo + slate-800 inner
- TileLayer 직후 첫 레이어로 깔려 마커·distance line·route 모두 outline 위에 살아있음
- 우상단 HUD에 `📍 중구` 작은 배지 상시 표시 — 셀렉터 닫혀있어도 어느 구를 보고 있는지 한눈에. 색상 톤은 outline의 amber·slate와 같은 의미(`내가 보는 구`)로 묶임
- `screenshot-light.png` — 라이트 OSM 타일. 흰 halo로 도로·녹지 위에서도 outline이 살아남음
- `screenshot-dark.png` — CartoDB Dark Matter 타일. 검정 halo가 amber inner를 더 도드라지게 함
- `screenshot-selector-open.png` — 셀렉터 panel 열린 상태에서 grid의 amber ring + 지도의 outline + HUD 라벨 모두 동시 등장

## 무엇이 끝났나
- 새 컴포넌트 `src/components/DistrictOutline.tsx`: react-leaflet `<GeoJSON>` 두 겹 stack(halo + inner), 한 feature만 필터링, `key={code}-{halo|inner}-{tileTheme}`로 코드/테마 변경 시 강제 remount
- `Map.tsx`: `viewingDistrict` / `districtsGeo` props 2개 추가, TileLayer 직후 outline 렌더
- `page.tsx`: 기존 state 그대로 패스 + 우상단 HUD 라벨 한 줄 (`findDistrictMeta(manifest, viewingDistrict).name` 표시, `viewingDistrict` null 가드)
- 라이트 1차 amber-700 단일 stroke 가독성 부족 발견 → halo+inner stack으로 라운드 1 회수
- `bun run build` / `bun run test` 모두 통과 (157 tests)

## 다음 것
- `docs/tasks.md`의 P3.3-fix1 (empty-toast 스냅샷 재캡처), I.6 (a11y 라운드), P4.1 (타 종류 통)
