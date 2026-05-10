# P2.24 — Liquid Glass 디자인 언어

- **Date**: 2026-05-10
- **Phase**: 2 (UX 잔여)
- **Status**: spec → plan
- **Related**: P2.22(모바일 툴바 압축) · P2.23(HUD 재배치) · I.6(a11y) · I.3(Lighthouse CI)

## 목표

Apple iOS/iPadOS 26의 Liquid Glass 시각 언어를 6개 floating UI 표면에 일관된 토큰으로 적용해, "지도 위에 떠 있는 인터페이스"의 깊이감과 살아있는 느낌을 살린다. 가독성·접근성·성능 회귀는 0.

## 비목표 (Non-goals)

- 인터랙션·애니메이션 변경 (P2.13/P2.16에서 다룸). 지금은 시각만.
- SVG `feTurbulence` 광학 lensing — Stage 2 후보로 보류. 이번 라운드는 CSS-only.
- 마커·polyline·tooltip 등 지도 위 leaflet 레이어. HUD/카드/토스트만.
- 색상 팔레트(blue/emerald/violet/amber/sky/rose) 변경. accent 색은 유지.

## 적용 표면 (6개)

| 표면 | 위치 | 현재 | 변경 |
|---|---|---|---|
| 필터 박스 | 좌상단 floating group | `bg-white/80 + ring + backdrop-blur-sm` | `glass-surface` |
| 모드 stack | 우상단 floating group (즐겨찾기/거리/나침반/테마/공유/셀렉터) | `bg-white/80 + ring + backdrop-blur-sm` | `glass-surface` |
| 메뉴 한 줄 칩 | 좌하단 floating group | `bg-white/80 + ring + backdrop-blur-sm` | `glass-surface` |
| 검색박스 | 상단 중앙 input + dropdown | `bg-white` (opaque) | `glass-surface-strong` (input + dropdown) |
| Status 카드 | 우하단 (collapsed/expanded) | `bg-white/45 + ring + backdrop-blur-sm` | `glass-surface` |
| 토스트 | 화면 중앙 (info/error/success) | `bg-white/20 + ring-white/30 + backdrop-blur-xl` | `glass-toast` (variant별 tint 유지) |

## 디자인 토큰

`src/app/globals.css`에 두 클래스 + dark 변형. Tailwind v4 `@layer components`에 박는다.

```css
@layer components {
  .glass-surface {
    background: rgba(255, 255, 255, 0.62);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.55);
    box-shadow:
      0 8px 24px rgba(15, 23, 42, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      inset 0 -1px 0 rgba(15, 23, 42, 0.05);
  }
  .dark .glass-surface {
    background: rgba(23, 23, 23, 0.55);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.40),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -1px 0 rgba(0, 0, 0, 0.20);
  }

  /* 검색 input·dropdown처럼 텍스트 입력·리스트라 가독성이 우선인 표면 */
  .glass-surface-strong {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow:
      0 12px 32px rgba(15, 23, 42, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  .dark .glass-surface-strong {
    background: rgba(23, 23, 23, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  /* 토스트는 짧은 노출이라 더 가벼운 유리 */
  .glass-toast {
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    box-shadow:
      0 12px 32px rgba(15, 23, 42, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }
}
```

핵심 디자인 결정:

- `inset` shadow 두 줄(top highlight + bottom shade)이 "유리의 두께" 환영을 만든다. 단순 backdrop-blur보다 입체감 강함.
- `saturate(180%)`로 OSM 베이지·녹지·도로색을 유리 안쪽에서 끌어와 발랄함. 다크 타일은 톤이 가라앉아 `160%`로 약화.
- light alpha 0.62 / dark alpha 0.55 — 다크 타일이 깊어 텍스트 대비를 확보하려면 base를 더 옅게 두고 inset highlight로 윤곽을 살림.

## 활성 칩 처리

현재 활성 칩은 5색 accent (amber/sky/violet/rose/emerald) + 15% fill + ring + ✓ corner badge. Glass 부모 위에 그대로 얹으면 affordance 약해질 위험.

**규칙**:
- **비활성 칩 (`hudInactive`)**: 부모 glass surface에 자연 노출 (`bg-transparent` 가까운 톤). 현재 `bg-white/95`는 너무 무거우니 `bg-white/0` + hover 시 `bg-white/15` 정도로 약화.
- **활성 칩 (`hud{Color}Active`)**: solid color identity 유지 (`bg-amber-500/85` 정도). 색이 흐려져서 "지금 켜져있다"가 안 읽히면 안 됨. `ring`은 그대로, ✓ corner badge도 유지.
- **공유·테마 같이 momentary 액션 칩**: 비활성처럼 둠.

## 검증 게이트

1. **Lighthouse perf ≥ 0.62 유지** — `backdrop-filter`는 GPU 합성이라 영향 미미하지만 PR 게이트로 자동 확인. 만약 0.60대로 떨어지면 active chip 변형의 `inset` shadow 등 단순화.
2. **a11y 무결** — axe-core 0 violations 유지. WCAG AA(4.5:1) 텍스트 대비. 다크 alpha 0.55가 위험할 수 있어 `globals.css` 변경 직후 axe-core로 텍스트 대비 회귀를 명시 점검(I.6 baseline 비교).
3. **마커 가독성** — 줌 ≥15에서 status card가 마커 위에 겹쳐도 마커 모양이 식별 가능한지 light/dark 양쪽에서 시각 확인 (snapshot의 정성 평가).
4. **iOS Safari prefers-reduced-transparency** — 사용자 환경설정에서 투명도 감소 켰을 때 fallback. 미디어 쿼리로 alpha를 `0.92`로 끌어올리고 `backdrop-filter: none`. (보너스, 우선순위는 낮음)
5. **snapshot 4장 (`docs/snapshots/45-liquid-glass/`)**:
   - `screenshot-light-default.png` — 기본 라이트, 6 표면 모두 보임
   - `screenshot-dark-default.png` — 기본 다크
   - `screenshot-light-status-open.png` — 우하단 status 펼친 상태
   - `screenshot-light-search-dropdown.png` — 검색 드롭다운 열린 상태

## 회귀 위험 & 대비책

- **markercluster bubble**: react-leaflet cluster는 `<div>` 바깥이라 glass surface 영향 없음. 회귀 0.
- **검색 드롭다운 z-index 충돌**: 부모 glass 안에서 자식 드롭다운이 같은 토큰을 쓰면 두 겹 blur가 stack될 수 있음. 드롭다운은 `glass-surface-strong` 단독 사용, 부모 input과 겹쳐도 backdrop-filter는 한 번만 합성됨(OK).
- **iOS Safari 9 미만**: `backdrop-filter` 미지원. 자동으로 base alpha만 적용돼 솔리드 톤으로 떨어짐. 우리 데이터에서 iOS 9 미만은 거의 0.
- **롤백**: 한 commit에 토큰 추가 + 6 표면 클래스 교체. `git revert <sha>` 한 방.

## 작업 단위 (PR 1개, 작은 단위)

1. `src/app/globals.css` — `.glass-surface` / `.glass-surface-strong` / `.glass-toast` 토큰 추가 (light + dark)
2. `src/app/page.tsx` — `hudFloatingGroup` / `hudInactive` 베이스 변경, 활성 칩 alpha 조정, status 카드 클래스 교체, 토스트 클래스 통일
3. `src/components/SearchBox.tsx` — input + dropdown 클래스 교체
4. snapshot 4장 캡처 (`docs/snapshots/45-liquid-glass/`)
5. `docs/tasks.md` — P2.24 ✅ Done 이동 + 함정 메모 (alpha tuning history)
6. `CHANGELOG.md` `[Unreleased]` `Changed` — "HUD/검색/status/토스트에 Liquid Glass 디자인 언어 적용"
7. PR with `release:minor` label → prebump → preview Lighthouse 점수 확인 → main merge

## 결정 이력

- 2026-05-10: 전체 6개 표면 vs HUD 4개 vs 2개 → 사용자 결정으로 6개 (시각 일관성 우선).
- 2026-05-10: CSS-only vs SVG turbulence vs 2단계 → CSS-only (perf 안전, 95% 시각 임팩트).
- 2026-05-10: 활성 칩은 색 identity 우선 (alpha 0.85 유지). 자식까지 모노톤화는 affordance 손실 위험.
- 2026-05-10: 토스트는 현재가 거의 정답이라 토큰만 통일.

## 참고

- [WidgetKit — Implementing Liquid Glass Design](https://github.com/artemnovichkov/xcode-26-system-prompts/blob/main/AdditionalDocumentation/WidgetKit-Implementing-Liquid-Glass-Design.md)
- [Apple Developer — Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)
- [Apple Developer — Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
