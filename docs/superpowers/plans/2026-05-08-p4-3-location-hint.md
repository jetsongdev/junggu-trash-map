# P4.3 위치 힌트 텍스트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BinPopup에 운영자 큐레이션 위치 힌트 텍스트(`locationHint?: string`)를 표시. `public/data/hints/<district>.json` 별도 파일에서 자치구별 lazy fetch + runtime 머지.

**Architecture:** 힌트는 `transform.ts`가 다루는 district JSON에서 격리된 별도 파일로 관리. `lib/hints.ts`가 fetch + 머지 두 순수 함수를 노출하고, `page.tsx`가 기존 fetchDistrict와 병렬 호출 후 머지. BinPopup은 hint 있을 때 주소를 secondary로 후퇴시키는 분기 패턴.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Vitest · Tailwind v4 · Bun.

**Spec:** `docs/superpowers/specs/2026-05-08-p4-3-location-hint-design.md`

**Worktree/Branch:** `.claude/worktrees/shimmering-snacking-porcupine` on `feat/p4.3-location-hint`

**Parallelization:** Task A·B·C 완전 병렬 가능 (서로 다른 파일, 의존성 없음). Codex 백그라운드 분업 후보. Task D·E는 통합 단계로 순차.

---

## File Structure

| 파일 | 역할 | 변경 |
|---|---|---|
| `src/lib/types.ts` | TrashBin 타입 | `locationHint?: string` 한 줄 추가 |
| `src/lib/hints.ts` | hints fetch + merge 순수 함수 | **신규** |
| `src/lib/hints.test.ts` | hints 모듈 단위 테스트 | **신규** |
| `src/components/BinPopup.tsx` | popup 렌더 | 주소 블록 분기 교체 |
| `src/app/page.tsx` | district 로딩 시퀀스 | fetchHints + mergeHints 통합 (3 위치) |
| `public/data/hints/junggu.json` | 중구 시드 힌트 5~10건 | **신규** |
| `docs/snapshots/34-location-hint/` | 시각 회귀 snapshot 4장 | **신규** |
| `docs/tasks.md` | P4.3 ✅ Done 이동 + 함정 메모 | 수정 |
| `CHANGELOG.md` | `[Unreleased]` Added 한 줄 | 수정 |

---

## Task A: 타입 + lib/hints (Codex 위임 가능)

**Files:**
- Modify: `src/lib/types.ts:5-19` (TrashBin type 한 줄 추가)
- Create: `src/lib/hints.ts`
- Create: `src/lib/hints.test.ts`

**의존:** 없음. B·C와 병렬.

- [ ] **Step A.1: TrashBin 타입에 `locationHint?: string` 추가**

`src/lib/types.ts`를 수정:

```ts
export type TrashBin = {
  id: string;
  name: string;
  sido: string;
  sigungu: string;
  roadAddress: string;
  jibunAddress?: string;
  lat: number;
  lng: number;
  detail?: string;
  types: BinType[];
  manager?: string;
  managerTel?: string;
  updatedAt: string;
  locationHint?: string;
};
```

`locationHint`는 runtime에서만 주입. `scripts/transform.ts`는 이 필드를 읽지도 쓰지도 않음.

- [ ] **Step A.2: hints 테스트 파일 작성 (먼저)**

`src/lib/hints.test.ts` 신규:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHints, mergeHints } from './hints';
import type { TrashBin } from './types';

const sampleBins: TrashBin[] = [
  {
    id: 'JG-0001',
    name: '명동성당 앞',
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '서울 중구 명동길 12',
    lat: 37.5634,
    lng: 126.9871,
    types: ['일반'],
    updatedAt: '2026-04-14',
  },
  {
    id: 'JG-0002',
    name: '남대문 시장 앞',
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '서울 중구 남대문시장4길 1',
    lat: 37.5598,
    lng: 126.9785,
    types: ['일반', '재활용'],
    updatedAt: '2026-04-14',
  },
];

describe('mergeHints', () => {
  it('hints가 빈 객체면 bins를 그대로 반환', () => {
    const result = mergeHints(sampleBins, {});
    expect(result).toHaveLength(2);
    expect(result[0].locationHint).toBeUndefined();
    expect(result[1].locationHint).toBeUndefined();
  });

  it('해당 id의 bin에만 locationHint 주입', () => {
    const hints = { 'JG-0001': '명동성당 정문 좌측 5m' };
    const result = mergeHints(sampleBins, hints);
    expect(result[0].locationHint).toBe('명동성당 정문 좌측 5m');
    expect(result[1].locationHint).toBeUndefined();
  });

  it('여러 hint를 동시에 주입', () => {
    const hints = {
      'JG-0001': '힌트1',
      'JG-0002': '힌트2',
    };
    const result = mergeHints(sampleBins, hints);
    expect(result[0].locationHint).toBe('힌트1');
    expect(result[1].locationHint).toBe('힌트2');
  });

  it('매칭 안 되는 hint id는 무시', () => {
    const hints = { 'XX-9999': '존재하지 않는 통' };
    const result = mergeHints(sampleBins, hints);
    expect(result[0].locationHint).toBeUndefined();
    expect(result[1].locationHint).toBeUndefined();
  });

  it('입력 bins 배열을 mutate하지 않음', () => {
    const hints = { 'JG-0001': '힌트1' };
    const before = JSON.stringify(sampleBins);
    mergeHints(sampleBins, hints);
    expect(JSON.stringify(sampleBins)).toBe(before);
  });
});

describe('fetchHints', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('200 OK면 파싱 결과 반환', async () => {
    const payload = {
      version: '2026-05-08',
      hints: { 'JG-0001': '힌트1' },
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });
    const result = await fetchHints('junggu');
    expect(result).toEqual(payload);
  });

  it('404면 EMPTY 반환', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });
    const result = await fetchHints('mapo');
    expect(result).toEqual({ version: '', hints: {} });
  });

  it('네트워크 에러면 EMPTY 반환', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network down'),
    );
    const result = await fetchHints('guro');
    expect(result).toEqual({ version: '', hints: {} });
  });
});
```

- [ ] **Step A.3: 테스트 실행해서 실패 확인**

```bash
bun run test src/lib/hints.test.ts
```

Expected: FAIL — `Cannot find module './hints'`.

- [ ] **Step A.4: hints 모듈 구현**

`src/lib/hints.ts` 신규:

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

- [ ] **Step A.5: 테스트 통과 확인**

```bash
bun run test src/lib/hints.test.ts
```

Expected: PASS — 8 tests.

- [ ] **Step A.6: 전체 테스트 + 빌드 확인**

```bash
bun run test
bun run build
```

Expected: 모든 테스트 PASS, build 통과.

- [ ] **Step A.7: 커밋**

```bash
git add src/lib/types.ts src/lib/hints.ts src/lib/hints.test.ts
git commit -m "feat(P4.3): TrashBin.locationHint + lib/hints fetch·merge 함수

별도 hints/<district>.json 파일을 자치구별 lazy fetch하고 bin id 기준
runtime 머지. transform.ts는 이 필드를 읽지도 쓰지도 않음.

- mergeHints: 순수 immutable 머지
- fetchHints: 404/네트워크 에러 시 EMPTY fallback
- vitest 8 케이스 (mergeHints 5 + fetchHints 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task B: BinPopup UI 변경 (Codex 위임 가능)

**Files:**
- Modify: `src/components/BinPopup.tsx:77-80` (주소 렌더 블록 교체)

**의존:** Task A의 `locationHint?: string` 타입만 합의되면 됨. 실제로는 A 미완성이어도 type 추가 가정 하에 동시 작업 가능. 머지 시 conflict 없음 (같은 줄 안 건드림).

- [ ] **Step B.1: BinPopup의 주소 블록 분기로 교체**

`src/components/BinPopup.tsx` 라인 77-80을 다음으로 교체:

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

`bin.detail`/`bin.manager` 블록(라인 80~86)은 변경 없음.

- [ ] **Step B.2: 빌드 확인**

```bash
bun run build
```

Expected: 통과 (locationHint optional이라 type 호환).

- [ ] **Step B.3: 커밋**

```bash
git add src/components/BinPopup.tsx
git commit -m "feat(P4.3): BinPopup에 locationHint 표시 — 주소 위 primary

힌트 있을 때:
- 힌트가 주소 자리 위로 올라가 primary (text-neutral-700, sm)
- 주소는 아래 secondary로 후퇴 (text-neutral-500, xs)

힌트 없을 때:
- 현 상태 유지 (주소가 primary)

bin.detail/bin.manager 블록 변경 없음.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task C: 시드 힌트 데이터 (Codex 위임 가능)

**Files:**
- Create: `public/data/hints/junggu.json`

**의존:** 없음. bin id는 `public/data/districts/junggu.json` 보면 됨.

- [ ] **Step C.1: 중구 bin id 5~10개 식별**

`public/data/districts/junggu.json`을 읽어 명동·남대문·인사동·시청 부근 골목 안쪽 케이스에 해당하는 bin 5~10개를 골라 id 메모. 통의 `roadAddress`·`name`·`detail` 보고 카카오맵으로 위치 시각 확인 후 한 줄 힌트 작성.

- [ ] **Step C.2: hints/junggu.json 작성**

`public/data/hints/junggu.json` 신규 (예시 구조 — 실제 id/문구는 Step C.1 결과로 채움):

```json
{
  "version": "2026-05-08",
  "hints": {
    "JG-0007": "남대문시장 4번 입구 골목 안쪽 5m",
    "JG-0012": "주차장 끝 숨은 계단 아래, 어린이집 좌측",
    "JG-0023": "명동길 골목 진입 후 우측 첫 코너",
    "JG-0031": "인사동 안쪽 골목 한복집 옆",
    "JG-0045": "을지로입구역 5번 출구 뒤편 좁은 골목"
  }
}
```

- 5~10건 (실제 통 위치에 맞게 조정)
- 각 힌트 ≤80자 권장
- 자연어, 사용자가 골목 진입 시 즉시 검증 가능한 표현

- [ ] **Step C.3: JSON 유효성 + 파일 위치 확인**

```bash
cat public/data/hints/junggu.json | jq .
ls -la public/data/hints/
```

Expected: jq 파싱 성공, 파일 존재.

- [ ] **Step C.4: 커밋**

```bash
git add public/data/hints/junggu.json
git commit -m "data(P4.3): 중구 위치 힌트 시드 5~10건

명동·남대문·인사동 골목 안쪽·간판 사각지대 통에 한 줄 힌트.
운영자(Mr. Song) 카카오맵 시각 확인 기반 큐레이션.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task D: page.tsx 통합 (직접 처리)

**Files:**
- Modify: `src/app/page.tsx` (fetchDistrict 호출 부근 3곳에 fetchHints + mergeHints 통합)

**의존:** Task A 완료 (hints 모듈 존재).

**중요:** P2.22 worktree(`humming-wishing-backus`)가 page.tsx 광범위 수정 중. 이 task 시작 전 P2.22 진행 상황 점검하고 충돌 영역 최소화 방향으로 패치.

- [ ] **Step D.1: page.tsx에서 fetchDistrict 호출 위치 식별**

```bash
grep -n "fetchDistrict" src/app/page.tsx
```

세 위치:
1. 부트 시퀀스 (mount 시 default district 로드)
2. panning trigger (지도 center 변경 시 새 자치구 fetch)
3. prefetch 루프 (idle 시 populated 자치구 일괄 fetch)

- [ ] **Step D.2: hints import 추가**

`src/app/page.tsx` 상단 import 블록에 추가:

```ts
import { fetchHints, mergeHints } from '@/lib/hints';
```

- [ ] **Step D.3: 세 호출 위치 모두 Promise.all + mergeHints 패턴으로 변경**

각 호출 위치에서 다음 패턴으로:

```ts
const [district, hintsFile] = await Promise.all([
  fetchDistrict(code),
  fetchHints(code),
]);
const mergedBins = mergeHints(district.bins, hintsFile.hints);
// 기존: districtsCacheRef.current.set(code, district)
// 변경: districtsCacheRef.current.set(code, { ...district, bins: mergedBins })
```

3개 위치 모두 동일 패턴 적용.

- [ ] **Step D.4: 빌드 + 테스트 통과 확인**

```bash
bun run build
bun run test
```

Expected: 통과.

- [ ] **Step D.5: dev 서버 띄워서 시각 확인**

```bash
PORT=3010 bun run dev
```

http://localhost:3010 열어서:
- 중구 통 popup 클릭 → 시드 hint 있는 통은 hint primary, 없는 통은 주소 primary
- 다른 자치구(예: 마포) panning → hints/mapo.json 없어서 404 → 모든 popup 주소 primary (회귀 없음)
- 콘솔 에러 없음

- [ ] **Step D.6: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat(P4.3): page.tsx district 로드 시퀀스에 hints 병렬 fetch + 머지

부트/panning/idle prefetch 3곳 모두 Promise.all([fetchDistrict, fetchHints])
패턴으로 통일. 머지된 bins를 districtsCache에 저장.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task E: 시각 검증 + 문서

**Files:**
- Create: `docs/snapshots/34-location-hint/` (4 PNG + meta.md)
- Modify: `docs/tasks.md` (P4.3 ✅ Done 이동, 함정 메모 잠재 업데이트)
- Modify: `CHANGELOG.md` (`[Unreleased]` Added 한 줄)

**의존:** Task A·B·C·D 완료.

- [ ] **Step E.1: snapshot 캡처**

`/snapshot` 스킬 호출 — 이름 `34-location-hint`, 4장 캡처:

1. `popup-with-hint-light.png` — 힌트 있는 통 popup (라이트 타일)
2. `popup-with-hint-dark.png` — 힌트 있는 통 popup (다크 타일)
3. `popup-without-hint-light.png` — 힌트 없는 통 popup (라이트, 회귀 방어)
4. `popup-without-hint-dark.png` — 힌트 없는 통 popup (다크, 회귀 방어)

- [ ] **Step E.2: docs/tasks.md 업데이트**

`docs/tasks.md`:

1. Phase 4 P4.3 항목을 ✅ Done으로 이동, 한 줄 요약:
   ```
   - [x] **P4.3** 위치 힌트 텍스트 — 사진 원안 폐기, 운영자 큐레이션 한 줄 힌트로 재정의. `public/data/hints/<district>.json` 별도 파일 + lazy fetch + runtime 머지. BinPopup은 hint 있으면 주소 위 primary. 중구 시드 5~10건. 위험 (transform 순차 id로 인한 stale-ness) 수용.
   ```
2. 「현재 상태」의 Phase 라인 갱신 — P4.3 머지 반영
3. 「함정 메모」에 다음 한 줄 추가 (있으면):
   ```
   - **transform.ts id 발번은 좌표 정렬 후 순차** → 새 통이 중간에 끼면 뒷 통 id 한 칸씩 밀려 hint orphan. 연 1회 빈도라 수동 재키잉 OK이지만, hint 50+ 또는 자동 transform CI 시 stable id 리팩터 필요.
   ```

- [ ] **Step E.3: CHANGELOG.md `[Unreleased]` 갱신**

`CHANGELOG.md`의 `[Unreleased]` 아래 `### Added`에 한 줄:

```markdown
- 휴지통 popup에 운영자 큐레이션 위치 힌트 표시 (P4.3). 힌트가 있는 통은 주소 위에 골목 안쪽 진입 가이드가 한 줄 뜸. 중구 5~10건 시드 — 다른 자치구는 운영자가 점진적 추가.
```

- [ ] **Step E.4: 빌드·테스트 최종 확인**

```bash
bun run build
bun run test
```

Expected: 통과.

- [ ] **Step E.5: 커밋 + push**

```bash
git add docs/snapshots/34-location-hint docs/tasks.md CHANGELOG.md
git commit -m "docs(P4.3): snapshot 34 + tasks.md + CHANGELOG 갱신

- 위치 힌트 popup 회귀 snapshot 4장 (light·dark × hint 있음·없음)
- tasks.md P4.3 ✅ Done, transform 순차 id 함정 메모 추가
- CHANGELOG [Unreleased] Added 한 줄

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"

git push -u origin feat/p4.3-location-hint
```

- [ ] **Step E.6: snapshot SHA 정합 commit**

snapshot meta.md의 `git_sha`가 capture 시점 parent HEAD라 위 commit 직후 새 SHA로 갱신.

```bash
NEW_SHA=$(git rev-parse HEAD)
# meta.md의 git_sha 라인을 NEW_SHA로 교체 후
git add docs/snapshots/34-location-hint/meta.md
git commit -m "docs: snapshot 34 SHA 정합"
git push
```

- [ ] **Step E.7: PR 생성 + release:minor 라벨**

```bash
gh pr create --base main --title "feat(P4.3): 휴지통 popup 위치 힌트 텍스트" --body "$(cat <<'EOF'
## Summary

- P4.3 원안(사진 1장)을 운영자 큐레이션 한 줄 위치 힌트 텍스트로 재정의 (브레인스토밍 결과)
- 새 모듈 lib/hints.ts + 별도 public/data/hints/<district>.json 저장
- BinPopup: 힌트 있으면 주소 위 primary, 없으면 현 상태 유지
- 중구 시드 5~10건 동봉

## Test plan

- [ ] preview에서 시드 hint 있는 통 popup 시각 확인 (라이트/다크)
- [ ] hint 없는 자치구(마포·구로 등) panning 시 회귀 없음
- [ ] Lighthouse CI 게이트 통과

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

gh pr edit <num> --add-label release:minor
```

---

## Self-Review

**Spec coverage:**
- §1 재정의 → README/CHANGELOG에 반영 (Task E.3)
- §2 Goals/Non-Goals → 코드에 반영 (i18n·moderation 미구현)
- §3 데이터 아키텍처 → Task A.4 (fetchHints), Task C (시드)
- §4 로딩·머지 → Task A.4 (모듈), Task D (page.tsx 통합)
- §5 타입 변경 → Task A.1
- §6 BinPopup UI → Task B
- §7 편집 워크플로 → 코드 변경 없음, README나 spec에 보존
- §8 시드 데이터 → Task C
- §9 테스트 → Task A.2~A.5, Task E.1 (snapshot)
- §10 위험 → Task E.2 함정 메모
- §11 P2.22 충돌 점검 → Task D 시작 시 명시
- §12 분업 단위 → 본 plan의 Task 구조에 반영
- §13 성공 기준 → Task D.4·D.5, E.4

**Placeholder scan:** 없음. 모든 step에 실제 코드/명령/예상 출력 포함.

**Type consistency:**
- `TrashBin.locationHint?: string` — A.1 정의, A.2 테스트, A.4 사용, B.1 사용
- `mergeHints(bins, hints)` — A.4 정의, D.3 사용
- `fetchHints(code)` — A.4 정의, D.3 사용
- `DistrictHints` — A.4 정의, A.2 expected 형태와 일치

---

## Execution Handoff

**1. Subagent-Driven (recommended)** — fresh subagent per task + 두 단계 review. 추가 비용은 있지만 task 간 독립성 확보.

**2. Inline Execution** — 현 세션에서 batch 실행 + 체크포인트 review.

**대안: Codex 분업** — Spec §12에서 식별한대로 Task A·B·C는 Codex 백그라운드 작업자에게 동시 dispatch (`codex:rescue` 또는 `Agent` tool with `codex:codex-rescue` subagent), Task D·E는 main thread에서 직접 처리.

이 plan은 사용자가 "Codex 분업" 명시 의향을 밝힌 상태라 그쪽이 디폴트.
