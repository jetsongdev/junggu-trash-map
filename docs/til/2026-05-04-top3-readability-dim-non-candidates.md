# Top-N 후보 강조 — 후보를 키우지 말고 비후보를 죽여라

**일자**: 2026-05-04
**프로젝트**: junggu-trash-map (PROTO)
**관련 작업**: P2.10 Top-3 가독성 개선

## 문제

가까운 휴지통 Top-3 후보를 시각 강조하려고 처음엔 rank별 크기·투명도를 차등화했다:

```typescript
const RANK_STYLE = {
  1: { opacity: 1.0,  scale: 1.0   },  // 가장 도드라지게
  2: { opacity: 0.55, scale: 0.75  },  // 중간
  3: { opacity: 0.35, scale: 0.625 },  // 가장 약하게
};
// 비후보 마커: 평소 그대로 (opacity 1, 표준 크기)
```

푸시 후 사용자: "**top3가 나머지 마커보다는 잘 보여야 하는데 오히려 잘 안 보임**".

## 진단

`bins.length === 59`. 그중 56개는 평소 모습 그대로(opacity 1, 표준 크기), 3개만 rank별로 작아지고 흐려졌다. 결과:

- rank 1: 다른 마커들과 같은 크기, 강조 ring으로만 구분됨
- rank 2 (opacity 0.55): 일반 마커(opacity 1)보다 **더 흐리게 보임**
- rank 3 (opacity 0.35): 거의 사라짐 — 배경 마커들 사이에 묻힘

"후보를 강조" → "**비후보 평균이 후보보다 더 눈에 띈다**"는 모순. 화면에서는 56개의 일반 마커가 시각 노이즈가 되어 3개의 후보를 가린다.

## 해결

전제를 뒤집었다. **강조해야 할 건 후보가 아니라 비후보를 죽이는 것**:

```typescript
const RANK_STYLE = {
  1: { scale: 1.0   },  // opacity 모두 1
  2: { scale: 0.75  },
  3: { scale: 0.625 },
};

// BinMarker에 dimmed prop 추가
function BinMarker({ bin, rank, dimmed }) { ... }

// Map.tsx에서 highlights 있을 때 비후보 dimmed=true
{bins.map((bin) => {
  const rank = highlightRanks.get(bin.id);
  return <BinMarker rank={rank} dimmed={hasCandidates && !rank} />;
})}
```

dimmed 마커는 `opacity: 0.25`, 후보는 모두 `opacity: 1`. rank 구분은 **크기로만** (100% / 75% / 62.5%).

추가로 후보 3개에 각각 사용자 위치에서 굵기·색이 다른 점선을 연결:

```typescript
const DISTANCE_LINE_STYLE = {
  1: { color: '#0ea5e9', weight: 3,   opacity: 0.85 },
  2: { color: '#7dd3fc', weight: 2,   opacity: 0.6  },
  3: { color: '#bae6fd', weight: 1.5, opacity: 0.4  },
};
```

선 굵기·진하기가 1·2·3 순위 시각적 우선순위를 한 번 더 reinforce.

## 결과

이제 56개의 비후보가 흐릿한 배경이 되고 3개 후보만 또렷하게 떠오른다. 선 3개도 자연스럽게 후보를 가리키는 시선 가이드 역할.

## 교훈

**대비(contrast)는 강조와 죽임의 차이로 만들어진다.** Top-N 강조에서는:

- ❌ 강조 대상의 시각 크기·진하기를 키운다 (절대 기준 변경) → 다른 노이즈가 그대로면 효과 묻힘
- ✅ 비강조 대상을 죽인다 (상대 차이 확대) → 강조 대상은 평범한 채로도 도드라짐

특히 **N개의 비강조 vs M개의 강조** 구도에서 `N >> M`일 때 (Top-3 in 59) 더 그렇다 — 비강조의 시각 총량이 강조를 압도하기 때문에 비강조 쪽 죽이는 게 효율 압도적.

같은 원리:
- Apple Maps 검색 결과 → 비결과 마커 dim
- Google Photos 얼굴 그룹 → 다른 인물은 흐리게
- 다이어그램 강조 → 강조선 굵기 키우기보다 나머지를 회색으로

## 김동현 원펀치

3개를 더 선명하게 만들지 말고, 56개를 더 흐리게 만들어라.
