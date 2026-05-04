# Leaflet divIcon — `transform:scale()`은 레이아웃에 영향 X, 중첩 span은 overflow

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: P2.10 Top-3 후보 시각화

## 문제

가까운 휴지통 Top-3를 rank별 크기로 시각 차등화하려고 `BinMarker.tsx`의 `makeIcon()`을 이렇게 짰다:

```typescript
const RANK_STYLE: Record<Rank, { opacity: number; iconSize?: number; scale: number }> = {
  1: { opacity: 1, scale: 1 },
  2: { opacity: 0.55, iconSize: 24, scale: 0.75 },
  3: { opacity: 0.35, iconSize: 20, scale: 0.625 },
};

// outer는 작은 박스(24px), inner는 원래 크기(32~44px)에 transform:scale()
const html = `<span style="width:${iconSize}px; height:${iconSize}px; opacity:${opacity}">
  <span style="width:${baseWidth}px; height:${baseHeight}px;
               transform:scale(${scale}); transform-origin:center;">
    ${emoji}
  </span>
</span>`;
```

테스트·빌드 다 통과. 푸시 후 사용자가 "하나만 나오는데?"

## 진단

화면 렌더 확인하니 **rank 2/3 마커가 rank 1과 거의 같은 크기로 보인다**. opacity는 적용됐지만 크기 차이가 없음.

원인은 CSS `transform`의 동작 방식이다:

> `transform: scale(0.75)`는 시각적으로만 축소하고 **레이아웃 박스 크기는 그대로 유지**한다.

즉:
- inner span은 `width:32px, height:32px`로 레이아웃 차지
- outer span은 `width:24px, height:24px`로 만들었지만 inner가 **밖으로 overflow**
- outer에 `overflow:hidden`이 없으니 inner가 그대로 다 보임
- `transform:scale(0.75)` 적용한 inner가 24px 박스 밖으로 비져나와서 시각적으로는 ~24px이 아닌 ~32px

opacity 차이만 들어가서 화면에서는 밝기 정도만 달라 보이고 크기는 동일.

## 해결

중첩 span을 없애고 단일 span에 직접 `width/height/font-size`를 scale 곱한 값으로 박았다:

```typescript
const RANK_STYLE: Record<Rank, { scale: number }> = {
  1: { scale: 1 },
  2: { scale: 0.75 },
  3: { scale: 0.625 },
};

const iconWidth = Math.round(baseWidth * scale);
const iconHeight = Math.round(baseHeight * scale);
const fontSize = Math.round(baseFontSize * scale);

const html = `<span style="
  width:${iconWidth}px; height:${iconHeight}px;
  font-size:${fontSize}px;
  ...
">${emoji}</span>`;
```

`transform:scale()` 제거. 레이아웃 박스 자체가 작아지므로 이제 진짜 작게 보인다.

`L.divIcon`의 `iconSize`/`iconAnchor`도 같이 작아진 값을 줘야 leaflet이 마커 위치 anchor를 정확히 잡는다:

```typescript
return L.divIcon({
  iconSize: [iconWidth, iconHeight],
  iconAnchor: [Math.round(iconWidth / 2), Math.round(iconHeight / 2)],
  ...
});
```

## 교훈

CSS `transform`은 시각 변형용이지 레이아웃 변형용이 아니다. 박스 크기를 진짜 바꾸고 싶으면:

- ✅ `width/height` 직접 계산
- ✅ inner content (text, font-size, padding)도 동일 비율로 함께 스케일
- ❌ `transform:scale()` (레이아웃 그대로, anchor 어긋남)
- ❌ outer를 작게 + inner는 그대로 (overflow trap)

leaflet `divIcon`은 특히 함정 — `iconSize`는 marker pane의 anchor 계산에 쓰이므로 실제 시각 크기와 일치해야 클릭/탭 hit-test도 맞다.

## 김동현 원펀치

`scale()`로 줄였다고 박스도 줄어든 게 아니다. 진짜 줄이려면 width·height·font-size 다 곱해서 박아라.
