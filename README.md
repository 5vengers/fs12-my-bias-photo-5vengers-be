# :camera: 최애의 포토
# :superhero: 5VENGERS (오벤져스)
([5vengers 노션 링크](https://app.notion.com/p/Part_3-Project-5vengers_Dash-board-36cf7270cef78027b9b6c04840ff285f?source=copy_link))


# :astronaut: 팀원 구성
강정민 ([Github 링크](https://github.com/jeongmin00))

김나연 ([Github 링크](https://github.com/9g-g9))

김성현 ([Github 링크](https://github.com/Obebe-creator))

원세빈 ([Github 링크](https://github.com/sebikawa32))

이상윤 ([Github 링크](https://github.com/sensertive05))


# :rocket: 프로젝트 소개
최애의 포토카드를 다른 사람과 교환, 판매, 구매할 수 있는 활발한 거래 사이트 제작

프로젝트 기간: 2026.06.01 ~ 2026.06.24


# :gear: 기술 스택
Backend: Node.js, Express.js 5, Prisma ORM
Database: PostgreSQL
인증: JWT, Passport.js, Google OAuth 2.0, bcrypt
검증 및 보안: Zod, CORS, Cookie Parser
공통 Tool: GitHub, Render, ESLint, Prettier, CodeRabbit, npm, Nodemon

# :wrench: 팀원별 구현 기능 상세

### 강정민

### 인증 / 인가

#### JWT 기반 회원가입, 로그인, 로그아웃 기능 구현

- Refresh Token 기반 인증 상태 유지 및 Access Token 재발급 기능 구현
- Refresh Token은 HttpOnly Cookie, Access Token은 메모리에 저장하여 XSS 공격 방어
- 로그인 / OAuth 로그인 / 토큰 재발급 경로를 `issueTokens` 단일 함수로 공통화
- `replaceRefreshToken` 트랜잭션으로 토큰 삭제 → 저장을 원자적으로 처리하여 중간 장애 시 강제 로그아웃 방지
- DB 존재 확인 → JWT 서명 검증 → userId 교차 검증 순서의 이중 검증으로 토큰 탈취 및 재사용 공격 방어

#### Google OAuth 로그인 기능 구현

- Passport.js 기반 OAuth 인증 흐름 구현
- 구글 프로필 닉네임 충돌 시 UUID suffix를 자동 생성하여 유니크한 닉네임 처리
- OAuth 인증 오류를 JSON 응답 대신 프론트엔드 리다이렉트 방식으로 처리하여 브라우저 흐름과 일관성 유지

#### JWT 인증 미들웨어 및 Zod 기반 요청 검증 미들웨어 구현

- `req.validated.body` / `req.validated.query` 네임스페이스로 검증 결과를 원본 Request 객체와 분리 저장
- `req.query`의 getter-only 특성으로 인한 재할당 오류 방지
- Zod 타입 변환 결과를 안전하게 보존하여 서비스 계층에 전달

### 실시간 알림

#### SSE(Server-Sent Events) 기반 실시간 알림 기능 구현

- `Map<userId, Set<res>>` 구조로 동일 유저의 다중 탭 및 다중 디바이스 연결 지원
- 연결 수립 즉시 미읽은 알림 수를 `connected` 이벤트로 전송하여 클라이언트 배지 초기화
- 30초 Heartbeat Ping으로 프록시 및 방화벽 Idle Timeout 방지
- `X-Accel-Buffering: no` 헤더 적용으로 Nginx 버퍼링을 비활성화하여 실시간 전송 보장

#### 6가지 알림 타입 구현

- 교환 제안
- 교환 성사
- 교환 거절
- 구매 완료
- 판매 성사
- 품절

#### 알림 시스템 개선

- 알림 생성과 SSE 전송을 `createAndSend` 단일 함수로 통합하여 트리거 로직 단순화
- `preventDuplicate` 옵션으로 동일 `(userId, type, targetId)` 조합의 중복 알림 방지
- 교환 승인 시 나머지 대기 제안자에게 자동 거절 알림 전송
- `Promise.allSettled`를 활용한 병렬 처리로 일부 실패 상황에서도 나머지 알림 발송 보장

#### 알림 읽음 처리 및 미읽음 개수 관리 기능 구현

- 단일 읽음 API / 전체 읽음 API 분리 구현
- 클라이언트 낙관적 업데이트를 적용하여 서버 응답 전 미읽음 배지 즉시 감소
  
---

### 김나연

### 마이갤러리 조회

- 검색, 등급, 장르 등 필터링 조회 기능

### 나의 판매 포토카드 조회

- 검색, 등급, 장르 등 필터링 조회 기능
- 교환 목록과 판매 목록을 동시에 불러와서 처리해야하기 때문에 Promise.all 로 처리

### 포토 카드 생성

- multer - cloudinary 로 이미지 저장 및 관리
- transaction 처리로 form 데이터 처리 중 오류 시 롤백

---

### 김성현

### 포인트 기능

- BE에서 사용자 포인트 조회 기능 구현
- 포인트 박스 오픈 기능 구현
- 포인트 획득 시 현재 포인트에 반영되도록 처리
- 포인트 변경 내역을 `PointLog`로 기록하여 포인트 이력 추적 가능하도록 구현

### 판매 기능

- BE에서 포토카드 판매 등록 로직 구현
- 사용자의 보유 수량과 이미 판매 중인 수량을 기준으로 최대 판매 가능 수량 계산
- 보유 수량보다 많은 포토카드를 판매 등록하지 못하도록 검증
- FE에서 판매 등록 모달 UI 구현 및 API 연결
- 가격/수량 입력값 validation 처리 및 에러 메시지 표시

### 구매 기능

- BE에서 포토카드 구매 로직 구현
- 구매자 포인트 차감, 판매자 포인트 지급, 주문 생성, 카드 수량 변경 로직 구현
- 구매 과정에서 재고 부족, 포인트 부족, 본인 판매글 구매 시도 예외 처리
- Prisma transaction을 사용하여 구매 관련 데이터가 원자적으로 처리되도록 구현
- FE에서 구매 수량 선택 UI 및 구매 API 연결

### 교환 기능

- BE에서 포토카드 교환 제시 생성 로직 구현
- 교환 상태를 `WAITING`, `APPROVED`, `REJECTED`, `CANCELLED`로 관리
- 본인 판매글 교환 제시, 같은 카드 교환, 보유하지 않은 카드 교환 등 예외 처리
- 교환 승인 시 카드 소유권 및 판매 수량이 정합성 있게 변경되도록 구현
- FE에서 교환 요청 모달, 교환 제시 목록, 승인/거절 UI 구현 및 API 연결

### 마켓 상세 페이지

- FE에서 구매자/판매자 기준으로 상세 페이지 분리
- 구매자는 구매 및 교환 제시가 가능하도록 구성
- 판매자는 판매글 수정, 판매 내리기, 받은 교환 제시 확인 및 승인/거절 가능하도록 구성
- 판매 내리기 시 공용 Modal 컴포넌트를 사용하여 확인 모달 구현
- 장르 enum 값을 사용자에게 보여줄 때 한글 라벨로 변환하여 표시

### 데이터 정합성 처리

- 판매, 구매, 교환 과정에서 보유 수량, 판매 수량, 포인트, 주문, 카드 소유권이 어긋나지 않도록 검증 로직 구현
- 구매/교환처럼 여러 테이블이 함께 변경되는 로직에 Prisma transaction 적용
- 중복 요청 및 잘못된 상태 변경을 방지하기 위한 상태값 검증 처리

---

### 원세빈

### 마켓플레이스 CRUD 기능

#### 판매글 생성(Create)

- 포토카드 판매 등록 기능 구현
  - 판매 수량, 가격, 교환 희망 조건 입력 및 유효성 검증 처리
  - React Query Mutation을 활용한 서버 상태 관리

#### 판매글 조회(Read)

- 검색, 등급, 장르, 판매 상태 필터링 기능 구현
  - 가격순/최신순 정렬 기능 구현
  - React Query Infinite Query와 IntersectionObserver를 활용한 무한스크롤 구현

#### 판매글 수정(Update)

- 판매글 수정 기능 구현
  - 작성자 권한 검증 및 데이터 유효성 검증 처리

#### 판매글 삭제(Delete)

- 판매글 삭제 및 상태 변경 기능 구현
  - 작성자 권한 검증 처리

### 데이터 무결성 및 DB 설계

- PostgreSQL 제약조건(Constraint) 적용
- 서비스 검증 + DB 제약조건 이중 검증 구조 설계

### History 로그 시스템

- PostgreSQL Trigger를 활용한 History 자동 기록 시스템 구현
- INSERT, UPDATE, DELETE 발생 시 변경 이력을 자동 저장

---

### 이상윤

# :file_folder: 파일 구조

```text
src
├── config
├── constants
├── controllers
├── errors
├── libs
│   ├── jwt.js
│   └── sseManager.js
├── middlewares
├── repositories
├── routes
├── schemas
├── services
├── utils
└── app.js
```

# :globe_with_meridians: 구현 서버
https://fs12-my-bias-photo-5vengers-be.onrender.com/

# :page_facing_up: 프로젝트 회고록
