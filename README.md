# Transparent Crowdfund Full Integrated

## 포함 구성

- `contracts`: Solidity 0.8.24 + Hardhat + OpenZeppelin
- `backend`: NestJS + Prisma + PostgreSQL + Google/Kakao OAuth + JWT + 블록체인 상태 동기화
- `frontend`: Next.js 16 + React 19 + Tailwind CSS 4 + ethers.js + MetaMask + UI 개선 버전

## 핵심 기능

- Google/Kakao OAuth 로그인
- 로그인하지 않은 사용자의 프로젝트 등록 차단
- 회원만 게시글 작성 가능
- 작성자 본인만 게시글 수정/삭제 가능
- MetaMask 지갑 연결
- 프로젝트 등록 시 마일스톤과 후원 옵션 등록
- 후원자가 직접 금액을 입력하지 않고 후원 옵션 중 하나만 선택
- 백엔드 후원 권한 서명 + 컨트랙트 `pledgeOptionWithAuth()` 검증
- 후원금 스마트 컨트랙트 에스크로 보관
- 마일스톤 증빙 제출, 후원자 투표, 조건부 자금 집행
- 프로젝트 목록/상세 UI 개선, 펀딩 대시보드, Web3 체크리스트, 마일스톤 타임라인

