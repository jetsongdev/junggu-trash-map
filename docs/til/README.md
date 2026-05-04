# 📚 TIL — 시행착오 기록

작업 중 마주친 비명시적 함정과 해결 패턴. 코드만 봐서는 안 보이는 "왜 이렇게 짰는지"의 이유를 한 사건당 한 파일로 보존한다.

## 인덱스

| 일자 | 주제 | 핵심 |
|------|------|------|
| 2026-05-02 | [react-leaflet MapContainer props static](../../../../workspace-memo/til/2026-05-02-react-leaflet-mapcontainer-props-static.md) | 외부에 있음 — 동적 props는 wrapper div 또는 useMap 훅으로 |
| 2026-05-04 | [Leaflet divIcon CSS transform:scale](./2026-05-04-leaflet-divicon-css-transform-scale.md) | `transform:scale()`은 레이아웃 변형 X — width/height 직접 계산 |
| 2026-05-04 | [Top-3 가독성 dim non-candidates](./2026-05-04-top3-readability-dim-non-candidates.md) | 후보를 키우지 말고 비후보를 죽여라 |
| 2026-05-04 | [deviceorientation iOS/Android quirks](./2026-05-04-deviceorientation-ios-android-quirks.md) | iOS는 권한 + webkitCompassHeading, Android는 alpha 반전 |
| 2026-05-04 | [deviceorientation heading jitter](./2026-05-04-deviceorientation-heading-jitter.md) | 4겹 디펜스 — 이벤트 소스 content filter / 화면 회전 / throttle / EMA wrap-around |
| 2026-05-04 | [GitHub Actions first workflow bootstrap](./2026-05-04-github-actions-first-workflow-bootstrap.md) | `pull_request: branches:`는 base 필터, 워크플로우는 main에 있어야 트리거됨 — workflow_dispatch escape hatch |
| 2026-05-04 | [Lighthouse CI config traps](./2026-05-04-lighthouse-ci-config-traps.md) | preset: mobile은 무효 값, PWA 카테고리 LH12에서 제거, 임계치는 측정값에서 ratchet up |
| 2026-05-04 | [leaflet-rotate window.L bootstrap](./2026-05-04-leaflet-rotate-window-l-bootstrap.md) | UMD 글로벌 의존 — window.L 셋업 모듈 분리해 먼저 import |
| 2026-05-04 | [leaflet-rotate marker double-rotation](./2026-05-04-leaflet-rotate-marker-double-rotation.md) | 플러그인이 markerPane 직립 처리 — counter-rotate 직접 걸지 말 것 |

## 작성 컨벤션

- 파일명: `YYYY-MM-DD-slug.md` (kebab-case, 영문)
- 한 파일 = 한 함정/사건. 두 개 섞지 말 것
- 구조: `# 제목` → frontmatter (`**일자**`, `**프로젝트**`, `**관련 작업/PR/스냅샷**`) → `## 문제` → `## 진단` → `## 해결` → `## 교훈` → 마지막에 `## 김동현 원펀치` (한 줄 요약)
- 코드 스니펫은 실제 PR/커밋 기준으로 정확하게. 패치 형태(`diff`)도 OK
- 네거티브 패턴(✗)과 포지티브 패턴(✓) 같이 보여주면 좋음

## 다른 프로젝트의 일반 TIL

이 프로젝트 무관한 일반 TIL은 `~/Documents/workspace-memo/til/`에 누적. 같은 함정이 여러 프로젝트에 걸쳐 반복되면 그쪽으로 옮긴다.
