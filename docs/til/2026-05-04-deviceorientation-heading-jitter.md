# `deviceorientation` heading 튐 — 4개 원인이 한꺼번에 작동, 한 번에 다 잡아야 한다

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: P2.13b 헤드업 모드 (지도 회전), Codex stop-gate review

## 문제

갤럭시 + Whale 브라우저에서 head-up 모드 사용 시 다음 증상이 동시에 발생:

1. **반응 속도 느림** — 폰을 돌려도 지도가 한 박자 늦게 따라옴
2. **갑자기 90° 점프** — 가만히 있다가도 화면 전환되듯 휙 돌아감
3. **세로 상태로 가만히 있어도 떨림** — 1~2°가 아니라 눈에 띄는 불안정한 흔들림

각 증상은 다른 원인을 가지고 있어서 **한 번에 다 잡아야** 사용 가능한 수준이 된다.

## 원인 1 — Throttle 너무 큼 (반응 느림)

처음엔 `THROTTLE_MS = 150`. 6.6Hz라 폰 회전 시 단계적 stutter가 보임.

**해결**: 60ms (16Hz)로 낮춤. setBearing 자체는 가벼운 CSS transform이라 16Hz 호출은 부담 X. 사람 눈에 거의 실시간.

## 원인 2 — 화면 자동 회전 시 90° 어긋남 (갑자기 점프)

`deviceorientation` 이벤트의 alpha/webkitCompassHeading은 **디바이스 top edge** 기준이지, 화면 위쪽 기준이 아님. portrait↔landscape 자동 회전 시 화면 top과 디바이스 top이 90° 어긋남.

```typescript
function getScreenAngle(): number {
  if (typeof screen !== 'undefined' && screen.orientation?.angle != null) {
    return screen.orientation.angle;     // 모던 API: 0/90/180/270
  }
  const legacy = (window as { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;   // iOS 레거시: 0/90/-90/180
}

return ((raw - getScreenAngle()) % 360 + 360) % 360;
```

`leaflet-rotate`의 `_onDeviceOrientation`도 동일 패턴(`o - window.orientation`).

## 원인 3 — 두 이벤트가 다른 reference frame으로 fire (가만히 있어도 토글)

처음 코드는 두 이벤트 다 listen:

```typescript
window.addEventListener('deviceorientationabsolute', handler);
window.addEventListener('deviceorientation', handler);
```

Android Chromium은 둘 다 fire하는데:
- `deviceorientationabsolute` → `absolute === true` (북쪽 기준 절대값)
- `deviceorientation` → `absolute === false` (디바이스 시작 시점 기준 상대값)

같은 raw alpha가 두 이벤트에서 다른 의미로 들어와 throttle 통과할 때마다 토글. heading이 매 60ms 점프.

**처음 시도했던 잘못된 해결**: `pickEventName()`으로 이벤트 하나만 listen.

```typescript
// ❌ 이렇게 하면 안 됨
function pickEventName() {
  if ('ondeviceorientationabsolute' in window) return 'deviceorientationabsolute';
  ...
}
```

Codex stop-gate review가 잡은 함정:

> event selection can silently disable heading updates on browsers that expose `ondeviceorientationabsolute` but only dispatch `deviceorientation`

`'on...' in window` 체크가 true여도 실제로는 그 이벤트를 **dispatch하지 않는** 브라우저가 존재. 그러면 listener에 영원히 도달 못해 heading=null. silent fail.

**올바른 해결**: 두 이벤트 모두 listen + content 기반 필터.

```typescript
function readHeading(e: OrientationLike): number | null {
  let raw: number;
  if (typeof e.webkitCompassHeading === 'number') {
    raw = e.webkitCompassHeading;            // iOS — 항상 절대값
  } else if (e.alpha != null) {
    if (e.absolute === false) return null;   // ← 상대 frame 거부
    raw = (360 - e.alpha) % 360;             // absolute=true 또는 undefined(레거시 fallback)
  } else {
    return null;
  }
  return ((raw - getScreenAngle()) % 360 + 360) % 360;
}
```

이러면:
- iOS: webkitCompassHeading만 채택
- Android Chromium: deviceorientationabsolute 채택 (absolute=true), deviceorientation 거부 (absolute=false) → toggling 없음
- 레거시: deviceorientation with `absolute === undefined` 도 best-effort 채택

## 원인 4 — 자기장 센서 raw 노이즈 (가만히 있어도 떨림)

자기장 센서는 가만히 있어도 ±1~2° 노이즈가 항상 있음. 60ms throttle 통과한 raw 값이 그대로 반영되면 시각적으로 떨림.

**해결**: EMA(exponential moving average) 스무딩, weight 0.25:

```typescript
function smoothHeading(prev: number, next: number, weight: number): number {
  let delta = next - prev;
  // 360°↔0° wrap-around 처리: 359° → 1° 변화는 +2°이지 -358°이 아님
  if (delta > 180) delta -= 360;
  else if (delta < -180) delta += 360;
  const result = prev + delta * weight;
  return ((result % 360) + 360) % 360;
}
```

Wrap-aware가 핵심 — 단순 `prev * 0.75 + next * 0.25`로 하면 359° → 1° 같이 0°선 넘어갈 때 평균이 180° 근처로 튐.

## 최종 코드

```typescript
const THROTTLE_MS = 60;
const SMOOTHING = 0.25;

useEffect(() => {
  if (!enabled || !supported || permission !== 'granted') {
    setHeading(null);
    smoothedRef.current = null;
    return;
  }
  const handler = (e: Event) => {
    const raw = readHeading(e as OrientationLike);
    if (raw == null || !Number.isFinite(raw)) return;
    const smoothed =
      smoothedRef.current == null
        ? raw
        : smoothHeading(smoothedRef.current, raw, SMOOTHING);
    smoothedRef.current = smoothed;
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;
    setHeading(smoothed);
  };
  window.addEventListener('deviceorientationabsolute', handler as EventListener);
  window.addEventListener('deviceorientation', handler as EventListener);
  return () => {
    window.removeEventListener('deviceorientationabsolute', handler as EventListener);
    window.removeEventListener('deviceorientation', handler as EventListener);
  };
}, [enabled, supported, permission]);
```

## 교훈

### 1. 모바일 센서는 4겹 디펜스가 필요

heading 같은 시각 회전 UI는 다음 4개 모두 처리해야 사용 가능:

| 레이어 | 처리 |
|--------|------|
| 이벤트 소스 | 두 개 listen + content 기반 필터 (`absolute===false` 거부) |
| 화면 회전 | `screen.orientation.angle` 빼기 |
| Throttle | 60~80ms (반응성 vs 부하 균형) |
| 노이즈 스무딩 | EMA + wrap-around 처리 |

하나라도 빠지면 사용 불가능한 수준. 부분 적용 = 부분 작동 X = 거의 작동 X.

### 2. Feature detection은 `'on…' in window`로는 부족

JavaScript의 `in` 연산자는 prop이 정의되어 있는지만 확인 — 실제로 동작하는지는 안 봄. 모바일 브라우저는 onerr 같은 prop은 노출하지만 dispatch는 안 하는 케이스가 흔함.

함정 회피:
- 이벤트 종류 여러 개 listen하고 content로 분기
- 또는 첫 이벤트가 X ms 안에 도달하지 않으면 fallback 시작

### 3. Adversarial review가 silent-fail 함정의 best 방어

처음 짠 `pickEventName()` 패턴은 **로컬 데스크톱 + JS dispatch로는 정상 작동**. 갤럭시에서도 이전 버그(double rotation) 수정 검증을 위해 한 번 테스트했을 텐데 **만약 사용자 디바이스가 silent-fail 케이스였다면 head-up이 작동 안 됐을 것**. Codex stop-gate review가 코드만 보고 "exposed but not dispatched" 케이스를 specifically 지적해서 잡힘.

같은 패턴은 P2.13b의 markerPane double-rotation 때도 작동 — Codex가 코드 정독해서 markerPane 위치를 발견. 시각 검증으로는 못 잡는 게 종종 코드 리딩으로는 보인다.

### 4. EMA 스무딩의 wrap-around

각도(0~360 mod) 같이 wrap이 있는 값은 단순 가중평균하면 0°/360° 경계에서 폭발한다. delta 계산 후 ±180 범위로 정규화한 뒤 더하기.

```python
delta = (next - prev + 540) % 360 - 180   # always in [-180, 180]
```

같은 패턴이 적용되는 케이스:
- 시계 시간 차이 계산 (24시 모드)
- 항해 bearing 평균
- 음악 12-tone 인터벌

## 김동현 원펀치

모바일 센서 시각화는 4겹 디펜스 — 이벤트 소스 / 화면 회전 / throttle / EMA. 하나라도 빼면 안 굴러간다. feature detect는 `'in'`이 아니라 content 기반.
