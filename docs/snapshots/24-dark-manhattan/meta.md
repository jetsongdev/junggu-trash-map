---
name: dark-manhattan
title: "🌑📐 다크 + 격자 — CartoDB Dark Matter + L자 점선"
index: 24
date: 2026-05-04
phase: P2.x (시각 다양성 누적)
git_sha: c59564b0ae739293a3bf113abd3e2f8c0d5f37c5
viewport: 390x844
---

## 이 시점에 보이는 것

- 다크 타일(CartoDB Dark Matter) + 격자(Manhattan) 거리 모드
- URL `?origin=37.5635,126.987&theme=dark&mode=manhattan` 로 진입
- 격자 칩 amber 활성, 다크 칩 비활성(neutral-800)
- 점선이 L자 직각 경로로 그려짐 — 다크 배경에서 sky/cyan 라인 콘트라스트 큼
- Top-3 후보(보라 calc) + 주황 ring + 비후보 dimmed

## 끝난 것

다크 + 격자 조합 — 야간/지하철/밝은 햇빛 환경에서 지도 가독성 + 격자 거리의 보행 정확도를 함께 잡는 조합. snapshot 07(라이트+격자), 08~10(다크 단독), 22(라이트+직선)와 함께 4가지 visual mode 조합 모두 기록 완성.

## 다음 것

P2.14 즐겨찾기/최근 휴지통 구현.
