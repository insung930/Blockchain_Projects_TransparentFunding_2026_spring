# Transparent Crowdfund Full Integrated

블록체인 기반 투명 크라우드 펀딩 웹서비스 전체 통합본입니다.

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



## 이번 완성본에서 추가 해결된 사항

- 공개 프로젝트 목록 `GET /projects`는 `DRAFT` 상태와 컨트랙트 미연결 프로젝트를 노출하지 않습니다.
- 본인이 작성 중인 프로젝트는 `/my-projects`에서만 확인할 수 있습니다.
- 프로젝트 생성 시 백엔드 `Project.userId`에 로그인 회원 ID가 저장됩니다.
- `GET /projects/mine`으로 본인이 올린 프로젝트 목록을 확인할 수 있습니다.
- 프로젝트 조건 수정은 제공하지 않으며, 현황 확인과 현재 마일스톤 조기 마감 기능만 제공합니다.
- 컨트랙트의 후원금 계산은 마일스톤 단위로 분리됩니다. 1차 후원금은 1차 투표/집행에만, 2차 후원금은 2차 투표/집행에만 반영됩니다.
- 전체 목표 금액을 넘어도 현재 마일스톤 증빙 제출 전까지는 후원이 가능하지만, 증빙 제출 또는 조기 마감 이후에는 해당 마일스톤 추가 후원이 제한됩니다.

## 로컬 실행 순서

### 1. PostgreSQL 실행

프로젝트 루트에서 실행합니다.

```bash
docker compose up -d
```

### 2. 컨트랙트 설치/컴파일/테스트

```bash
cd contracts
npm install
npm run compile
npm test
```

### 3. Hardhat 로컬 노드 실행

아래 명령은 계속 켜둡니다.

```bash
cd contracts
npm run node
```

### 4. Factory 컨트랙트 배포

새 터미널에서 실행합니다.

```bash
cd contracts
npm run deploy:localhost
```

출력된 값을 복사합니다.

```text
FACTORY_ADDRESS=0x...
```

이 주소는 `frontend/.env.local`의 `NEXT_PUBLIC_FACTORY_ADDRESS`에 넣어야 합니다.

### 5. 백엔드 환경변수 설정 및 실행

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:push
npm run start:dev
```

macOS/Linux는 `copy` 대신 `cp`를 사용합니다.

```bash
cp .env.example .env
```

`backend/.env`에서 OAuth 값을 설정합니다.

```env
DATABASE_URL="postgresql://crowd:crowdpass@localhost:5432/crowdfund?schema=public"
PORT=4000
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
PUBLIC_BASE_URL=http://localhost:4000
JWT_SECRET=local-dev-jwt-secret-change-me
AUTH_SIGNER_PRIVATE_KEY=0x8b3a350cf5c34c9194ca3a545d03bb755eedc292b4d697b91c4f9e8fced97e2a
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
KAKAO_CLIENT_ID=YOUR_KAKAO_REST_API_KEY
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URL=http://localhost:4000/auth/kakao/callback
```

### 6. 프론트엔드 환경변수 설정 및 실행

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

또는 pnpm 사용 시:

```bash
cd frontend
pnpm install
copy .env.local.example .env.local
pnpm dev
```

`frontend/.env.local`을 아래처럼 설정합니다.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_FACTORY_ADDRESS=방금_배포한_FACTORY_ADDRESS
```

브라우저에서 접속합니다.

```text
http://localhost:3000
```

## OAuth 설정

### Google OAuth

Google Cloud Console에서 OAuth Client를 만들고 승인된 리디렉션 URI에 아래 값을 추가합니다.

```text
http://localhost:4000/auth/google/callback
```

### Kakao OAuth

Kakao Developers에서 REST API 키를 발급받고 Redirect URI에 아래 값을 추가합니다.

```text
http://localhost:4000/auth/kakao/callback
```

Kakao Client Secret을 사용하지 않는 설정이라면 `KAKAO_CLIENT_SECRET`은 비워도 됩니다.

## MetaMask 설정

Hardhat 로컬 네트워크:

```text
네트워크 이름: Hardhat Localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
통화 기호: ETH
```

`npm run node`가 출력하는 테스트 계정 private key를 MetaMask에 가져오면 테스트 ETH가 들어 있습니다.

## Sepolia 테스트넷 실행

### 1. 컨트랙트 배포

`contracts/.env`를 생성합니다.

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=YOUR_TEST_WALLET_PRIVATE_KEY
```

배포합니다.

```bash
cd contracts
npm run deploy:sepolia
```

### 2. 백엔드 `.env` 변경

```env
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CHAIN_ID=11155111
```

### 3. 프론트엔드 `.env.local` 변경

```env
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_FACTORY_ADDRESS=SEPOLIA_FACTORY_ADDRESS
```

Sepolia에서는 후원 옵션 금액을 `0.001`, `0.005`, `0.01 ETH`처럼 작게 설정하는 것을 권장합니다.

## 주의사항

- Hardhat 노드를 껐다 켜면 로컬 컨트랙트 상태가 초기화됩니다. 다시 `deploy:localhost`를 실행하고 새 `FACTORY_ADDRESS`를 프론트엔드 `.env.local`에 반영해야 합니다.
- 실제 OAuth를 사용하려면 Google/Kakao 개발자 콘솔 설정이 반드시 필요합니다.
- 후원은 SNS 로그인과 MetaMask 연결이 모두 필요합니다.
- 후원 금액 직접 입력 UI는 없습니다. 프로젝트 생성자가 등록한 후원 옵션 금액만 사용할 수 있습니다.
- 이 프로젝트는 테스트/교육용 MVP입니다. 메인넷 배포 전에는 컨트랙트 보안 감사와 충분한 테스트가 필요합니다.
