---
captured: 2026-05-09
topic: Kakao 개발자 앱 멀티 앱 환경에서 카카오맵 활성화 막힘
series-candidate: 3-lab (정글 실험실)
project: junggu-trash-map
---

# Kakao 개발자 앱 — 기존 앱이 있으면 신규 앱 카카오맵 활성화가 막히는 함정

## 현장 메모

side project `junggu-trash-map`의 hint scan 스크립트(`scripts/hint-scan.ts`)에서 휴지통 좌표 주변 POI를 자동으로 가져오려고 Kakao Local API를 도입. developers.kakao.com에서 새 앱 `junggu-trash-map` 생성 → REST API 키 발급 → `Authorization: KakaoAK <key>` 호출 시:

```
{
  "errorType": "NotAuthorizedError",
  "message": "App(junggu-trash-map) disabled OPEN_MAP_AND_LOCAL service."
}
```

한참 헤매다 devtalk에서 같은 사례 발견: https://devtalk.kakao.com/t/on/149625

**원인**: 한 카카오 계정 안에서 이미 카카오맵 product를 쓰는 앱이 있으면, 신규 앱에서는 카카오맵 활성화 토글 자체가 비활성화 상태. 정책 의도는 "한 사용자 = 한 앱이 카카오맵 사용"인 듯.

**우회**:
- 가장 빠름: 기존 카카오맵 활성 앱에서 새 키 발급해서 사용
- 근본: side project용 별도 카카오 계정 만들어 분리
- 정공법: 정책 변경 요청은 답이 느릴 가능성

발급·도메인 등록·플랫폼 셋업 흐름은 정상이지만 product 활성화 단계에서만 이 함정이 있음. 공식 문서엔 명시 안 됨 — 포럼이 1차 정보 출처.

## 핵심 키워드 / 코드 흔적

- 시점: 2026-05-09
- 관련 commit: `a38125c` (scripts/hint-scan.ts 추가)
- 사용한 endpoint: `/v2/local/search/category.json` (반경 50m 카테고리 검색)
- 선택한 카테고리: AT4(관광명소) · SW8(지하철역) · BK9(은행) · PK6(주차장) · CS2(편의점)

## 다음 단계

- [x] jetsong-dev 아이디어 등록됨: `3-lab/2026-05-09-kakao-map-multi-app-issue.md`
- [ ] 초안 작성 시 이 파일 + devtalk 스레드 인용
- [ ] 가능하면 카카오 정책 페이지에서 공식 문구 인용 가능한지 확인
