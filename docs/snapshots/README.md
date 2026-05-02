# 📸 Snapshots

앱이 시간에 따라 어떻게 진화했는지 시각 기록. 큰 단위 작업(Phase, 주요 기능 추가, UX 개편)이 끝날 때마다 한 장씩 누적.

## 인덱스

| # | 날짜 | 제목 | 폴더 |
|---|------|------|------|
| 01 | 2026-04-28 | 실데이터 통합 직후 (Phase 0+1) | [01-real-data-integration](./01-real-data-integration/) |
| 02 | 2026-05-01 | 리팩터 후 + 재활용 필터 적용 상태 (56/59) | [02-post-simplify](./02-post-simplify/) |
| 03 | 2026-05-01 | 내 위치 + 가까운 휴지통 강조 (P2.1) | [03-geolocation](./03-geolocation/) |
| 04 | 2026-05-02 | 필터 + 위치 결합 (재활용+중림로10, 88m 점프) | [04-locate-with-filter](./04-locate-with-filter/) |
| 05 | 2026-05-02 | 실시간 추적 + 거리 선 (시청/명동/DDP 3프레임) | [05-realtime-tracking](./05-realtime-tracking/) |
| 06 | 2026-05-02 | 🎯 지도 탭으로 위치 지정 (iPad/GPS 거부 우회) | [06-tap-to-locate](./06-tap-to-locate/) |
| 07 | 2026-05-02 | 📐 Manhattan 거리 토글 (L자 격자, 154m vs 직선 121m) | [07-manhattan-toggle](./07-manhattan-toggle/) |
| 08 | 2026-05-02 | 🌑 CartoDB Dark Matter 타일 (다크 헤더와 통일) | [08-dark-tiles](./08-dark-tiles/) |
| 09 | 2026-05-02 | 🎨 다크 테마 가독성 — 비활성 칩·줌·어트리뷰션 다크 통일 | [09-dark-theme-polish](./09-dark-theme-polish/) |
| 10 | 2026-05-02 | 🌑/☀️ 라이트/다크 타일 토글 (2프레임 비교) | [10-tile-theme-toggle](./10-tile-theme-toggle/) |
| 11 | 2026-05-02 | 📲 PWA manifest + 아이콘 (홈 화면 추가 가능) | [11-pwa-manifest](./11-pwa-manifest/) |

## 새 스냅샷 찍는 법

`/snapshot` 슬래시 커맨드 실행 → `.claude/skills/snapshot/SKILL.md` 절차에 따라 자동 캡처.

수동으로:
1. `bun run dev`로 서버 띄우고 마커 렌더 확인
2. Playwright MCP로 viewport 390×844, http://localhost:3000 (또는 폴백 포트) 진입
3. `bun run dev` 콘솔에서 마커 카운트 확인 후 스크린샷 → `docs/snapshots/{NN}-{slug}/screenshot.png`
4. `meta.md` 작성 (index, date, phase, 보이는 것, 끝난 것, 다음 것)
5. 이 파일의 인덱스 표에 한 줄 추가

## 컨벤션
- 폴더: `NN-slug` (zero-padded NN, kebab-case slug)
- 사이즈: 390×844 (모바일 우선)
- 형식: PNG (selectable text/사진보다 화질 우선)
- meta.md: YAML frontmatter + 마크다운 본문
- 한 폴더 ≤ 1 스크린샷 + 1 메타. 더 필요하면 새 폴더.
