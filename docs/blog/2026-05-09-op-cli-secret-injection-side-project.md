---
captured: 2026-05-09
topic: 1Password CLI(op read)로 side project secret 인라인 주입
series-candidate: 3-lab (정글 실험실)
project: junggu-trash-map
---

# side project 비밀 관리 — `.env.local` 안 쓰고 1Password CLI `op read` 한 줄로

## 현장 메모

`junggu-trash-map`의 `scripts/hint-scan.ts`가 Kakao REST API 키를 환경변수로 받음. 보통 패턴이라면 `.env.local`에 박고 dotenv-cli로 로드 — 그런데 side project 키 1개 때문에 `.env.local` + `.env.example` + gitignore 룰 + 동기화 부담을 굳이 끌어들이고 싶지 않음.

해결: 1Password CLI(`op`)의 `op read` 한 줄.

```bash
# inline 1회 호출
KAKAO_REST_API_KEY=$(op read 'op://side-project/kakao-developers/TRASH_KAKAO_REST_API_KEY') \
  bun scripts/hint-scan.ts junggu
```

스크립트 입장에선 그냥 `process.env.KAKAO_REST_API_KEY` 한 줄 — `op`에 대한 의존성 0. 셋업 파일 0. gitignore 룰 0.

**발견한 함정**: 매 명령마다 biometric prompt(Touch ID)가 뜸. 짧은 명령은 OK인데, 295 requests를 throttle하면서 ~15초 도는 hint:scan은 도중에 prompt 떠서 dismiss 당하면 키가 빈 문자열로 들어가 fail. 우회:

```bash
# 한 번 export 후 캐시 사용
export KAKAO_REST_API_KEY=$(op read 'op://side-project/kakao-developers/TRASH_KAKAO_REST_API_KEY')
bun scripts/hint-scan.ts junggu
```

`op` 세션은 일정 시간 유지되니, 같은 셸에서 여러 명령 돌리면 첫 prompt 후 한동안 추가 prompt 없음.

## 핵심 키워드 / 코드 흔적

- 시점: 2026-05-09
- 관련 commit: `a38125c`
- 1Password vault 구조: `side-project` vault에 카카오·기타 키 분류
- field 이름 규칙: `<PROJECT>_<SERVICE>_API_KEY` (e.g., `TRASH_KAKAO_REST_API_KEY`) — 환경변수와 1:1 매핑되도록

## 다음 단계

- [x] jetsong-dev 아이디어 등록됨: `3-lab/2026-05-09-op-cli-secret-injection-side-project.md`
- [ ] 초안 작성 시 dotenv-cli vs op CLI 비교 표 그릴 것
- [ ] CI/CD(Vercel·GitHub Actions)에서는 어떻게 다른지 후속 글로 분리
