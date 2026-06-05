# Make-App API 명세서 (초안)

> URL 기반 일정 조율 서비스 - REST API 명세

| 항목      | 값                         |
| --------- | -------------------------- |
| 버전      | v0.3                       |
| 작성일    | 2026-06-05                 |
| Base URL  | `https://api.make-app.com` |
| 응답 형식 | JSON (UTF-8)               |
| 인증 방식 | JWT (HttpOnly Cookie)      |

---

## 1. 공통 사항

### 1.1 베이스 URL

```
운영: https://api.make-app.com
개발: http://localhost:8080
```

모든 엔드포인트는 `/api` 프리픽스를 가짐. 예: `https://api.make-app.com/api/meetings`

### 1.2 인증 방식

모든 JWT(소셜 로그인/게스트 모두)는 **HttpOnly Cookie** (`access_token`)로 관리된다.  
브라우저는 동일 도메인 요청 시 쿠키를 자동 전송하므로 클라이언트가 토큰을 직접 다룰 필요가 없다.

**소셜 로그인 사용자 (리더/회원)**
- `POST /api/auth/kakao/callback` 성공 시 서버가 `Set-Cookie: access_token=...; HttpOnly` 응답
- 이후 요청에는 쿠키가 자동 포함

**비회원 게스트**
- 초대 URL 접속 후 `POST /api/auth/guest/register`에서 닉네임 + 4자리 PIN 설정
- 서버가 게스트 JWT를 HttpOnly Cookie로 발급
- 다른 기기에서 재접속 시 `POST /api/auth/guest/login`으로 PIN 검증 후 쿠키 재발급

**Postman 테스트 시**  
Authorization 헤더 방식도 병행 지원한다.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

| 인증 유형      | 방식                                     | 사용 대상                    |
| -------------- | ---------------------------------------- | ---------------------------- |
| `Cookie`       | `access_token` HttpOnly Cookie (자동)    | 소셜 로그인 사용자 / 게스트  |
| `Bearer Token` | `Authorization: Bearer {jwt}` (Postman) | Postman 테스트 시 대안       |
| `Public`       | 없음                                     | 초대 URL 접속, 결과 URL 접속 |

### 1.3 공통 응답 형식

**성공 응답**

```json
{
  "success": true,
  "data": { ... }
}
```

**에러 응답**

```json
{
  "success": false,
  "error": {
    "code": "MEETING_NOT_FOUND",
    "message": "존재하지 않는 모임입니다"
  }
}
```

### 1.4 HTTP 상태 코드 사용 규칙

| 코드                      | 의미                 | 사용 사례                           |
| ------------------------- | -------------------- | ----------------------------------- |
| 200 OK                    | 조회/수정 성공       | GET, PATCH, PUT 성공 시             |
| 201 Created               | 생성 성공            | POST로 새 리소스 생성 시            |
| 204 No Content            | 성공, 응답 본문 없음 | DELETE 성공 시                      |
| 400 Bad Request           | 잘못된 요청          | 필수값 누락, 유효성 검증 실패       |
| 401 Unauthorized          | 인증 필요            | 토큰 없음/만료                      |
| 403 Forbidden             | 권한 없음            | 리더가 아닌 사용자가 리더 기능 호출 |
| 404 Not Found             | 리소스 없음          | 존재하지 않는 모임/참여자           |
| 409 Conflict              | 충돌                 | 이미 확정된 모임 재확정 등          |
| 500 Internal Server Error | 서버 에러            | 예상치 못한 오류                    |

### 1.5 공통 에러 코드

| 코드                        | HTTP | 설명                              |
| --------------------------- | ---- | --------------------------------- |
| `INVALID_REQUEST`           | 400  | 요청 형식 오류, 필수값 누락       |
| `UNAUTHORIZED`              | 401  | 인증 정보 없음 또는 만료          |
| `INVALID_TOKEN`             | 401  | 유효하지 않은 토큰                |
| `EXPIRED_TOKEN`             | 401  | 만료된 토큰                       |
| `PIN_MISMATCH`              | 401  | PIN 불일치                        |
| `FORBIDDEN`                 | 403  | 권한 부족                         |
| `MEETING_NOT_FOUND`         | 404  | 존재하지 않는 모임                |
| `PARTICIPANT_NOT_FOUND`     | 404  | 존재하지 않는 참여자              |
| `GUEST_NOT_FOUND`           | 404  | 해당 닉네임의 게스트 없음         |
| `MEETING_ALREADY_CONFIRMED` | 409  | 이미 확정된 모임                  |
| `DUPLICATE_PARTICIPATION`   | 409  | 이미 참여 중인 모임               |
| `MEETING_EXPIRED`           | 410  | 마감된 모임                       |
| `PIN_LOCKED`                | 429  | PIN 실패 5회 초과 — 30분 잠금     |
| `INTERNAL_ERROR`            | 500  | 서버 내부 오류                    |

---

## 2. API 엔드포인트 전체 목록

| 그룹           | Method | URI                                                  | 설명                           | 인증                   |
| -------------- | ------ | ---------------------------------------------------- | ------------------------------ | ---------------------- |
| Auth           | POST   | `/api/auth/kakao/callback`                           | 카카오 로그인 → Cookie 발급    | Public                 |
| Auth           | POST   | `/api/auth/logout`                                   | 로그아웃 → Cookie 삭제         | Cookie                 |
| Auth           | POST   | `/api/auth/refresh`                                  | 토큰 재발급 → Cookie 갱신      | Refresh Token (Body)   |
| Auth           | POST   | `/api/auth/guest/register`                           | 비회원 참가 등록 → 게스트 Cookie | Public                |
| Auth           | POST   | `/api/auth/guest/login`                              | 비회원 재접속 → 게스트 Cookie  | Public                 |
| Meetings       | POST   | `/api/meetings`                                      | 모임 생성                      | Cookie                 |
| Meetings       | GET    | `/api/meetings/invite/{inviteToken}`                 | 초대 URL로 모임 조회           | Public                 |
| Meetings       | GET    | `/api/meetings/result/{resultToken}`                 | 결과 URL로 모임 조회           | Public                 |
| Meetings       | PUT    | `/api/meetings/{id}`                                 | 모임 수정 (리더만)             | Cookie                 |
| Meetings       | POST   | `/api/meetings/{id}/confirm`                         | 일정 확정                      | Cookie (Leader)        |
| Meetings       | POST   | `/api/meetings/{id}/expire`                          | 모임 마감                      | Cookie (Leader)        |
| Meetings       | POST   | `/api/meetings/{id}/cancel`                          | 모임 삭제                      | Cookie (Leader)        |
| My             | GET    | `/api/my/meetings`                                   | 내가 만든 모임 목록            | Cookie                 |
| Participants   | POST   | `/api/meetings/{inviteToken}/participants`           | 소셜 회원 참여 등록            | Cookie                 |
| Participants   | GET    | `/api/meetings/{inviteToken}/participants`           | 참여자 목록 조회               | Public                 |
| Participants   | GET    | `/api/meetings/{inviteToken}/participants/me`        | 본인 참여 정보 조회            | Cookie                 |
| Participants   | POST   | `/api/meetings/{inviteToken}/participants/me/submit` | 응답 완료 처리                 | Cookie                 |
| Availabilities | PUT    | `/api/meetings/{inviteToken}/availabilities`         | 본인 응답 등록/수정            | Cookie                 |
| Availabilities | GET    | `/api/meetings/{inviteToken}/availabilities`         | 응답 현황 조회                 | Public                 |
| Results        | GET    | `/api/meetings/{inviteToken}/results`                | 결과 화면 데이터 조회          | Public                 |

---

## 3. Auth (인증)

### 3.1 카카오 로그인 콜백

카카오 인증 후 받은 `authorization_code`를 서버에 전달, JWT 토큰을 발급받는다.

| 항목     | 값                         |
| -------- | -------------------------- |
| Method   | `POST`                     |
| URI      | `/api/auth/kakao/callback` |
| 인증     | Public                     |
| 요구사항 | FR-007, FR-008, FR-009     |

**Request Body**

```json
{
  "code": "kakao_authorization_code_here"
}
```

**Response 200 OK**

응답 헤더에 `Set-Cookie: access_token=eyJ...; HttpOnly; Path=/; SameSite=Lax; Max-Age=3600` 포함.

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "김민수"
    }
  }
}
```

> Body의 `accessToken`은 Postman 테스트 편의를 위해 유지. 브라우저 클라이언트는 Cookie를 사용.

**에러**

| HTTP | code                | 설명                     |
| ---- | ------------------- | ------------------------ |
| 400  | `INVALID_REQUEST`   | code 누락 또는 형식 오류 |
| 401  | `KAKAO_AUTH_FAILED` | 카카오 인증 실패         |

---

### 3.2 로그아웃

| 항목   | 값                 |
| ------ | ------------------ |
| Method | `POST`             |
| URI    | `/api/auth/logout` |
| 인증   | Cookie             |

**Response 204 No Content**

응답 헤더에 `Set-Cookie: access_token=; Max-Age=0` 포함 → 쿠키 삭제.

---

### 3.3 토큰 재발급

| 항목   | 값                   |
| ------ | -------------------- |
| Method | `POST`               |
| URI    | `/api/auth/refresh`  |
| 인증   | Refresh Token (Body) |

**Request Body**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 3.4 비회원 게스트 등록

초대 URL에 접속한 비회원이 닉네임과 PIN을 설정하여 처음 참가한다.

| 항목   | 값                          |
| ------ | --------------------------- |
| Method | `POST`                      |
| URI    | `/api/auth/guest/register`  |
| 인증   | Public                      |

**Request Body**

```json
{
  "inviteToken": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "김철수",
  "pin": "1234"
}
```

**필드 검증**

| 필드        | 타입   | 필수 | 제약                              |
| ----------- | ------ | ---- | --------------------------------- |
| inviteToken | String | ✅   | 유효한 모임 초대 토큰             |
| displayName | String | ✅   | 1~50자                            |
| pin         | String | ✅   | 숫자 4자리 (`\d{4}`)             |

**Response 201 Created**

응답 헤더에 `Set-Cookie: access_token=...; HttpOnly; Path=/; SameSite=Lax; Max-Age=3600` 포함.

```json
{
  "success": true,
  "data": {
    "id": 1002,
    "displayName": "김철수",
    "type": "GUEST",
    "submitted": false
  }
}
```

> 동명이인이 있을 경우 서버에서 자동으로 `(2)`, `(3)` 등 접미사를 부여한다.

**에러**

| HTTP | code                | 설명                         |
| ---- | ------------------- | ---------------------------- |
| 400  | `INVALID_REQUEST`   | 필수값 누락 또는 형식 오류   |
| 404  | `MEETING_NOT_FOUND` | 존재하지 않는 초대 토큰      |
| 410  | `MEETING_EXPIRED`   | 마감된 모임                  |

---

### 3.5 비회원 게스트 재로그인

기존 참가자가 다른 기기에서 재접속 시 닉네임과 PIN으로 인증한다.

| 항목   | 값                        |
| ------ | ------------------------- |
| Method | `POST`                    |
| URI    | `/api/auth/guest/login`   |
| 인증   | Public                    |

**Request Body**

```json
{
  "inviteToken": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "김철수",
  "pin": "1234"
}
```

**Response 200 OK**

응답 헤더에 `Set-Cookie: access_token=...; HttpOnly; ...` 포함. 기존 참가자 정보 반환.

```json
{
  "success": true,
  "data": {
    "id": 1002,
    "displayName": "김철수",
    "type": "GUEST",
    "submitted": true,
    "submittedAt": "2026-06-01T15:30:00"
  }
}
```

**에러**

| HTTP | code                | 설명                              |
| ---- | ------------------- | --------------------------------- |
| 401  | `PIN_MISMATCH`      | PIN 불일치                        |
| 404  | `GUEST_NOT_FOUND`   | 해당 닉네임의 참가자 없음         |
| 429  | `PIN_LOCKED`        | 5회 실패 → 30분 접근 잠금         |

---

## 4. Meetings (모임)

### 4.1 모임 생성

리더가 모임명, 후보 날짜/시간을 입력하여 모임을 생성한다.

| 항목     | 값                                                                     |
| -------- | ---------------------------------------------------------------------- |
| Method   | `POST`                                                                 |
| URI      | `/api/meetings`                                                        |
| 인증     | Bearer (리더)                                                          |
| 요구사항 | FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-021, FR-023 |

**Request Body**

```json
{
  "name": "동아리 정기모임",
  "expectedCount": 8,
  "candidateSlots": [
    {
      "slotDate": "2026-06-01",
      "startTime": "19:00",
      "endTime": "21:00"
    },
    {
      "slotDate": "2026-06-02",
      "startTime": "20:00",
      "endTime": "22:00"
    }
  ]
}
```

**필드 검증**

| 필드                       | 타입    | 필수 | 제약                               |
| -------------------------- | ------- | ---- | ---------------------------------- |
| name                       | String  | ✅   | 1~50자                             |
| expectedCount              | Integer | ❌   | 1~999                              |
| candidateSlots             | Array   | ✅   | 최소 1개 이상                      |
| candidateSlots[].slotDate  | Date    | ✅   | YYYY-MM-DD 형식, 과거 날짜 불가    |
| candidateSlots[].startTime | Time    | ✅   | HH:mm 형식, 30분 단위 (00 또는 30) |
| candidateSlots[].endTime   | Time    | ✅   | startTime보다 늦어야 함            |

**Response 201 Created**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "동아리 정기모임",
    "expectedCount": 8,
    "status": "OPEN",
    "inviteToken": "550e8400-e29b-41d4-a716-446655440000",
    "resultToken": "8b2f7a01-c3e4-4d5f-9876-1234567890ab",
    "inviteUrl": "https://make-app.com/invite/550e8400-e29b-41d4-a716-446655440000",
    "resultUrl": "https://make-app.com/result/8b2f7a01-c3e4-4d5f-9876-1234567890ab",
    "createdAt": "2026-05-20T10:00:00"
  }
}
```

---

### 4.2 초대 URL로 모임 조회

팔로워가 초대 URL에 접속하면 호출. 모임 정보와 후보 슬롯을 함께 반환한다.

| 항목     | 값                                   |
| -------- | ------------------------------------ |
| Method   | `GET`                                |
| URI      | `/api/meetings/invite/{inviteToken}` |
| 인증     | Public                               |
| 요구사항 | FR-025, FR-026, FR-028, FR-029       |

**Path Parameter**

| 이름        | 타입   | 설명                   |
| ----------- | ------ | ---------------------- |
| inviteToken | String | 초대 URL의 토큰 (UUID) |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "동아리 정기모임",
    "expectedCount": 8,
    "status": "OPEN",
    "ownerName": "김민수",
    "candidateSlots": [
      {
        "id": 101,
        "slotDate": "2026-06-01",
        "startTime": "19:00",
        "endTime": "21:00"
      }
    ],
    "createdAt": "2026-05-20T10:00:00"
  }
}
```

**에러**

| HTTP | code                | 설명                           |
| ---- | ------------------- | ------------------------------ |
| 404  | `MEETING_NOT_FOUND` | 잘못된 토큰                    |
| 410  | `MEETING_EXPIRED`   | 마감된 모임 (status = EXPIRED) |

---

### 4.3 결과 URL로 모임 조회

| 항목     | 값                                   |
| -------- | ------------------------------------ |
| Method   | `GET`                                |
| URI      | `/api/meetings/result/{resultToken}` |
| 인증     | Public                               |
| 요구사항 | FR-050, FR-061, FR-062               |

응답 형식은 4.2와 동일. `status = CONFIRMED`인 경우 `confirmedSlot` 필드가 추가된다.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "동아리 정기모임",
    "status": "CONFIRMED",
    "confirmedSlot": {
      "id": 101,
      "slotDate": "2026-06-01",
      "startTime": "19:00",
      "endTime": "20:00"
    }
  }
}
```

---

### 4.4 모임 수정

리더가 모임명이나 후보 슬롯을 수정한다.

| 항목     | 값                   |
| -------- | -------------------- |
| Method   | `PUT`                |
| URI      | `/api/meetings/{id}` |
| 인증     | Bearer (리더)        |
| 요구사항 | FR-022               |

**Request Body**: 4.1과 동일

**에러**

| HTTP | code                        | 설명                         |
| ---- | --------------------------- | ---------------------------- |
| 403  | `FORBIDDEN`                 | 리더가 아님                  |
| 404  | `MEETING_NOT_FOUND`         | 존재하지 않음                |
| 409  | `MEETING_ALREADY_CONFIRMED` | 이미 확정된 모임은 수정 불가 |

---

### 4.5 일정 확정

리더가 최종 일정을 결정한다. `confirmed_slot_id`가 채워지고 `status = CONFIRMED`로 변경된다.

| 항목     | 값                           |
| -------- | ---------------------------- |
| Method   | `POST`                       |
| URI      | `/api/meetings/{id}/confirm` |
| 인증     | Bearer (리더)                |
| 요구사항 | FR-071                       |

**Request Body**

```json
{
  "confirmedSlotId": 101
}
```

**Response 200 OK**: 확정된 모임 정보 반환

**에러**

| HTTP | code                        | 설명                         |
| ---- | --------------------------- | ---------------------------- |
| 403  | `FORBIDDEN`                 | 리더가 아님                  |
| 409  | `MEETING_ALREADY_CONFIRMED` | 이미 확정됨                  |
| 400  | `INVALID_REQUEST`           | 슬롯이 해당 모임 소속이 아님 |

---

### 4.6 모임 마감

방장이 명시적으로 투표를 마감한다. `status = EXPIRED`로 변경.

| 항목   | 값                          |
| ------ | --------------------------- |
| Method | `POST`                      |
| URI    | `/api/meetings/{id}/expire` |
| 인증   | Bearer (리더)               |

**Response 200 OK**

---

### 4.7 모임 삭제

| 항목     | 값                          |
| -------- | --------------------------- |
| Method   | `POST`                      |
| URI      | `/api/meetings/{id}/cancel` |
| 인증     | Bearer (리더)               |
| 요구사항 | FR-071                      |

**Response 204 No Content**

---

## 5. My (마이페이지)

### 5.1 내가 만든 모임 목록

| 항목     | 값                 |
| -------- | ------------------ |
| Method   | `GET`              |
| URI      | `/api/my/meetings` |
| 인증     | Bearer             |
| 요구사항 | FR-005, FR-011     |

**Query Parameter**

| 이름   | 타입    | 필수 | 기본값 | 설명                                  |
| ------ | ------- | ---- | ------ | ------------------------------------- |
| status | String  | ❌   | (전체) | `OPEN` / `CONFIRMED` / `EXPIRED` 필터 |
| page   | Integer | ❌   | 0      | 페이지 번호                           |
| size   | Integer | ❌   | 10     | 페이지 크기                           |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "meetings": [
      {
        "id": 1,
        "name": "동아리 정기모임",
        "status": "OPEN",
        "participantCount": 5,
        "createdAt": "2026-05-20T10:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 23
  }
}
```

---

## 6. Participants (참여자)

### 6.1 모임 참여 등록 (소셜 회원 전용)

소셜 로그인 회원이 모임에 참가할 때 사용.  
**비회원 게스트 참가는 `POST /api/auth/guest/register` (섹션 3.4) 를 사용한다.**

| 항목     | 값                                        |
| -------- | ----------------------------------------- |
| Method   | `POST`                                    |
| URI      | `/api/meetings/{inviteToken}/participants` |
| 인증     | Cookie (소셜 로그인)                      |
| 요구사항 | FR-033, FR-034, FR-035, FR-036, FR-037    |

**Request Body**

```json
{
  "type": "MEMBER"
}
```

**Response 201 Created**

```json
{
  "success": true,
  "data": {
    "id": 1001,
    "displayName": "김민수",
    "type": "MEMBER",
    "submitted": false,
    "submittedAt": null
  }
}
```

> **참고**: 동명이인이 있을 경우 서버에서 자동으로 `(2)`, `(3)` 등 접미사를 부여한다.

---

### 6.2 참여자 목록 조회

| 항목     | 값                                         |
| -------- | ------------------------------------------ |
| Method   | `GET`                                      |
| URI      | `/api/meetings/{inviteToken}/participants` |
| 인증     | Public                                     |
| 요구사항 | FR-048                                     |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "id": 1001,
        "displayName": "김민수",
        "type": "LEADER",
        "submitted": true
      },
      {
        "id": 1002,
        "displayName": "박지영",
        "type": "MEMBER",
        "submitted": false
      },
      {
        "id": 1003,
        "displayName": "이수현",
        "type": "GUEST",
        "submitted": true
      }
    ],
    "totalCount": 3,
    "submittedCount": 2
  }
}
```

> 응답에는 `user_id`, `guest_token` 같은 민감 정보를 포함하지 않음.

---

### 6.3 본인 참여 정보 조회

재접속 시 본인의 기존 응답을 불러올 때 사용.

| 항목     | 값                                            |
| -------- | --------------------------------------------- |
| Method   | `GET`                                         |
| URI      | `/api/meetings/{inviteToken}/participants/me` |
| 인증     | Cookie (소셜/게스트 공통)                     |
| 요구사항 | FR-038, FR-039                                |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "id": 1002,
    "displayName": "박지영",
    "type": "MEMBER",
    "submittedAt": null,
    "availabilities": [
      { "candidateSlotId": 101, "status": "AVAILABLE" },
      { "candidateSlotId": 102, "status": "UNAVAILABLE" }
    ]
  }
}
```

---

### 6.4 응답 완료 처리

팔로워가 "응답 완료" 버튼을 누르면 호출. `submitted_at`이 현재 시각으로 채워진다.

| 항목     | 값                                                   |
| -------- | ---------------------------------------------------- |
| Method   | `POST`                                               |
| URI      | `/api/meetings/{inviteToken}/participants/me/submit` |
| 인증     | Cookie (소셜/게스트 공통)                            |
| 요구사항 | FR-046, FR-066                                       |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "submittedAt": "2026-05-20T11:30:00"
  }
}
```

---

## 7. Availabilities (응답)

### 7.1 본인 응답 등록/수정

각 슬롯에 대한 가능/불가능 응답을 한 번에 저장. UPSERT 동작 (있으면 수정, 없으면 삽입).

| 항목     | 값                                                     |
| -------- | ------------------------------------------------------ |
| Method   | `PUT`                                                  |
| URI      | `/api/meetings/{inviteToken}/availabilities`           |
| 인증     | Cookie (소셜/게스트 공통)                              |
| 요구사항 | FR-041, FR-042, FR-043, FR-044, FR-045, FR-047, FR-075 |

**Request Body**

```json
{
  "availabilities": [
    { "candidateSlotId": 101, "status": "AVAILABLE" },
    { "candidateSlotId": 102, "status": "UNAVAILABLE" },
    { "candidateSlotId": 103, "status": "AVAILABLE" }
  ]
}
```

**필드 검증**

| 필드                             | 타입 | 제약                           |
| -------------------------------- | ---- | ------------------------------ |
| availabilities[].candidateSlotId | Long | 해당 모임의 슬롯 ID여야 함     |
| availabilities[].status          | Enum | `AVAILABLE` 또는 `UNAVAILABLE` |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

---

### 7.2 응답 현황 조회

실시간으로 모든 참여자의 응답 현황을 조회. 결과 화면 진입 전 보기용.

| 항목     | 값                                           |
| -------- | -------------------------------------------- |
| Method   | `GET`                                        |
| URI      | `/api/meetings/{inviteToken}/availabilities` |
| 인증     | Public                                       |
| 요구사항 | FR-030, FR-031, FR-049                       |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "id": 101,
        "slotDate": "2026-06-01",
        "startTime": "19:00",
        "endTime": "19:30",
        "availableParticipants": [
          { "id": 1001, "displayName": "김민수" },
          { "id": 1003, "displayName": "이수현" }
        ],
        "unavailableParticipants": [{ "id": 1002, "displayName": "박지영" }]
      }
    ]
  }
}
```

---

## 8. Results (결과)

### 8.1 결과 화면 데이터 조회

집계된 결과를 정렬 기준에 따라 조회.

| 항목     | 값                                                                     |
| -------- | ---------------------------------------------------------------------- |
| Method   | `GET`                                                                  |
| URI      | `/api/meetings/{inviteToken}/results`                                  |
| 인증     | Public                                                                 |
| 요구사항 | FR-050, FR-051, FR-052, FR-053, FR-054, FR-055, FR-057, FR-058, FR-059 |

**Query Parameter**

| 이름 | 타입   | 필수 | 기본값      | 설명                                         |
| ---- | ------ | ---- | ----------- | -------------------------------------------- |
| sort | String | ❌   | `recommend` | 정렬 기준: `recommend` / `date` / `duration` |

**Response 200 OK**

```json
{
  "success": true,
  "data": {
    "meetingName": "동아리 정기모임",
    "totalParticipants": 5,
    "submittedParticipants": 5,
    "confirmedSlot": null,
    "slots": [
      {
        "id": 101,
        "slotDate": "2026-06-01",
        "startTime": "19:00",
        "endTime": "19:30",
        "availableCount": 5,
        "unavailableCount": 0,
        "recommendationLabel": "5명 중 5명 가능",
        "isTopRecommendation": true
      },
      {
        "id": 102,
        "slotDate": "2026-06-01",
        "startTime": "19:30",
        "endTime": "20:00",
        "availableCount": 4,
        "unavailableCount": 1,
        "recommendationLabel": "5명 중 4명 가능",
        "isTopRecommendation": false
      }
    ]
  }
}
```

> `isTopRecommendation: true`인 항목이 추천 1순위. 동률이면 여러 개가 `true`가 될 수 있음 (FR-059).

---

## 9. 향후 추가 검토 사항

다음 기능은 v0.1에 포함되지 않지만 후속 버전에서 검토.

| 영역   | 항목                               | 관련 요구사항  |
| ------ | ---------------------------------- | -------------- |
| 실시간 | WebSocket/SSE 기반 실시간 업데이트 | FR-064, FR-065 |
| 실시간 | 연결 끊김/재연결 처리              | FR-067, FR-068 |
| 알림   | 투표 종료 알림 (FCM)               | FR-066         |
| 공유   | 단톡방 공유 문구 자동 생성         | FR-063         |

---

## 10. 결정 필요 사항 (팀 논의)

다음 항목들은 초안에서 보편적인 기본값으로 작성했지만 팀 논의가 필요해.

| 항목             | 결정                       | 비고                                              |
| ---------------- | -------------------------- | ------------------------------------------------- |
| 인증 방식        | JWT (HttpOnly Cookie)      | ✅ 확정 — localStorage 대신 보안 쿠키 사용         |
| 비회원 인증      | 닉네임 + PIN (해시 저장)   | ✅ 확정 — X-Guest-Token 헤더 방식 폐기             |
| 응답 래퍼        | `{ success, data }` 형식   | ✅ 유지                                            |
| 페이징           | offset 기반 (page, size)   | 미결 — 대규모 데이터 시 cursor 기반 고려           |

---

## 11. 변경 이력

| 버전 | 날짜       | 변경 내용                                                               |
| ---- | ---------- | ----------------------------------------------------------------------- |
| v0.1 | 2026-05-20 | 초안 작성                                                               |
| v0.2 | 2026-05-22 | HTTP method 수정                                                        |
| v0.3 | 2026-06-05 | 비회원 인증 방식 변경 (X-Guest-Token → PIN 해시 + HttpOnly Cookie JWT), 게스트 등록/로그인 엔드포인트 추가 |
