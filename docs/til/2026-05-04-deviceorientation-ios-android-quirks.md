# `deviceorientation` — iOS/Android 헤딩 계산 차이 + iOS 권한 prompt

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: P2.13 방향 화살표 (cone)

## 문제

휴대폰 나침반 방향을 받아 사용자 마커에 부채꼴(cone)을 회전시키려는데, 플랫폼별 함정이 여러 개 있어 한 번에 제대로 짜야 했다.

## iOS — `webkitCompassHeading` + 권한 prompt

iOS 13+는 보안 정책으로 **사용자 제스처 발생 후에 명시적 권한 요청**이 필요하다:

```typescript
const DOE = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

// 버튼 클릭 핸들러 안에서만 호출 가능 (사용자 제스처 컨텍스트)
if (typeof DOE.requestPermission === 'function') {
  const result = await DOE.requestPermission();  // 권한 prompt 표시
  if (result !== 'granted') return;
}
```

`window.addEventListener('deviceorientation', ...)`만 걸어두고 prompt 안 띄우면 iOS에서는 **이벤트가 영원히 발화하지 않는다** — silent fail. 실제 디바이스 없이는 디버깅 어려움.

iOS의 헤딩 값은 `event.webkitCompassHeading` (Apple 비표준 확장):
- 0 = North, **시계방향으로 증가** (90 = East, 180 = South, 270 = West)
- 이미 디바이스 방위(true heading)로 캘리브레이션됨 — 그대로 사용

## Android — `alpha` + 좌표계 반전

Android Chrome은 권한 prompt 없이 https에서 자동 작동. 헤딩은 표준 `event.alpha`:
- 0 = 디바이스 시작 시점의 z-axis 기준
- **반시계방향(counter-clockwise)으로 증가** ← 함정
- `absolute: true` 또는 `deviceorientationabsolute` 이벤트면 0=North 보장

좌표계 반대 방향이라 변환 필요:

```typescript
function readHeading(e: DeviceOrientationEvent & { webkitCompassHeading?: number }) {
  if (typeof e.webkitCompassHeading === 'number') {
    return e.webkitCompassHeading;        // iOS: 그대로
  }
  if (e.alpha == null) return null;
  return (360 - e.alpha) % 360;            // Android: 반전
}
```

## 둘 다 받기 — 두 이벤트 모두 listen

```typescript
window.addEventListener('deviceorientationabsolute', handler);  // Android 절대값 우선
window.addEventListener('deviceorientation', handler);          // iOS / fallback
```

iOS는 `deviceorientationabsolute`를 fire하지 않지만 `deviceorientation`의 `webkitCompassHeading`이 이미 절대값. Android는 `absolute` 변형이 더 정확하지만 fallback도 `alpha`로 잡힘.

## Throttle — 흔들림 완화

폰 헤딩은 ±5° 떨림이 흔하다. cone이 같은 속도로 떨면 어지럽다. hook 쪽에서 150ms throttle:

```typescript
const lastUpdateRef = useRef(0);
const handler = (e: Event) => {
  const h = readHeading(e as OrientationLike);
  if (h == null || !Number.isFinite(h)) return;
  const now = Date.now();
  if (now - lastUpdateRef.current < 150) return;
  lastUpdateRef.current = now;
  setHeading(h);
};
```

CSS에도 transition으로 보간:

```css
.user-cone {
  transform-origin: center;
  transition: transform 120ms ease-out;
}
```

이 두 개 합치면 사람이 부드럽다고 느끼는 5–7 Hz 정도 업데이트.

## Disabled 시 cleanup

`enabled === false`로 바뀌면 listener 해제하고 heading state도 null로:

```typescript
useEffect(() => {
  if (!enabled || permission !== 'granted') {
    setHeading(null);
    return;
  }
  window.addEventListener('deviceorientation', handler);
  return () => window.removeEventListener('deviceorientation', handler);
}, [enabled, permission]);
```

setHeading(null)을 안 하면 사용자가 토글 OFF한 뒤에도 마지막 cone 각도가 화면에 박혀 있다.

## 데스크톱 검증

데스크톱 Chrome은 `deviceorientation` 이벤트가 실제로 안 fire된다. Playwright/console에서 강제 발사로 동작 확인:

```javascript
window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {
  alpha: 270,    // Android식: 반시계 270 → 시계 90 → East
  beta: 0,
  gamma: 0,
  absolute: true,
}));
```

이벤트 dispatch 후 cone이 동쪽(오른쪽)을 가리키면 변환 로직 OK.

## 교훈

`deviceorientation` API는 표준이라기보다 **iOS/Android 두 방언의 합집합**이다. 한 코드 패스에서 둘 다 받으려면:

1. iOS 권한 요청은 사용자 제스처 안에서 await
2. `webkitCompassHeading`이 있으면 그걸 우선 (이미 calibrated)
3. 없으면 `alpha`를 `(360 - alpha) % 360`로 변환
4. Throttle 100~200ms + CSS transition으로 떨림 흡수
5. 사용자가 끄면 listener 해제 + heading null 리셋

같은 이중 표준 함정: Geolocation API의 `coords.heading` (mobile only, 정지 시 null), `screen.orientation` (iOS Safari 11+에서야 표준화).

## 김동현 원펀치

iOS는 권한 + `webkitCompassHeading`, Android는 `(360 - alpha)`. 두 줄로 갈라서 처리하고 throttle 150ms.
