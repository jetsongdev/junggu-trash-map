---
name: trash-snapshot-commit
description: junggu-trash-map에서 snapshot 캡처가 끝난 직후 자동으로 commit + push + SHA 정합 + push까지 한 파이프라인으로 처리. 별도 사용자 확인 없이 진행. 글로벌 snapshot 스킬은 캡처와 meta/README 갱신까지 책임지고, 이 스킬이 그 산출물을 git에 올리는 마지막 한 마일을 담당. 사용자가 "/snapshot", "스냅샷", "캡처" 호출 후 자연스럽게 이어 트리거되며, snapshot 산출물(`docs/snapshots/NN-*/`)이 워크트리에 untracked 또는 modified 상태로 존재하는 시점에 자동 발사. PR/머지까지 가는 흐름이 아니라 snapshot만 git 위에 안정화하는 좁은 범위 — 그 다음 `trash-feature-merge-flow` 또는 사용자 후속 지시로 이어짐.
---

# trash-snapshot-commit

snapshot 캡처가 끝난 직후 git 위로 안정화하는 마지막 두 commit을 자동으로 묶는다.

## 왜

`snapshot` 스킬은 캡처·meta·README 갱신까지만 한다 (글로벌 스킬이라 git 커밋은 보수적으로 사용자 명시 요청 시에만). junggu-trash-map은 `meta.md`의 `git_sha` 필드 정합 규칙이 박혀있어, snapshot이 들어간 commit과 별개로 한 번 더 commit이 필요하다 (CLAUDE.md의 「snapshot SHA 정합」). 사용자가 매번 두 commit을 손으로 트리거하면 잊기 쉽고, 다른 작업 흐름 사이에 끼면 더 그렇다. 이 스킬이 한 파이프라인으로 묶어 「캡처 → 안정화」를 사용자 입력 한 번으로 처리한다.

## 언제 자동 발사

- `/snapshot` 또는 글로벌 snapshot 스킬 호출 직후, `docs/snapshots/NN-*/` 산출물이 staging 안 된 상태로 존재
- 사용자 발화에 "스냅샷 + 커밋", "캡처 후 커밋", "스냅샷 마무리"가 보일 때
- 본 세션에서 직전에 캡처를 마쳤고 사용자가 다음 단계로 넘어갈 신호 (예: 다른 작업 시작 발화)를 보낼 때

`trash-feature-merge-flow`가 이미 돌고 있는 흐름의 일부라면 이 스킬은 따로 invoke할 필요 X — 그 안의 5+6단계가 같은 일을 한다.

## 전제

이 스킬 실행 시점에 워크트리는 다음 상태여야 한다:
- 캡처 완료된 `docs/snapshots/NN-slug/screenshot*.png` (1장 이상)
- `docs/snapshots/NN-slug/meta.md` (frontmatter `git_sha:` 포함)
- `docs/snapshots/README.md` 인덱스 행 추가

위 셋 중 하나라도 빠지면 즉시 중단하고 사용자에게 보고. 캡처 자체가 망가졌을 가능성이 높음.

## 절차

### 1. 산출물 검증

```bash
NN_SLUG=$(ls docs/snapshots | grep -E '^[0-9]{2}-' | sort -n | tail -1)  # 가장 최근
test -f "docs/snapshots/$NN_SLUG/meta.md" || exit 1
ls "docs/snapshots/$NN_SLUG"/screenshot*.png > /dev/null 2>&1 || exit 1
git diff --name-only docs/snapshots/README.md | grep -q . || \
  git status --porcelain docs/snapshots/README.md | grep -q . || exit 1
```

검증 실패 시 사용자에게 **무엇이 빠졌는지** 보고하고 멈춤. 자동 재캡처 시도 X.

### 2. 1차 commit (snapshot 본체)

```bash
git add docs/snapshots/$NN_SLUG docs/snapshots/README.md
git commit -m "docs: snapshot $NN — <slug-or-title>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

commit message는 meta.md frontmatter의 `# {NN} — {제목}` 첫 줄에서 추출. `git_sha`는 이 시점에 캡처 시점의 parent SHA로 박혀있으므로 다음 단계가 필요.

### 3. push

```bash
git push origin $(git branch --show-current)
```

push 실패 (`gone`/`fetch first`/`non-fast-forward`)면 fetch + rebase 후 재시도. rebase 충돌 발생 시 사용자에게 보고.

### 4. SHA 정합 — meta.md 업데이트

```bash
NEW_SHA=$(git rev-parse --short HEAD)
# meta.md 의 'git_sha:' 줄을 NEW_SHA 로 갱신 (Edit 도구 사용)
# "git_sha: <old> (dirty|clean)" → "git_sha: <NEW_SHA>"
```

기존 `(dirty)` 표기가 있으면 같이 제거. clean 표기는 유지.

### 5. 2차 commit + push

```bash
git add docs/snapshots/$NN_SLUG/meta.md
git commit -m "docs: snapshot $NN SHA 정합

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin $(git branch --show-current)
```

### 6. 사용자에게 결과 보고

- 두 commit SHA + 메시지
- branch preview URL (`https://junggu-trash-map-git-<branch-slug>-jetsongdev.vercel.app`)
- snapshot 폴더와 캡처 수
- 다음 후보 단계: PR 생성 / Lighthouse watch / 머지 — 사용자 의사 묻기

## 함정

- **dev 서버가 아직 떠있음** — 캡처에 사용한 `bun run dev` 백그라운드 프로세스를 끄고 시작. 안 끄면 다음 작업에서 포트 충돌.
- **`docs/snapshots/README.md` 인덱스 행 누락** — 글로벌 snapshot 스킬이 갱신해야 하는데 빠졌을 수 있음. 1단계 검증에서 잡아야 함.
- **meta.md 본문이 비어있음** — frontmatter만 있고 캡처 의미가 없는 meta. 캡처 자체가 미완성. 검증에서 막을 것.
- **SHA 정합 commit message 일관성** — `docs: snapshot NN SHA 정합` 정확히 (다른 표기 쓰면 git log grep이 어그러짐). 다른 commit과 합치지 말 것.
- **본 세션이 별도 Agent task 띄운 상태** — `trash-feature-merge-flow` 1b단계와 같음. commit이 잘못된 브랜치에 들어갈 수 있으니 의심되면 워크트리 격리.
- **워크트리 부트스트랩 누락 (`bun install`)** — 빌드 안 돌려도 push만 하면 통과되지만, push 후 Vercel 빌드가 깨짐. 1단계 검증에 `bun run build` 한 번 포함하는 걸 권장.

## 변형 — snapshot 산출물이 commit 직후 발견된 경우

snapshot이 다른 코드 commit과 같은 `git status` 안에 섞여 있으면 (예: feature 코드 + snapshot이 한 번에 staged), 이 스킬은 **snapshot 파일만 따로 떼어내지 않고** trash-feature-merge-flow에 위임. 이 스킬은 snapshot이 단독 변경인 경우만 책임.

## 글로벌 `snapshot` 스킬과의 분담

| 책임 | snapshot (글로벌) | trash-snapshot-commit (이 스킬) |
|------|------------------|------------------------------|
| 다음 NN 계산 | ✅ | — |
| dev 서버 띄우기 | ✅ | — |
| Playwright 캡처 | ✅ | — |
| meta.md 작성 | ✅ | — |
| README.md 인덱스 행 추가 | ✅ | — |
| git add / commit | — | ✅ |
| push | — | ✅ |
| SHA 정합 update | — | ✅ |
| SHA 정합 commit / push | — | ✅ |

이 분담을 깨뜨리면 글로벌 snapshot이 다른 프로젝트에서 제대로 안 작동할 수 있음. 글로벌 스킬은 git 커밋을 사용자 명시 요청 시에만 한다는 규칙을 유지.
