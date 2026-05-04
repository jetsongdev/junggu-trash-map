# `leaflet-rotate` 통합 — UMD 번들이 `window.L` 전역 의존, ESM import 순서 함정

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: P2.13b head-up 모드 (지도 회전)

## 문제

Leaflet 1.9는 회전 비지원. 머리 위 방향(head-up) 모드를 쓰려면 `leaflet-rotate@0.2.8` 플러그인을 추가해야 한다. `bun add leaflet-rotate` 후 단순히:

```typescript
// src/components/Map.tsx
import 'leaflet-rotate';   // side-effect import
```

`bun run dev` 띄우자마자 콘솔 에러:

```
ReferenceError: L is not defined
  at .../node_modules_..._leaflet-rotate.js:10
```

## 진단

플러그인 번들(`dist/leaflet-rotate.js`)은 UMD 래퍼 형태:

```javascript
!function(t){"function"==typeof define&&define.amd?define(t):t()}((function(){
  "use strict";
  const t = L.extend({}, L.DomUtil);   // ← bare L 참조
  L.extend(L.DomUtil, { ... });
  // ...
}));
```

브라우저 글로벌 스크립트로 로드되는 걸 가정하고 `<script src="leaflet.js"></script>` 다음에 자기를 로드하는 클래식 jQuery 플러그인 패턴. 즉 **`window.L`이 이미 정의되어 있어야 한다**.

ESM 환경(Vite/Webpack/Turbopack)에서는 `import L from 'leaflet'`로 가져와야 하고 자동으로 `window.L`에 안 박힌다.

`package.json`을 보면 `"module": "src/index.js"`로 ESM entry도 있는데, 그 소스 파일들도 똑같이 bare `L` 참조라서 import만 한다고 해결 X — leaflet 의존성을 import해서 L을 expose하지 않는다.

## 해결 — `window.L` 셋업 모듈을 분리

side-effect import를 두 개로 쪼개고, 셋업이 먼저 실행되도록 작성 순서를 정렬:

```typescript
// src/lib/leaflet-globals.ts
'use client';

import L from 'leaflet';

if (typeof window !== 'undefined') {
  const w = window as Window & { L?: typeof L };
  if (!w.L) {
    w.L = L;
  }
}

export {};
```

```typescript
// src/components/Map.tsx
'use client';

import { useEffect } from 'react';
import '@/lib/leaflet-globals';                 // ← 먼저 (window.L 셋업)
import 'leaflet-rotate/dist/leaflet-rotate.js'; // ← 뒤 (window.L 사용)
import { MapContainer, ... } from 'react-leaflet';
```

ESM 스펙은 **모듈 평가 순서를 import 등장 순서대로** 보장한다 (deferred evaluation 룰). 첫 번째 import가 `window.L = L` 사이드이펙트를 끝낸 뒤에야 두 번째 import가 평가된다. Webpack/Turbopack 모두 이 순서를 유지.

## MapContainer에 rotate 옵션 전달

react-leaflet 5의 `MapContainerProps` 타입은 `rotate`/`bearing`/`touchRotate` 같은 플러그인 확장 옵션을 모른다. `as` 캐스팅으로 우회:

```typescript
<MapContainer
  center={JUNGGU_CENTER}
  zoom={14}
  scrollWheelZoom
  style={{ height: '100%', width: '100%' }}
  {...({ rotate: true, rotateControl: false, touchRotate: false, bearing: 0 } as object)}
>
```

`rotateControl: false`는 플러그인 기본 회전 컨트롤(좌상단 화살표)을 끄고, 우리 토글 칩으로만 제어.

## bearing 변경은 `useMap` 훅 컴포넌트로 imperative 호출

react-leaflet은 props 변경을 leaflet 인스턴스에 propagate하지 않으므로(별도 TIL 참고), bearing 변경은 자식 컴포넌트에서:

```typescript
type RotatedMap = ReturnType<typeof useMap> & {
  setBearing?: (theta: number) => void;
};

function BearingController({ bearing }: { bearing: number | null }) {
  const map = useMap() as RotatedMap;
  useEffect(() => {
    if (typeof map.setBearing !== 'function') return;
    map.setBearing(bearing ?? 0);
  }, [map, bearing]);
  return null;
}
```

`MapContainer` 자식으로 마운트하면 heading 변할 때마다 `setBearing` 호출.

## 교훈

UMD 번들을 ESM 프로젝트에 끌어올 땐 항상 다음을 확인:

1. **번들이 글로벌 의존인가?** (`bare-name` references in dist) → `window.X = X` 사전 셋업 필요
2. **셋업과 플러그인 import는 별도 파일로 분리** → ESM 평가 순서 보장
3. **TypeScript 타입은 자체 정의 안 됨** → `as object` / 모듈 augmentation

같은 함정의 라이브러리들:
- 구버전 `chart.js` 플러그인 (Chart 글로벌 의존)
- jQuery 플러그인 일체
- d3 확장 (`d3-cloud` 등)

이번처럼 active 유지되는 GPL 라이브러리지만 ESM/번들러 친화적이지 않은 코드들은 wrap 한 겹 거치는 게 표준 패턴.

## 김동현 원펀치

UMD 글로벌 의존 플러그인은 `window.L` 셋업 모듈을 분리해서 먼저 import. 같은 파일에서 `window.L = L` + plugin import 순서로 쓰면 hoisting/번들 최적화 함정에 걸린다.
