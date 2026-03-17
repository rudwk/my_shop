# API 명세서 (backend)

이 문서는 `backend/src`의 컨트롤러/서비스/DTO를 기준으로 작성한 실제 동작 기준 명세입니다.

## 공통

- Base URL: `/`
- Content-Type: `application/json`
- 인증: `Authorization: Bearer <accessToken>`
  - `JwtAuthGuard`가 적용된 엔드포인트만 필요

### 공통 오류
서비스 로직에 따라 아래 상태 코드가 발생할 수 있습니다.

- `400 Bad Request`: 입력 값 검증 실패, 재고 부족, 결제/취소 불가 상태
- `401 Unauthorized`: 로그인 실패, 토큰 불일치
- `403 Forbidden`: 권한 부족(관리자/판매자 전용, 본인 외 수정/삭제)
- `404 Not Found`: 대상 리소스 없음
- `409 Conflict`: 중복 회원 가입
- `500 Internal Server Error`: 저장/수정/삭제 실패

## 인증/유저

### 회원가입
- `POST /user/signup`
- Body
```json
{
  "email": "string",
  "password": "string (4~20)",
  "name": "string",
  "address": "string"
}
```
- Response
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

### 로그인
- `POST /user/signin`
- Body
```json
{
  "email": "string",
  "password": "string (4~20)"
}
```
- Response
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

### 토큰 갱신
- `GET /auth/refresh`
- Body (GET 이지만 Body를 사용하도록 구현됨)
```json
{
  "refreshToken": "string"
}
```
- Response (필드명이 `accsessToken` 오타로 구현됨)
```json
{
  "accsessToken": "string"
}
```

### 사용자 조회
- `GET /user/find` (인증 필요)
- Query
  - `id` 또는 `email` 또는 `name` 중 하나
- Response
  - `id`/`email`/`name`: 단건
  - `name`: 다건 배열
```json
{
  "id": 1,
  "email": "string",
  "name": "string",
  "address": "string",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### 사용자 전체 조회
- `GET /user/find/all`
- Response: 사용자 배열 (Response DTO 적용)

### 사용자 정보 수정
- `PATCH /user/:id` (인증 필요)
- Path
  - `id`: number
- Body (부분 업데이트)
```json
{
  "password": "string",
  "name": "string",
  "address": "string"
}
```
- Response
```json
{
  "message": "string"
}
```

### 사용자 삭제
- `DELETE /user/:id` (인증 필요)
- Path
  - `id`: number
- Response
```json
{
  "message": "string"
}
```

### 현재 사용자 조회
- `GET /` (인증 필요)
- Response: `JwtStrategy.validate()`가 반환한 사용자 엔티티

## 상품

### 상품 등록
- `POST /products/add` (인증 필요, ADMIN/SELLER)
- Body
```json
{
  "name": "string",
  "description": "string",
  "price": 1000,
  "stock": 10
}
```
- Response
```json
{
  "message": "string"
}
```

### 상품 조회 (단건/전체)
- `GET /products/find` (인증 필요)
- Query
  - `id` 또는 `name` 또는 미지정(전체)
- Response
  - `id`/`name`: 단건
  - 미지정: 배열
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "price": 1000,
  "stock": 10,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### 상품 전체 조회 (공개)
- `GET /products/find/all`
- Response: 상품 배열

### 상품 수정
- `PATCH /products/:id` (인증 필요, ADMIN/SELLER)
- Body (부분 업데이트)
```json
{
  "name": "string",
  "description": "string",
  "price": 1000,
  "stock": 10
}
```
- Response
```json
{
  "message": "string"
}
```

### 상품 삭제
- `DELETE /products/:id` (인증 필요, ADMIN/SELLER)
- Response
```json
{
  "message": "string"
}
```

## 장바구니

### 장바구니 담기
- `POST /carts/add` (인증 필요)
- Body
```json
{
  "productId": 1,
  "quantity": 2
}
```
- Response
```json
{
  "cartItemId": 1,
  "quantity": 2,
  "product": {
    "id": 1,
    "name": "string",
    "description": "string",
    "price": 1000,
    "stock": 10,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### 장바구니 조회
- `GET /carts/find` (인증 필요)
- Response: 장바구니 아이템 배열

### 장바구니 수량 변경
- `PATCH /carts` (인증 필요)
- Body
```json
{
  "productId": 1,
  "quantity": 3
}
```
- Response: 업데이트된 Cart 엔티티

### 장바구니 아이템 삭제
- `DELETE /carts/:productId` (인증 필요)
- Response: 없음 (204/200)

### 장바구니 비우기
- `DELETE /carts` (인증 필요)
- Response
```json
{
  "message": "string"
}
```

## 주문

### 결제(주문 생성)
- `POST /order/payment` (인증 필요)
- Response: 생성된 주문
```json
{
  "id": 1,
  "total": 2000,
  "status": "PAID",
  "orderedAt": "2026-01-01T00:00:00.000Z"
}
```

### 주문 목록 조회
- `GET /order` (인증 필요)
- Response: 주문 배열 (items 및 product 포함)
```json
[
  {
    "id": 1,
    "total": 2000,
    "status": "PAID",
    "orderedAt": "2026-01-01T00:00:00.000Z",
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "price": 1000,
        "product": {
          "id": 1,
          "name": "string",
          "description": "string",
          "price": 1000,
          "stock": 10,
          "createdAt": "2026-01-01T00:00:00.000Z"
        }
      }
    ]
  }
]
```

### 주문 상태 변경 (관리자)
- `PATCH /order/:orderId/status/:status` (인증 필요, ADMIN)
- Path
  - `orderId`: number
  - `status`: `PENDING | PAID | SHIPPED | DELIVERED | CANCELLED`
- Response: 변경된 주문

### 주문 취소
- `PATCH /order/:orderId/cancel` (인증 필요)
- Response: 변경된 주문

