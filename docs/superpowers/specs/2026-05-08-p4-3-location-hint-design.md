# P4.3 위치 힌트 텍스트 — 설계 문서

**작성일**: 2026-05-08
**브랜치**: `feat/p4.3-location-hint`
**상태**: 디자인 (사용자 승인 후 implementation plan)

---

## 1. 배경 / 재정의

`docs/tasks.md` Phase 4 P4.3는 본래 "휴지통 사진 1장 (Supabase Storage 또는 정적 추가) — 골목 안쪽 통 식별용"으로 정의돼 있었다.

브레인스토밍 결과 사진 경로의 모든 변형(수동 큐레이션·사용자 제보·자동 Street View)이 다음 중 하나의 트레이드오프에 갇힘이 확인됐다.

- **수동 사진**: 802 통 발품은 사실상 불가능 (~67시간). 가치 있는 case (골목 안쪽) 20~30개로 좁혀도 UI 가시성 문제.
- **사용자 제보 (Supabase)**: P4.2 본격 착수와 동치. 가벼운 작업 의도와 어긋남.
- **Street View 자동**: 골목은 차량 통행 불가 → 정작 필요한 case 못 채움. 타겟 미스.

대신 **운영자가 데스크에서 카카오·Naver 보면서 손으로 단 한 줄 위치 힌트 텍스트**가 동일한 사용자 가치를 발품 없이 만든다는 합의에 도달.

---

## 2. Goals / Non-Goals

### Goals

- 골목 안쪽·간판 사각지대·복잡한 입구 통의 **현장 도착 정확도** 향상
- 802 통 모두 잠재 대상이지만 **점진적 충전** (시간 흘러갈수록 채워짐, 0%여도 UI 정상)
- 작업 분업 가능 — Codex 백그라운드 위임으로 병렬 처리

### Non-Goals

- 사용자 제보 (P4.2 별도)
- 신규 휴지통 등록 (P4.2 또는 별도)
- 사진/이미지 (P4.3 원안 폐기)
- i18n (영문/일문/중문 힌트 — I.4 가동 시점)
- moderation·인증·관리자 페이지

---

## 3. 데이터 아키텍처

### 3.1 저장 위치

힌트는 자치구별 **별도 JSON 파일**.

```
public/data/hints/
├── junggu.json
├── mapo.json
└── ...
```

### 3.2 파일 스키마

```json
{
  "version": "2026-05-08",
  "hints": {
    "JG-0007": "남대문시장 4번 입구 골목 안쪽 5m",
    "JG-0012": "주차장 끝 숨은 계단 아래, 제동어린이집 좌측"
  }
}
```

- key: bin id (transform.ts가 발번한 `<prefix>-<NNNN>` 형식)
- value: 한 줄 자연어 (≤80자 권장, 강제 X)
- 파일 부재(404) → 빈 객체로 처리. 대부분 자치구는 처음에 파일 없음

### 3.3 transform.ts와의 격리

- `scripts/transform.ts`는 `public/data/districts/<code>.json`만 다룸 — **hints 파일 접근/수정 0**
- 공공 데이터 새 발행으로 transform 재실행해도 hint 안 사라짐
- hint 파일은 사람이 직접 편집하는 영역, district 파일은 자동 생성 영역 — 책임 분리 명확

---

## 4. 로딩·머지 흐름

### 4.1 신규 모듈: `lib/hints.ts`

```ts
import type { DistrictCode, TrashBin } from './types';

export type DistrictHints = {
  version: string;
  hints: Record<string, string>;
};

const EMPTY: DistrictHints = { version: '', hints: {} };

export async function fetchHints(code: DistrictCode): Promise<DistrictHints> {
  try {
    const res = await fetch(`/data/hints/${code}.json`);
    if (!res.ok) return EMPTY;
    return (await res.json()) as DistrictHints;
  } catch {
    return EMPTY;
  }
}

export function mergeHints(
  bins: TrashBin[],
  hints: Record<string, string>,
): TrashBin[] {
  return bins.map((b) =>
    hints[b.id] ? { ...b, locationHint: hints[b.id] } : b,
  );
}
```

### 4.2 page.tsx 통합

기존 `fetchDistrict(code)` 호출 옆에 `fetchHints(code)`를 병렬로:

```ts
const [district, hintsFile] = await Promise.all([
  fetchDistrict(code),
  fetchHints(code),
]);
const merged = mergeHints(district.bins, hintsFile.hints);
// 이후 기존 cache/state 업데이트 로직과 동일하게 진행
```

페이지 부트 시퀀스(`page.tsx` 274~378 부근의 prefetch 루프)와 panning trigger 양쪽 모두 동일 패턴으로 변경.

---

## 5. 타입 변경

`src/lib/types.ts`에 한 줄 추가:

```ts
export type TrashBin = {
  // ... 기존 필드 그대로
  locationHint?: string;  // runtime-injected. transform이 절대 채우지 않음.
};
```

**불변식**: `locationHint`는 fetch 후 `mergeHints` 결과에만 존재. JSON 파일에 직렬화되지 않음. transform.ts는 이 필드를 읽지도 쓰지도 않음.

---

## 6. BinPopup UI

### 6.1 시각 패턴

힌트 있을 때 — 힌트가 주소 위에서 primary, 주소가 secondary로 후퇴:

```
🗑️ 동일동 채화관 앞      [☆] [✓ 사용]
[일반][재활용]

주차장 끝 숨은 계단 아래, 제동어린이집 좌측  ← text-neutral-700, sm
서울 중구 명동길 12                          ← text-neutral-500, xs

관리: 중구청 · 02-1234-5678
```

힌트 없을 때 — 현 상태 유지:

```
🗑️ 동일동 채화관 앞      [☆] [✓ 사용]
[일반][재활용]

서울 중구 명동길 12       ← text-neutral-700, sm (변화 없음)
관리: ...
```

### 6.2 코드 패턴 (BinPopup.tsx)

기존 주소 렌더 블록을 다음으로 교체:

```tsx
{bin.locationHint ? (
  <>
    <div className="mt-2 text-neutral-700">{bin.locationHint}</div>
    {(bin.roadAddress || bin.jibunAddress) && (
      <div className="mt-1 text-xs text-neutral-500">
        {bin.roadAddress || bin.jibunAddress}
      </div>
    )}
  </>
) : (
  (bin.roadAddress || bin.jibunAddress) && (
    <div className="mt-2 text-neutral-700">
      {bin.roadAddress || bin.jibunAddress}
    </div>
  )
)}
```

`bin.detail`/`bin.manager` 블록은 변경 없음.

### 6.3 다크 모드

기존 popup은 leaflet 기본 흰 배경 위에 렌더 — `tile-theme-dark` wrapper의 영향을 받지 않음. 따라서 별도 다크 분기 불필요. **단, 시각 검증 단계에서 라이트/다크 양 타일에서 popup 가독성 확인 필수**.

---

## 7. 편집 워크플로

1. Mr. Song이 카카오맵·Naver 지도로 통 위치 시각 확인
2. `public/data/hints/<district>.json` 직접 편집 (없으면 새로 생성)
3. `git commit + push` → preview alias에서 즉시 검증 가능

**보조 도구는 YAGNI 보류**: `bun run hint:add <bin-id> "..."` 헬퍼 스크립트나 admin UI는 hint 볼륨이 50+ 넘어갈 때 재검토.

---

## 8. 시드 데이터

머지 PR에 **`public/data/hints/junggu.json` 5~10건** 동봉. 명동·남대문 시장 골목 케이스 우선. 코드 변경과 분리 가능 → Codex 위임 후보.

---

## 9. 테스트

### 9.1 단위 테스트 — `lib/hints.test.ts`

- `mergeHints(bins, {})` → bins 그대로 반환 (참조 동등성은 보장 안 하되 내용 일치)
- `mergeHints(bins, { 'JG-0001': '힌트1' })` → 해당 bin에 `locationHint` 주입, 나머지는 unchanged
- `mergeHints` 입력 변형 X (immutable)
- `fetchHints` mock fetch — 200 OK / 404 / network error 모두 안전하게 EMPTY 반환

### 9.2 빌드·린트

- `bun run build` 통과
- `bun run test` 전체 통과

### 9.3 시각 검증

새 snapshot `34-location-hint/` 4장:

- `popup-with-hint-light.png`
- `popup-with-hint-dark.png`
- `popup-without-hint-light.png` (회귀 방어)
- `popup-without-hint-dark.png` (회귀 방어)

---

## 10. 위험·미해결 이슈

### 10.1 [수용] 힌트 stale-ness — bin id 발번 불안정

`scripts/transform.ts`의 id 발번은 **lat/lng 정렬 후 순차 인덱스** (`<prefix>-<NNNN>`):

```ts
list.sort((a, b) => a.lat - b.lat || a.lng - b.lng);
list.forEach((b, i) => {
  b.id = `${prefix}-${String(i + 1).padStart(4, '0')}`;
});
```

→ 새 통이 정렬 위치 사이에 끼면 뒷 통 id가 한 칸씩 밀려 hint가 다른 통에 붙어버림.

**현 결정**: 수용. 이유:
- 공공 데이터 갱신 빈도 = 연 1회 정도
- 초기 hint 볼륨 작음 (수십 건)
- transform 재실행 시 hint 재키잉은 5~10분 수동 작업으로 충분

**미래 hardening (별도 task)**: stable id 도입 — 좌표 기반 hash 또는 명시적 id 필드. 하지만 이건 P4.3 scope 밖. hint 볼륨 50+ 또는 자동 transform CI가 굴러갈 때 재검토.

### 10.2 [수용] i18n 미지원

힌트는 한국어만. 영문 관광객 시나리오는 I.4 i18n 라운드 때 lang별 분기 필요. 지금 spec하지 않음.

### 10.3 [수용] 80자 권장만, 강제 X

힌트가 길면 popup 폭이 wrap으로 늘어나 모바일에서 어색. 80자 권장이지만 코드에서 강제하지 않음 — 운영자 자율. 너무 길어지면 시각 검증에서 잡힘.

### 10.4 [수용] hint 부재 시 주소 fallback

힌트 없을 때 placeholder 안 깔고 주소를 primary로. 빈 그릇 UI 안 만들어짐.

---

## 11. P2.22 worktree 충돌 점검

P2.22 worktree(`humming-wishing-backus`)가 동시에 건드리는 파일:

```
src/app/page.tsx · src/components/Map.tsx · FilterChips · LocateButton ·
ShareButton · src/app/layout.tsx · package.json · bun.lock ·
CHANGELOG.md · docs/tasks.md · docs/snapshots/README.md · 31~33/
```

P4.3가 건드리는 파일:

```
src/lib/types.ts (1줄 추가) · src/lib/hints.ts (신규) ·
src/lib/hints.test.ts (신규) · src/components/BinPopup.tsx ·
public/data/hints/* (신규) · src/app/page.tsx (fetch 통합 한 토막) ·
docs/tasks.md · CHANGELOG.md · docs/snapshots/34-location-hint/ (신규)
```

### 겹치는 영역

- **`page.tsx`** — P4.3는 fetch 시퀀스 한 토막만 수정. P2.22는 HUD/툴바 광범위. 코드 영역 분리 가능성 ↑이지만 머지 시점에 명시 점검 필요.
- **`CHANGELOG.md` / `docs/tasks.md`** — 텍스트 충돌. 수동 resolve 쉬움.
- **snapshots 번호** — P2.22가 31~33 사용 → P4.3는 **34부터 시작**해 충돌 회피.

### 결론

겹침 좁고 모두 텍스트 또는 잘 분리된 코드 영역. 충돌 발생 시 resolve 비용 낮음.

---

## 12. 분업 단위 (Codex 위임 후보)

| # | 단위 | 파일 | 의존 | Codex 위임 |
|---|---|---|---|---|
| **A** | 타입 + lib/hints | `lib/types.ts` (1줄), `lib/hints.ts` (신규), `lib/hints.test.ts` (신규) | 없음 | ✅ |
| **B** | BinPopup 변경 | `BinPopup.tsx` | A의 `locationHint?: string` 타입 합의만 필요 | ✅ A와 병렬 |
| **C** | 시드 데이터 | `public/data/hints/junggu.json` 5~10건 | 없음 (id만 알면 됨) | ✅ 가장 독립 |
| **D** | page.tsx 통합 | `page.tsx` (fetchHints 호출 + mergeHints + state) | A 완료 | ❌ 통합 단계, 직접 처리 |
| **E** | 문서·snapshot·CHANGELOG·tasks.md | 다수 | D 완료 | ❌ 머지 후 한 번에 |

A·B·C는 완전 병렬. 3개 Codex 백그라운드 동시 launch 가능.

D·E는 통합 단계 — main thread에서 직접 처리 (P2.22 머지 충돌 점검 필요).

---

## 13. 성공 기준 (검증 가능)

- [ ] `bun run build` 통과
- [ ] `bun run test` 통과 (신규 `hints.test.ts` 포함)
- [ ] preview URL에서 힌트 있는 통과 없는 통 popup 시각 회귀 없음 (snapshot 34)
- [ ] `public/data/hints/junggu.json` 5~10건 시드, 머지 후 production에서 표시 확인
- [ ] CHANGELOG `[Unreleased]` Added 한 줄, tasks.md P4.3 ✅ Done 이동
- [ ] hint 부재 자치구 (mapo, guro 등)에서도 popup 정상 (404 → 빈 객체 fallback 동작)

---

## 14. 다음 단계

이 spec 사용자 승인 → `superpowers:writing-plans` 스킬로 implementation plan 생성 → A·B·C Codex 백그라운드 dispatch (`Agent` tool, parallel) → D·E 직접 통합 → snapshot → commit → push → preview 검증 → main 머지 (`release:minor` 라벨).
