# P2.24 Liquid Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6개 floating UI 표면 (HUD floating groups · 검색박스 · status 카드 · 토스트 · 탭 모드 배너)에 Apple iOS 26 Liquid Glass 시각 언어를 CSS-only 토큰 시스템으로 적용.

**Architecture:** `globals.css`에 3 토큰 클래스(`.glass-surface` / `.glass-surface-strong` / `.glass-toast`) light + dark 변형을 박고, 기존 `bg-white/* + ring + backdrop-blur-sm` Tailwind 조합을 토큰 클래스로 교체. 활성 칩의 5색 accent identity는 그대로 유지(투명도만 0.15 → 0.85로 강화), 비활성 칩은 부모 glass에 자연 노출.

**Tech Stack:** Tailwind v4 (`@import "tailwindcss"` + `@custom-variant dark` + `@layer components`), Next.js 16, React 19, react-leaflet 5.

**Spec:** `docs/superpowers/specs/2026-05-10-p2-24-liquid-glass-design.md`

**Branch:** `feat/p2.24-liquid-glass`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/globals.css` | `.glass-surface` / `.glass-surface-strong` / `.glass-toast` 토큰 (light + dark) + reduced-transparency fallback |
| `src/app/page.tsx` | `hudFloatingGroup` / `hudInactive` / 활성 칩 / status 카드 / 토스트 / 탭 모드 배너 클래스 교체 (line 978–1007, 1167, 1339, 1391–1418, 1428) |
| `src/components/SearchBox.tsx` | input + dropdown 클래스 교체 (line 169, 178) |
| `docs/snapshots/45-liquid-glass/` | 4장 시각 검증 |
| `docs/tasks.md` | P2.24 Done 이동 + 함정 메모 |
| `CHANGELOG.md` | `[Unreleased] Changed` 한 줄 |

---

### Task 0: Branch + 사전 확인

**Files:** (none)

- [ ] **Step 1: feature branch 생성**

```bash
git checkout -b feat/p2.24-liquid-glass
```

- [ ] **Step 2: build/test 베이스라인 통과 확인**

```bash
bun run build
bun run test
```

Expected: 둘 다 PASS. P2.24 작업 시작 전 baseline.

- [ ] **Step 3: 현재 토큰 위치 확인 (page.tsx lines 978–1007)**

```bash
grep -nE "hudInactive|hudFloatingGroup|hud(Amber|Sky|Violet|Emerald)Active" src/app/page.tsx
```

Expected: 9개 정의 + 다수 사용처 출력. 다음 Task에서 정확히 이 라인들을 수정.

---

### Task 1: globals.css에 glass 토큰 추가

**Files:**
- Modify: `src/app/globals.css` (file end, after `.district-name-tooltip-dark`)

- [ ] **Step 1: 토큰 + reduced-transparency fallback 추가**

`src/app/globals.css` 파일 맨 끝에 추가:

```css
/* === P2.24 Liquid Glass tokens === */
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
    border-color: rgba(255, 255, 255, 0.10);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.40),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -1px 0 rgba(0, 0, 0, 0.20);
  }

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
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .glass-toast {
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    box-shadow:
      0 12px 32px rgba(15, 23, 42, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-surface,
  .glass-surface-strong,
  .glass-toast {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .glass-surface { background: rgba(255, 255, 255, 0.95); }
  .glass-surface-strong { background: rgba(255, 255, 255, 0.98); }
  .dark .glass-surface { background: rgba(23, 23, 23, 0.95); }
  .dark .glass-surface-strong { background: rgba(23, 23, 23, 0.98); }
}
```

- [ ] **Step 2: build 확인**

```bash
bun run build
```

Expected: PASS. CSS만 추가했으므로 type 영향 없음.

- [ ] **Step 3: dev 서버 띄워 토큰이 올라왔는지 한 번 확인**

```bash
PORT=3010 bun run dev
```

브라우저로 `http://localhost:3010` 접속 후 DevTools에서 `.glass-surface` 클래스가 stylesheet에 존재하는지 확인. 아직 어떤 element에도 적용 안 했으니 시각 변화 없어야 정상. dev 서버 종료.

---

### Task 2: hudFloatingGroup + hudInactive 토큰 교체

**Files:**
- Modify: `src/app/page.tsx` (lines 978–989)

- [ ] **Step 1: hudInactive 약화 + hudFloatingGroup 토큰 교체**

`src/app/page.tsx`에서 다음 두 라인 수정.

기존(line 978–979):
```tsx
const hudInactive =
  'bg-white/95 text-neutral-700 ring-1 ring-neutral-300 hover:bg-white dark:bg-neutral-900/95 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800';
```

신규:
```tsx
const hudInactive =
  'bg-transparent text-neutral-700 ring-1 ring-white/40 hover:bg-white/30 dark:text-neutral-200 dark:ring-white/15 dark:hover:bg-white/10';
```

기존(line 988–989):
```tsx
const hudFloatingGroup =
  'rounded-md bg-white/80 ring-1 ring-neutral-300 backdrop-blur-sm dark:bg-neutral-900/80 dark:ring-neutral-700';
```

신규:
```tsx
const hudFloatingGroup = 'rounded-md glass-surface';
```

- [ ] **Step 2: 활성 칩 5색 alpha 0.15 → 0.85로 강화**

`src/app/page.tsx` line 990–997, 4 토큰 모두 교체:

```tsx
const hudAmberActive =
  'bg-amber-500/85 text-white ring-1 ring-amber-300 shadow-sm dark:bg-amber-400/80 dark:text-neutral-950 dark:ring-amber-200';
const hudSkyActive =
  'bg-sky-500/85 text-white ring-1 ring-sky-300 shadow-sm dark:bg-sky-400/80 dark:text-neutral-950 dark:ring-sky-200';
const hudVioletActive =
  'bg-violet-500/85 text-white ring-1 ring-violet-300 shadow-sm dark:bg-violet-400/80 dark:text-neutral-950 dark:ring-violet-200';
const hudEmeraldActive =
  'bg-emerald-500/85 text-white ring-1 ring-emerald-300 shadow-sm dark:bg-emerald-400/80 dark:text-neutral-950 dark:ring-emerald-200';
```

> **이유:** 부모가 glass (반투명)라 자식 활성 칩이 `15% fill`이면 색이 희미해져 affordance 손실. solid 85%로 강화해서 "켜져있다"가 명확하게 읽히게.

- [ ] **Step 3: route segment 박스 (line 1063 근처)도 glass로**

`src/app/page.tsx`에서 다음 라인 찾아 수정.

기존:
```tsx
<div className="flex overflow-hidden rounded-md bg-white/95 ring-1 ring-neutral-300 dark:bg-neutral-900/95 dark:ring-neutral-700">
```

신규:
```tsx
<div className="flex overflow-hidden rounded-md glass-surface">
```

- [ ] **Step 4: speed slider panel (line 1167)도 glass로**

`src/app/page.tsx`에서 다음 라인 찾아 수정.

기존:
```tsx
<div className="mt-2 flex items-center gap-3 rounded-md bg-white/95 px-3 py-2 ring-1 ring-emerald-500/40 dark:bg-neutral-900/95">
```

신규:
```tsx
<div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 ring-1 ring-emerald-500/40 glass-surface">
```

- [ ] **Step 5: 헤더의 테마 토글 버튼 (line 1031)은 글래스 적용 제외**

헤더는 floating이 아니라 별도 박스. 변경 없음. 확인만.

- [ ] **Step 6: build + dev 시각 확인**

```bash
bun run build
```

Expected: PASS.

```bash
PORT=3010 bun run dev
```

브라우저로 접속해 좌상단 필터 / 우상단 모드 stack / 좌하단 메뉴 칩 / route segment 박스 / speed slider panel — 5 표면이 glass로 변했고 활성 칩(예: 격자 모드 amber, 즐겨찾기 amber, cone sky 등) 색이 명확히 보이는지 확인. light + dark 둘 다.

- [ ] **Step 7: 1차 commit**

```bash
git add src/app/globals.css src/app/page.tsx
git commit -m "feat(P2.24): glass tokens + HUD floating groups"
```

---

### Task 3: 우하단 status 카드 + 좌상단 floating filter wrapper

**Files:**
- Modify: `src/app/page.tsx` (line 1230, 1428)

- [ ] **Step 1: 좌상단 filter floating wrapper도 hudFloatingGroup 토큰을 쓰는지 확인**

```bash
grep -n "hudFloatingGroup" src/app/page.tsx
```

Expected: 4곳 사용 (line ~1230 좌상단 필터, ~1256 우상단 모드 stack, ~1269 좌하단 메뉴, 그리고 정의 1곳). Task 2에서 이미 `glass-surface`로 갈아끼웠으니 자동 반영됨.

- [ ] **Step 2: status 카드 (line 1428) 토큰 교체**

`src/app/page.tsx` 다음 라인 수정.

기존:
```tsx
<div className="absolute bottom-7 right-2 z-[1000] flex max-w-[80%] flex-col items-stretch overflow-hidden rounded-lg bg-white/45 text-neutral-800 ring-1 ring-neutral-200 backdrop-blur-sm dark:bg-neutral-900/45 dark:text-neutral-100 dark:ring-neutral-700">
```

신규:
```tsx
<div className="absolute bottom-7 right-2 z-[1000] flex max-w-[80%] flex-col items-stretch overflow-hidden rounded-lg text-neutral-800 dark:text-neutral-100 glass-surface">
```

> `bg-white/45 + ring + backdrop-blur-sm + dark:bg-* + dark:ring-*`를 `glass-surface` 한 개로 압축. light/dark 분기는 토큰이 자체 처리.

- [ ] **Step 3: build + dev 시각 확인**

```bash
bun run build
```

브라우저에서 우하단 status 카드 collapsed/expanded 둘 다 light + dark 확인. 마커 위에 카드 겹쳤을 때도 마커 모양 식별되는지.

- [ ] **Step 4: commit**

```bash
git add src/app/page.tsx
git commit -m "feat(P2.24): status card glass surface"
```

---

### Task 4: 토스트 + 탭 모드 배너 토큰 통일

**Files:**
- Modify: `src/app/page.tsx` (line 1391–1418)

- [ ] **Step 1: 탭 모드 배너 (origin/destination)에 glass-toast 추가**

`src/app/page.tsx` line 1391 근처 div 수정.

기존:
```tsx
<div
  className={`rounded-2xl max-w-sm px-6 py-4 text-center text-sm font-semibold text-white shadow-lg ring-1 ring-white/25 backdrop-blur-xl ${
    displayedTapTarget === "origin"
      ? "bg-violet-500/20"
      : "bg-rose-500/20"
  }`}
>
```

신규:
```tsx
<div
  className={`glass-toast rounded-2xl max-w-sm px-6 py-4 text-center text-sm font-semibold text-white ring-1 ring-white/25 ${
    displayedTapTarget === "origin"
      ? "bg-violet-500/20"
      : "bg-rose-500/20"
  }`}
>
```

> `shadow-lg + backdrop-blur-xl` 두 스타일을 `glass-toast` 한 개로. 기존 색 tint(violet/rose)는 유지.

- [ ] **Step 2: 토스트 (info/error/emphatic) 3 variant 토큰 통일**

`src/app/page.tsx` line 1413–1418 div className 객체 수정.

기존:
```tsx
className={
  toast.variant === 'error'
    ? 'max-w-sm rounded-2xl bg-red-500/20 px-6 py-4 text-center text-sm font-semibold text-white shadow-lg ring-1 ring-white/25 backdrop-blur-xl'
    : toast.variant === 'emphatic'
      ? 'max-w-sm rounded-2xl bg-emerald-500/20 px-6 py-4 text-center text-sm font-semibold text-white shadow-lg ring-1 ring-white/25 backdrop-blur-xl'
      : 'max-w-sm rounded-2xl bg-white/20 px-6 py-4 text-center text-sm font-medium text-neutral-900 shadow-lg ring-1 ring-white/30 backdrop-blur-xl dark:bg-neutral-900/20 dark:text-neutral-50 dark:ring-neutral-700/30'
}
```

신규:
```tsx
className={
  toast.variant === 'error'
    ? 'glass-toast max-w-sm rounded-2xl bg-red-500/20 px-6 py-4 text-center text-sm font-semibold text-white ring-1 ring-white/25'
    : toast.variant === 'emphatic'
      ? 'glass-toast max-w-sm rounded-2xl bg-emerald-500/20 px-6 py-4 text-center text-sm font-semibold text-white ring-1 ring-white/25'
      : 'glass-toast max-w-sm rounded-2xl bg-white/20 px-6 py-4 text-center text-sm font-medium text-neutral-900 ring-1 ring-white/30 dark:bg-neutral-900/20 dark:text-neutral-50 dark:ring-neutral-700/30'
}
```

- [ ] **Step 3: 첫 onboarding 토스트(line 1339)도 glass-surface-strong으로**

`src/app/page.tsx` line 1339 근처 수정.

기존:
```tsx
<div className="rounded-2xl bg-white/95 px-5 py-4 text-sm text-neutral-900 shadow-2xl ring-1 ring-neutral-200 backdrop-blur-sm min-w-[200px] dark:bg-neutral-900/85 dark:text-neutral-100 dark:ring-neutral-700">
```

신규:
```tsx
<div className="glass-surface-strong rounded-2xl px-5 py-4 text-sm text-neutral-900 min-w-[200px] dark:text-neutral-100">
```

- [ ] **Step 4: build + dev 확인**

```bash
bun run build
```

브라우저에서 토스트 트리거 (예: 검색박스에서 결과 없는 검색어, 출발+목적지 동시 set, 첫 ☆ 추가 등) → 시각 일관 + 가독성 확인.

- [ ] **Step 5: commit**

```bash
git add src/app/page.tsx
git commit -m "feat(P2.24): toast + tap banner glass-toast unify"
```

---

### Task 5: SearchBox input + dropdown 토큰 적용

**Files:**
- Modify: `src/components/SearchBox.tsx` (line 169, 178)

- [ ] **Step 1: input 클래스 교체**

`src/components/SearchBox.tsx` line 169 (input 태그 className) 수정.

기존:
```tsx
className={`min-h-[44px] w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-12 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:bg-neutral-800 ${FOCUS_VISIBLE_CLASS}`}
```

신규:
```tsx
className={`glass-surface-strong min-h-[44px] w-full rounded-2xl px-4 pr-12 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-500 ${FOCUS_VISIBLE_CLASS}`}
```

> input은 토큰의 background/border/shadow를 그대로 받고, `focus:bg-*`는 토큰이 inset highlight로 처리하므로 제거. focus ring은 `FOCUS_VISIBLE_CLASS`가 outline으로 처리.

- [ ] **Step 2: dropdown 클래스 교체**

`src/components/SearchBox.tsx` line 178 dropdown div 수정.

기존:
```tsx
<div className="absolute top-full z-[1000] mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
```

신규:
```tsx
<div className="glass-surface-strong absolute top-full z-[1000] mt-2 w-full overflow-hidden rounded-2xl">
```

- [ ] **Step 3: dropdown 항목 hover 색 조정**

dropdown의 각 button(line 197 근처)이 `hover:bg-neutral-100 dark:hover:bg-neutral-800`을 쓰는데, glass 위에선 너무 진함. 약화:

기존:
```tsx
className={`flex min-h-[44px] w-full items-start gap-3 border-t border-neutral-100 px-4 py-3 text-left text-sm text-neutral-900 first:border-t-0 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800 ${FOCUS_VISIBLE_CLASS}`}
```

신규:
```tsx
className={`flex min-h-[44px] w-full items-start gap-3 border-t border-white/30 px-4 py-3 text-left text-sm text-neutral-900 first:border-t-0 hover:bg-white/40 dark:border-white/10 dark:text-neutral-100 dark:hover:bg-white/10 ${FOCUS_VISIBLE_CLASS}`}
```

- [ ] **Step 4: build + dev 확인**

```bash
bun run build
```

브라우저에서 검색박스에 입력 → dropdown 열리고 hover 자연스러운지, light/dark 둘 다.

- [ ] **Step 5: commit**

```bash
git add src/components/SearchBox.tsx
git commit -m "feat(P2.24): SearchBox glass-surface-strong"
```

---

### Task 6: a11y 회귀 점검 + Lighthouse 빠른 확인

**Files:** (none)

- [ ] **Step 1: axe-core 텍스트 대비 회귀 점검**

I.6 baseline은 0 violations. dev 서버에서 axe 실행:

```bash
PORT=3010 bun run dev
```

별도 터미널:
```bash
npx @axe-core/cli http://localhost:3010 --tags wcag2a,wcag2aa,wcag21aa,best-practice
```

Expected: 0 violations. 만약 텍스트 대비 violation이 나오면, 가장 흔한 원인은 다크 토스트의 `text-neutral-900 dark:text-neutral-50` + alpha 0.20 base가 4.5:1 미달 → `text-neutral-900` → `text-neutral-50`으로 light/dark 둘 다 화이트 계열로 통일 시도.

- [ ] **Step 2: Lighthouse 빠른 모바일 확인 (선택)**

```bash
npx lighthouse http://localhost:3010 --preset=mobile-experimental --quiet --chrome-flags="--headless" --output=json | jq '.categories.performance.score'
```

Expected: ≥0.62. 떨어졌으면 어떤 표면이 비용 큰지 DevTools Performance 탭에서 backdrop-filter 합성 비용 확인.

- [ ] **Step 3: dev 서버 종료**

---

### Task 7: snapshot 4장 캡처

**Files:**
- Create: `docs/snapshots/45-liquid-glass/screenshot-light-default.png`
- Create: `docs/snapshots/45-liquid-glass/screenshot-dark-default.png`
- Create: `docs/snapshots/45-liquid-glass/screenshot-light-status-open.png`
- Create: `docs/snapshots/45-liquid-glass/screenshot-light-search-dropdown.png`
- Create: `docs/snapshots/45-liquid-glass/meta.md`
- Create: `docs/snapshots/45-liquid-glass/README.md`

- [ ] **Step 1: 글로벌 snapshot 스킬 호출 (4 시나리오)**

이 task는 사람/오케스트레이터가 처리. Codex 위임 아님. snapshot 스킬이 자동으로:
- Playwright로 모바일 viewport 캡처
- meta.md에 git_sha 기록
- README.md에 4장 인덱스
- `docs/snapshots/README.md`에 항목 추가

상호작용 시나리오:
- light-default: 로드 직후
- dark-default: 테마 토글 후
- light-status-open: 라이트 + 우하단 status 카드 펼침
- light-search-dropdown: 라이트 + 검색박스에 "명동" 입력 후 dropdown 열린 상태

- [ ] **Step 2: snapshot commit + SHA 정합 commit**

`trash-snapshot-commit` 스킬이 자동 처리.

---

### Task 8: tasks.md + CHANGELOG 갱신

**Files:**
- Modify: `docs/tasks.md` (P2.24 항목 Done으로 이동)
- Modify: `CHANGELOG.md` ([Unreleased] Changed 추가)

- [ ] **Step 1: docs/tasks.md 갱신**

`docs/tasks.md`에서 P2.24 항목을 Open 섹션 → ✅ Done (Phase 2) 섹션으로 이동. 한 줄 요약:

```markdown
- [x] **P2.24** Liquid Glass 디자인 언어 — `globals.css` `.glass-surface` / `.glass-surface-strong` / `.glass-toast` 토큰 + light/dark 분기 + `prefers-reduced-transparency` fallback. 6 표면 적용: 좌상단 필터 / 우상단 모드 stack / 좌하단 메뉴 칩 / 검색박스+dropdown / 우하단 status 카드 / 토스트+탭 배너. 활성 칩 alpha 0.15 → 0.85로 강화해 색 identity 보존. snapshot `45-liquid-glass/` 4장 (light · dark · status-open · search-dropdown).
```

「현재 상태」 줄도 갱신 — 다음 후보를 P4.1로 명시.

- [ ] **Step 2: CHANGELOG.md `[Unreleased]` Changed 한 줄 추가**

```markdown
### Changed
- HUD floating groups, 검색박스, status 카드, 토스트에 Apple Liquid Glass 톤 적용 — backdrop-blur + saturate + inset highlight로 깊이감, 활성 칩은 색 identity 유지
```

- [ ] **Step 3: 함정 메모 추가 (해당하는 경우)**

`docs/tasks.md` 함정 메모 섹션에:

```markdown
- **Tailwind v4 `@layer components` + `.dark` 셀렉터 조합** (P2.24): `@custom-variant dark (&:where(.dark, .dark *))` 환경에서 `.glass-surface` 같은 컴포넌트 토큰의 다크 변형은 `.dark .glass-surface { ... }`로 명시 작성. Tailwind utility의 `dark:bg-*` 컨벤션은 토큰 내부에 못 박는다. 한 번 토큰 정의하면 사용처에서 `glass-surface` 한 개만 호출하면 light/dark 자동.
- **Liquid Glass 활성 칩 색 identity** (P2.24): glass surface는 부모 자체가 반투명이라 자식 활성 칩이 `15% fill`이면 색이 sub-saturated 돼 affordance 손실. 5색 accent는 `solid 85%` 정도로 강화하고 text는 `text-white`(라이트) / `text-neutral-950`(다크 → ring 색이 밝아서 텍스트 어둡게). "켜져있다"가 한 눈에 읽혀야 함.
```

- [ ] **Step 4: commit**

```bash
git add docs/tasks.md CHANGELOG.md
git commit -m "docs(P2.24): tasks.md done + CHANGELOG + 함정 메모"
```

---

### Task 9: PR 생성 + Lighthouse PR watch + main merge

**Files:** (none — git/gh ops)

- [ ] **Step 1: push + PR 생성 with release:minor 라벨**

```bash
git push -u origin feat/p2.24-liquid-glass
gh pr create --base main --title "feat(P2.24): Liquid Glass 디자인 언어" --body "$(cat <<'EOF'
## Summary
- 6개 floating UI 표면에 Apple iOS 26 Liquid Glass 톤 적용 (CSS-only)
- backdrop-blur + saturate + inset highlight 토큰 시스템 (`globals.css`)
- 활성 칩 5색 accent identity는 alpha 0.15 → 0.85로 강화해 보존
- snapshot `45-liquid-glass/` 4장 (light · dark · status-open · search-dropdown)

## Test plan
- [x] bun run build PASS
- [x] bun run test PASS
- [x] axe-core 0 violations
- [ ] PR Lighthouse perf ≥ 0.62
- [ ] preview URL에서 light/dark 둘 다 시각 검증

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr edit <num> --add-label release:minor
```

- [ ] **Step 2: Lighthouse PR watch**

`trash-lighthouse-pr-watch` 스킬이 자동 폴링. 점수 표 출력, 통과 시 머지 + main sync.

- [ ] **Step 3: 머지 후 production preview 시각 검증**

`https://junggu-trash-map.vercel.app`에서 6 표면 모두 glass tone 잘 들어왔는지 light/dark 확인.

---

## Self-Review

**Spec coverage**:
- 6 표면 모두 Task 2/3/4/5에서 다룸 ✓
- CSS-only 토큰 시스템 Task 1 ✓
- 활성 칩 색 identity 보존 Task 2 Step 2 ✓
- a11y 무결 (axe baseline) Task 6 ✓
- Lighthouse perf ≥ 0.62 Task 6 + Task 9 ✓
- snapshot 4장 Task 7 ✓
- tasks.md + CHANGELOG Task 8 ✓
- prefers-reduced-transparency fallback Task 1 Step 1 ✓
- 롤백 전략 (한 commit revert) — feature branch에 commit 분리되어 있어 부분 revert 가능 ✓

**Type 일관성**:
- `glass-surface` / `glass-surface-strong` / `glass-toast` 3 클래스명 통일 ✓
- `hudInactive` / `hudFloatingGroup` / `hud{Color}Active` 기존 토큰명 유지 ✓

**No placeholders**:
- 모든 step에 실제 코드 또는 명령어 포함 ✓
- 파일 경로 라인 번호까지 명시 ✓
