# My Shop API Spec

This document summarizes the current backend API behavior (NestJS) and the intended client usage for the web shopping site.

- Base URL: `http://localhost:3000`
- Auth: `Authorization: Bearer <accessToken>`
- Content-Type: `application/json`

## Authentication

### Token pair

`POST /user/signup` and `POST /user/signin` return a token pair.

- `accessToken`: short-lived JWT used for authenticated requests
- `refreshToken`: long-lived JWT used to refresh access tokens

Store tokens securely on the client. For this project UI, the frontend stores them in `localStorage` (development convenience).

### Refresh

`GET /auth/refresh` exists, but the current backend implementation is inconsistent with the signin logic:

- Different env var names are used for JWT secrets.
- Different Redis key prefixes are used.
- The endpoint uses GET with a JSON request body.

Because of this, the frontend does not rely on refresh for the main flow.

## Core flows

### Browse products (public)

- `GET /products/find/all`

### Login

- `POST /user/signin`

### Cart

- Add: `POST /carts/add`
- Read: `GET /carts/find`
- Update quantity: `PATCH /carts`
- Remove one item: `DELETE /carts/:productId`
- Clear: `DELETE /carts`

### Checkout

- `POST /order/payment`

This creates an order from the current cart, decrements stock (transaction), and clears the cart.

### Orders

- List: `GET /order`
- Cancel: `PATCH /order/:orderId/cancel`

## Roles & authorization

- Product create/update/delete require `role` to be `ADMIN` or `SELLER`.
- Order status updates require `ADMIN`.

The backend uses `JwtAuthGuard` plus service-layer role checks.

## Data notes

- Some responses include a full `User` entity (including `password`) due to eager relations.
  The client must treat `password` as sensitive and never display it.

## OpenAPI

Machine-readable spec is available at:

- `docs/api/openapi.yaml`
