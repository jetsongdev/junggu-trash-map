# `leaflet-rotate`는 marker를 이미 직립 유지 — counter-rotate 직접 걸지 말 것

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: P2.13b head-up 모드, Codex review-gate가 잡은 버그

## 문제

지도를 회전시키는 head-up 모드에서 마커들이 같이 회전하면 글자/아이콘이 거꾸로 뒤집혀 못 알아본다고 생각해서, "지도는 회전하지만 마커는 직립" 패턴을 직접 구현했다.

```typescript
// Map.tsx — 컨테이너 div에 CSS 변수로 counter rotation 노출
const counterRotate = `${-(mapBearing ?? 0)}deg`;
return (
  <div
    className={mapBearing != null ? 'map-rotated' : ''}
    style={{ ['--map-counter-rotate' as string]: counterRotate }}
  >
    <MapContainer ...>
```

```css
/* globals.css — 모든 마커 inner span에 counter-rotation */
.map-rotated .user-marker-inner,
.map-rotated .bin-marker > span,
.map-rotated .dest-flag {
  transform: rotate(var(--map-counter-rotate, 0deg));
  transform-origin: center;
  transition: transform 150ms ease-out;
}
```

데스크톱 Playwright 테스트로 head-up 모드 진입 후 `alpha=270` 발사 → 지도가 90° 회전, 마커는 직립 보임. 시각 확인 OK.

테스트 통과 + 빌드 통과 + 자체 시각 검증까지 완료. 푸시.

## Codex review-gate가 잡은 진실

세션 종료 시 Codex 리뷰 게이트가 BLOCK:

> Head-up mode double-rotates markers, so the shipped behavior is incorrect.

플러그인 번들 소스를 다시 읽어봤다. `_initPanes` 메서드 패치:

```javascript
this._rotate ? (
  this._rotatePane = this.createPane("rotatePane", this._mapPane),
  this._norotatePane = this.createPane("norotatePane", this._mapPane),
  this.createPane("tilePane",     this._rotatePane),     // ← 회전 O
  this.createPane("overlayPane",  this._rotatePane),     // ← 회전 O
  this.createPane("shadowPane",   this._norotatePane),   // ← 회전 X
  this.createPane("markerPane",   this._norotatePane),   // ← 회전 X
  this.createPane("tooltipPane",  this._norotatePane),
  this.createPane("popupPane",    this._norotatePane)
) : ...
```

플러그인은 회전 가능 모드에서 **markerPane을 별도의 `_norotatePane` 안에 두어 마커가 지도 회전과 무관하게 직립을 유지**시킨다. `_setPos`도 `rotation = 0`으로 호출.

내가 추가한 CSS는 그 위에 추가 회전을 또 걸어버린 셈. bearing이 -90°일 때 counter-rotate는 +90°. 플러그인이 0°로 유지하는 마커에 +90° 더하면 **결국 90° 회전된 채로 표시**.

데스크톱 테스트에서 못 잡은 이유:
- bin 마커 emoji가 작아서(32px 이하) 90° 회전이 한눈에 안 띔
- 사용자 위치 dot은 원형이라 회전해도 시각 동일
- 강조 ring(CircleMarker, SVG in overlayPane)은 회전 O지만 원이라 시각 무차별
- conic-gradient cone은 head-up 모드에서 안 그림 (의도한 동작)

즉 화면에서 회전이 적용된 게 분명한 큰 시각 단서가 없어 자가검증으로 못 잡았다.

## 해결

CSS 규칙과 wrapper의 CSS 변수를 모두 제거하고 플러그인 기본 동작에 위임:

```diff
- const counterRotate = `${-(mapBearing ?? 0)}deg`;
  return (
    <div
-     className={[..., mapBearing != null ? 'map-rotated' : ''].filter(Boolean).join(' ') || undefined}
-     style={{ height: '100%', width: '100%', ['--map-counter-rotate' as string]: counterRotate }}
+     className={[...].filter(Boolean).join(' ') || undefined}
+     style={{ height: '100%', width: '100%' }}
    >
```

```diff
-.map-rotated .user-marker-inner,
-.map-rotated .bin-marker > span,
-.map-rotated .dest-flag {
-  transform: rotate(var(--map-counter-rotate, 0deg));
-  transform-origin: center;
-  transition: transform 150ms ease-out;
-}
```

수정 후 head-up 모드 재검증. 작은 bin emoji들도 동일 비교 시 직립 (이전에 미세하게 90° 기울어졌던 것이 정상 직립으로 복원).

## 교훈

### 1. 플러그인이 어디까지 해주는지 먼저 읽어라

`leaflet-rotate`가 markerPane 분리하는 건 README에 명시 X (플러그인 데모만 봤음). 소스 코드(`_initPanes`)나 minified bundle 직접 grep으로 확인하는 게 더 정확.

남이 푸는 문제 위에 같은 문제를 또 풀면 정확히 그 양만큼 어긋난다.

### 2. 시각 검증 한계 — 작은 시각 차이는 자가검증으로 안 잡힘

- bin emoji 32px → 90° 회전해도 ✅를 ✅로 인식. 큰 회전 단서 없음
- 화면에서 "회전이 적용된 게 명백한" 시각 요소가 있어야 검증됨 (예: 일직선 화살표, 텍스트 라벨)
- 의문이 들면 일부러 90° 텍스트 마커 하나 띄워보거나 디버그 라인 그려서 검증

### 3. Adversarial review의 가치 — Codex stop-gate가 결정적이었음

내 시각 검증과 테스트가 모두 통과한 상태에서 푸시까지 마쳤다. Codex의 stop-time review만이:
- 코드 diff를 다시 읽고
- 플러그인 동작을 따로 확인하고
- "double-rotation"이라는 결론을 내림

```
task-mor9q1ej-070jm7 | rescue | done | 1m 20s
BLOCK: Head-up mode double-rotates markers, so the shipped behavior is incorrect.
```

수정 후 재 review:
```
task-mor9vmyy-uwa0qn | rescue | done | 52s
ALLOW: 067b8d9 verified — only removes duplicated counter-rotation
```

자기 코드를 자기가 리뷰하면 같은 사각지대를 다시 못 본다. 다른 모델/다른 컨텍스트의 리뷰를 통과해야 진짜 끝.

## 김동현 원펀치

회전 플러그인 쓸 땐 markerPane을 어디 매다는지부터 확인. 거기까지 처리해주면 너는 손대지 마라. 플러그인 위에 같은 보정을 또 걸면 정확히 두 배 회전된다.
