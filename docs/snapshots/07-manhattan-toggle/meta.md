---
index: 07
slug: manhattan-toggle
date: 2026-05-02
phase: "Phase 2.6 — Manhattan 거리 토글 UI"
git_sha: a877b7b
viewport: 390x844
state: "내 위치 활성, 격자 모드(Manhattan), 명동성당 좌표(37.5634, 126.9870), 154m"
---

# 07 — Manhattan 거리 토글 (📏 직선 ↔ 📐 격자)

P2.1에서 만든 lib(`pathPositions(mode)`)에 **UI 토글**만 1개 추가. Codex에 위임 — `src/app/page.tsx` 한 파일에서 setter 활성화 + amber 칩 1개 + localStorage 영속화.

## 보이는 것
- **새 칩 "📐 격자"** (amber-500 active 색)
- 거리 선이 직선 1점 → **L자 2점** (`pathPositions` mode 분기 자동 적용)
- 통계 라벨: 같은 명동성당 좌표에서 직선 121m → **격자 154m** (보행자 거리 근사)
- `localStorage['distanceMode'] = 'manhattan'` 저장 — 다음 방문 시 그대로 복원

## 03(직선)과 비교

| 모드 | 거리 | 시각 |
|------|------|------|
| 직선 (03) | 121m | 사용자 점 → 강조 ring 직선 1선 |
| 격자 (07) | 154m | 사용자 점 → ↑ → 강조 ring (L자) |

같은 좌표 같은 마커. 모드만 바꿈.

## 무엇이 끝났나
- `page.tsx` setter 활성화 + lazy init (`localStorage.getItem('distanceMode')`)
- `useEffect` for persistence (`setItem` on change)
- amber 칩 — `aria-pressed`, `min-h-[44px] rounded-full`, 라벨 `📏 직선` ↔ `📐 격자`
- `setDistanceMode((prev) => prev === 'euclidean' ? 'manhattan' : 'euclidean')` 토글 핸들러

## Codex 위임 결과 (검증)
- TypeScript strict 통과 (`tsc --noEmit` exit 0)
- 로컬 `bun run build` 통과 (Codex sandbox에서는 sandbox 제약으로 빌드 못 함, 코드는 정상)
- Manhattan 토글 시 polyline `d` 속성 변경 확인 (2점 → 3점)
- localStorage 영속화 검증

## 다음 것
P2.4 다크 타일, P2.2 PWA, P2.5 URL 필터 상태. P2.3 클러스터링은 25구 확장 시.
