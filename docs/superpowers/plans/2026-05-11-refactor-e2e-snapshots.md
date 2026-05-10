# Refactor E2E Snapshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기능 변화 없이 지도 페이지의 반복 로드 상태 계산을 순수 모듈로 분리하고, 단위 테스트·Playwright e2e·스냅샷·리팩터링 리포트까지 남긴다.

**Architecture:** `src/app/page.tsx`에 있던 자치구 진행 상태 row 계산을 `src/lib/district-progress.ts`로 이동한다. UI는 같은 데이터를 렌더링하고, 새 모듈은 Vitest로 검증한다. Playwright는 로컬 dev 서버를 띄워 첫 화면과 주요 컨트롤 접근성을 확인한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Playwright CLI.

---

### Task 1: District Progress Pure Module

**Files:**
- Create: `src/lib/district-progress.ts`
- Create: `src/lib/__tests__/district-progress.test.ts`
- Modify: `src/app/page.tsx`

- [x] **Step 1: Add failing tests**

Add tests for populated-only breakdown, loaded/in-flight/failed status flags, sort order by `binCount`, and count helpers.

Run: `bun run test src/lib/__tests__/district-progress.test.ts`
Expected: FAIL because module does not exist.

- [x] **Step 2: Implement module**

Export `buildDistrictBreakdown`, `countPopulatedDistricts`, `countLoadedPopulatedDistricts`, `countTerminalPopulatedDistricts`, and `districtVisualStatus`.

Run: `bun run test src/lib/__tests__/district-progress.test.ts`
Expected: PASS.

- [x] **Step 3: Wire page**

Replace local duplicate count/breakdown/status logic in `src/app/page.tsx` with the new helpers.

Run: `bunx tsc --noEmit -p .`
Expected: PASS.

### Task 2: Playwright E2E Gate

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/home.spec.ts`
- Modify: `package.json`

- [x] **Step 1: Add e2e script and config**

Add `test:e2e` script that runs `playwright test`, with web server command `bun run dev`.

- [x] **Step 2: Add smoke e2e**

Check the home page loads, title/header controls render, and the status button can expand.

Run: `bun run test:e2e`
Expected: PASS, or report exact environment/browser blocker.

### Task 3: Report And Snapshots

**Files:**
- Create: `docs/reports/2026-05-11-refactor-report.md`
- Create: `docs/snapshots/50-refactor-e2e-baseline/`
- Modify: `docs/snapshots/README.md`

- [x] **Step 1: Capture snapshots**

Capture mobile and desktop baseline screenshots against the dev server.

- [x] **Step 2: Write report**

Summarize scope, changed files, verification commands, e2e result, and snapshot paths.

- [x] **Step 3: Final verification**

Run:
`bun run test`
`bunx tsc --noEmit -p .`
`bun run test:e2e`

Expected: all pass, or exact blocker documented.
