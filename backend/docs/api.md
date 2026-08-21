# API Reference

## Base URL

The Express app mounts the root router at `/api/v1`, and the root router mounts auth at `/auth`. The current backend API base is therefore:

```text
http://localhost:<PORT>/api/v1/auth
```

The frontend currently uses `http://localhost:5000/api/v1/auth`.

## Response envelope

`sendResponse` returns:

```json
{
  "success": true,
  "message": "Message",
  "data": null
}
```

The service `statusCode` controls the HTTP status and is not included in the JSON response by `sendResponse`.

No route currently declares role or permission requirements. No access-token authorization middleware was found.

## Validation rules

Auth request bodies use strict Zod objects unless otherwise noted. Unknown body fields are rejected. Shared validators are:

- Email: trimmed string in email format.
- Password on signup: string, minimum 8 characters.
- Name: string, 2 to 100 characters.
- Username: string, 3 to 50 characters, letters/numbers/hyphens/underscores only.
- OTP: exactly six numeric characters.

## Endpoints

### POST `/sign-up`

**Authentication:** Public. **Permissions:** None found.

Creates a user and stores an email-verification OTP.

**Request body**

```json
{
  "name": "Ada Lovelace",
  "username": "ada",
  "email": "ada@example.com",
  "password": "at-least-8-characters"
}
```

**Validation:** All four fields are required; body is strict; rules are listed above.

**Success:** HTTP `201`.

```json
{
  "success": true,
  "message": "Verification Email Send Successfully",
  "data": null
}
```

**Business behavior:** Checks email and username, bcrypt-hashes the password, creates the user, generates a random six-digit OTP with `generateOtp()`, stores its bcrypt hash with a ten-minute expiry, and sends the verification email through Nodemailer. The OTP itself is not returned in the API response.

**Errors:** `400` validation failure; `409` `User Already Exist`; database or other thrown failures become `500` through the error middleware.

### POST `/verify-otp`

**Authentication:** Public. **Permissions:** None found.

Verifies the email OTP and creates an authenticated session.

**Request body**

```json
{ "email": "ada@example.com", "otp": "123456" }
```

**Validation:** Email format and six numeric OTP characters; strict body.

**Success:** HTTP `200`, sets `refreshToken` cookie, and returns the access token.

```json
{
  "success": true,
  "message": "OTP verify successfully",
  "data": { "accessToken": "<jwt>" }
}
```

**Business behavior:** Finds the OTP by email, checks expiry, compares its bcrypt hash, marks the user verified, deletes the OTP, creates a session, and signs access/refresh JWTs.

**Errors:** `400` validation; `404` OTP not found, expired, or invalid; thrown failures become `500`.

### POST `/resend-otp`

**Authentication:** Public. **Permissions:** None found.

**Request body**

```json
{ "email": "ada@example.com" }
```

**Validation:** Required valid email; strict body.

**Success:** HTTP `200`, with the result returned by the email service in `data`.

**Business behavior:** Looks up the existing OTP, replaces its hash, and sends fixed OTP `789012`. The repository method accepts a new expiry but currently does not write that expiry field. This differs from signup, which generates a random OTP.

**Errors:** `400` validation; `404` OTP registration not found; email failures are thrown and become `500` unless represented by an `AppError`.

### POST `/login`

**Authentication:** Public. **Permissions:** None found.

**Request body**

```json
{
  "email": "ada@example.com",
  "password": "at-least-8-characters"
}
```

**Validation:** Required email and password strings; login password has no minimum-length rule in its schema; strict body.

**Success:** HTTP `200`, sets the `refreshToken` cookie, and returns only the access token in JSON.

```json
{
  "success": true,
  "message": "Login successfully",
  "data": { "accessToken": "<jwt>" }
}
```

**Business behavior:** Finds the user, compares bcrypt hashes, creates a session with IP/user agent, and signs a 15-minute access token plus a 7-day refresh token. Unverified users are not rejected by the service.

**Errors:** `400` validation; `404` user not found; `401` incorrect password; thrown failures become `500`.

### GET `/refresh-token`

**Authentication:** Requires the `refreshToken` cookie in practice. The route-level cookie validator is commented out.

**Request:** No body, path, or query parameters. Cookie:

```text
refreshToken=<jwt>
```

**Success:** HTTP `200`, replaces the cookie, and returns a new access token.

```json
{
  "success": true,
  "message": "access token generated successfully",
  "data": { "accessToken": "<jwt>" }
}
```

**Business behavior:** Verifies the JWT, finds the session, rejects `revoke: true`, signs replacement tokens, and stores the new refresh-token hash. The stored hash is not compared with the presented token.

**Errors:** Missing cookie returns HTTP `401` but currently has `success: true`; invalid, expired, not-active, missing-session, or revoked tokens return `401`.

### GET `/logout`

**Authentication:** Requires the `refreshToken` cookie in practice. The route uses the cookie validator, but the controller also checks it directly.

**Success:** HTTP `200`, marks the identified session revoked, and clears the `refreshToken` cookie.

**Errors:** Missing cookie returns `401` with the current `success: true` inconsistency; missing session returns `401`; JWT verification exceptions are forwarded to centralized error handling.

### GET `/logout-all`

**Authentication:** Requires the `refreshToken` cookie in practice. Route-level validation is not registered.

**Success:** HTTP `200`, marks all non-revoked sessions for the token's user revoked, and clears the current cookie.

**Errors:** Missing cookie returns `401` with the current `success: true` inconsistency; unsuccessful update returns `400`; JWT failures are forwarded to centralized error handling.

### POST `/forgot-password`

**Authentication:** Public in the route, despite the controller comment saying secure. **Permissions:** None found.

**Request body**

```json
{ "email": "ada@example.com" }
```

**Validation:** Required valid email; strict body.

**Success:** HTTP `201`.

```json
{
  "success": true,
  "message": "Reset Password Email Send Successfully",
  "data": null
}
```

**Business behavior:** Generates a random 32-byte token, stores only its SHA-256 hash with a 15-minute expiry, loads the reset template, and emails a link using `FRONTEND_URL`.

**Errors:** `400` validation; `404` user not found; email/template/database failures become `500` unless represented by `AppError`.

### POST `/reset-password`

**Authentication:** Public in the route. The reset token is the credential for this operation.

**Request body**

```json
{
  "token": "<raw-reset-token>",
  "newPassword": "new-password"
}
```

**Validation:** Both fields are required strings; reset password has no minimum-length validator in its schema; strict body.

**Success:** HTTP `201`, clears reset fields, and revokes the user's active sessions.

```json
{
  "success": true,
  "message": "Password Reset Successfully",
  "data": null
}
```

**Errors:** `400` validation; invalid or expired token returns HTTP `404` with `success: false`; other failures become `500`.

## Client cookie behavior

The frontend sends `credentials: "include"`. The server sets the cookie as HTTP-only, secure, strict same-site, and seven days. `secure: true` means local HTTP behavior may require environment-specific handling.

## Not found

No OpenAPI/Swagger specification, health endpoint, user profile endpoint, project endpoint, secret endpoint, or authorization-protected endpoint was found.
