# GitHub Actions `deployment_status` 워크플로는 deployed SHA의 트리에서 실행

**일자**: 2026-05-05
**프로젝트**: junggu-trash-map
**관련 작업**: chore: telegram preview/production deploy notify

## 문제

Vercel preview 배포 시 Telegram으로 URL을 push하는 워크플로를 chore 브랜치에서 만들었다. 머지 전 chore 브랜치 자체 preview에서도 알림이 와야 검증할 수 있다고 가정 — 그런데 GH Actions 문서에 "deployment_status uses default branch" 비슷한 내용을 본 기억 때문에, "main에 머지 안 된 워크플로는 발사 안 될 텐데?"라고 의심했다.

## 진단

실제로 chore 브랜치 push 후 preview 배포가 끝나니 **워크플로가 정상 발사**됐다. 결과적으로 다음이 사실:

| 트리거 | 워크플로우 파일 source | 비고 |
|---|---|---|
| `push`, `pull_request` | head ref의 트리 | 일반 케이스 |
| `workflow_dispatch` | 선택한 ref의 트리 | UI에서 명시 |
| `schedule` | default branch (main) | cron은 main 고정 |
| **`deployment_status`** | **deployed SHA의 트리** | head ref 아니고 deployment.sha 기준 |

즉 "Vercel이 SHA X를 배포 → deployment_status fire → GH Actions가 X의 워크트리에서 워크플로 파일을 골라 실행"이라 chore 브랜치의 SHA가 배포되면 그 SHA에 있는 워크플로 파일이 사용됨.

이 사실 덕분에 머지 전 검증 가능. 다만 `schedule`처럼 default branch만 보는 트리거랑 헷갈리지 말 것.

## 해결

검증 흐름이 단순해졌다:

1. chore 브랜치에 워크플로 파일 commit + push
2. Vercel이 chore preview 배포
3. deployment_status fire → 그 SHA에 있는 워크플로 사용
4. Telegram에 메시지 도착 → 형식 검증
5. OK 후 main 머지

만약 default branch만 봤다면 이 흐름이 막히고 머지부터 해야 하는 닭-알 문제가 생겼을 것 (지난번 첫 워크플로 도입 때 `pull_request` 필터에서 겪은 케이스 — [TIL 참고](./2026-05-04-github-actions-first-workflow-bootstrap.md)).

## 교훈

- **트리거별로 워크플로 파일 source가 다르다**. `pull_request`/`push`는 head ref, `schedule`은 main, `deployment_status`는 deployed SHA. 머지 전 dry-run 가능 여부가 갈림
- **첫 도입 시 검증은 트리거 종류에 따라 다르게 설계**. PR 트리거면 main 먼저 머지 + workflow_dispatch escape hatch 필요. deployment_status 트리거면 chore 브랜치 자체 preview에서 검증 가능
- 의심스러운 트리거는 GitHub docs의 "GITHUB_REF" 컬럼 표를 보면 명확

## 김동현 원펀치

**deployment_status는 deployed SHA의 워크플로를 쓴다**. 머지 전 chore 브랜치 자체 preview에서 알림 형식 검증 가능 — 첫 도입 시 닭-알 문제 회피.
