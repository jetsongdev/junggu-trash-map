# 2026-05-11 리팩터링 리포트

## 범위

- `src/app/page.tsx`의 자치구 로드 진행률/상태 row 계산을 `src/lib/district-progress.ts`로 분리했다.
- 새 순수 모듈에 Vitest 테스트 `src/lib/__tests__/district-progress.test.ts`를 추가했다.
- Playwright e2e 실행 환경을 `playwright.config.ts`와 `e2e/home.spec.ts`로 추가했다.
- 스냅샷 `docs/snapshots/50-refactor-e2e-baseline/`에 모바일·데스크톱 기준선을 남겼다.

## 변경 파일

- `src/lib/district-progress.ts` — populated/loaded/terminal count, breakdown row, visual status helper.
- `src/lib/__tests__/district-progress.test.ts` — count/sort/status 우선순위 테스트.
- `src/app/page.tsx` — 기존 inline 계산을 helper 호출로 교체.
- `playwright.config.ts` — e2e 전용 Next webpack dev server (`127.0.0.1:3100`).
- `e2e/home.spec.ts` — 첫 화면 핵심 컨트롤 smoke test.
- `vitest.config.ts` — Playwright e2e spec을 Vitest 수집 대상에서 제외.
- `package.json`, `bun.lock` — `test:e2e` script와 `@playwright/test`.
- `docs/snapshots/50-refactor-e2e-baseline/`, `docs/snapshots/README.md` — visual baseline.

## 검증 결과

- `bun run test src/lib/__tests__/district-progress.test.ts`
  - PASS: 1 file, 7 tests.
- `bun run test`
  - PASS: 18 files, 192 tests.
- `bunx tsc --noEmit -p .`
  - PASS after `bun install --frozen-lockfile`.
- `bun run test:e2e`
  - PASS: 1 Chromium test.
  - Note: sandboxed run failed with `listen EPERM: operation not permitted 0.0.0.0:3000`; escalated local-server run passed.
- `bun run build`
  - PASS after escalated network-enabled rerun.
  - First sandboxed run failed at `/apple-icon` prerender with `getaddrinfo ENOTFOUND cdn.jsdelivr.net`.
- `file docs/snapshots/50-refactor-e2e-baseline/screenshot-mobile.png docs/snapshots/50-refactor-e2e-baseline/screenshot-desktop.png`
  - PASS: `390 x 844`, `1920 x 1080`.

## 스냅샷

- `docs/snapshots/50-refactor-e2e-baseline/screenshot-mobile.png`
- `docs/snapshots/50-refactor-e2e-baseline/screenshot-desktop.png`

## 남은 위험

- 이번 리팩터는 전체 코드베이스를 무차별 재구성하지 않고, 가장 큰 페이지에서 중복된 순수 계산 로직을 분리한 surgical refactor다.
- Playwright는 smoke coverage다. 지도 타일/마커 세부 인터랙션까지 e2e로 고정하려면 별도 시나리오를 추가해야 한다.
