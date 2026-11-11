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

Project routes require a valid access token. Creating a project environment is
restricted to the project owner.

## Validation rules

Auth request bodies use strict Zod objects unless otherwise noted. Unknown body fields are rejected. Shared validators are:

- Email: trimmed string in email format.
- Password on signup: string, minimum 8 characters.
- Name: string, 2 to 100 characters.
- Project environment name: trimmed string, 1 to 50 characters.
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

### POST `/project/:projectId/environments`

**Authentication:** Requires a valid access token in the `Authorization: Bearer <token>` header. The authenticated user must own the project.

Adds a custom environment to the project.

**Request body**

```json
{ "name": "qa" }
```

**Validation:** `projectId` must be a MongoDB ObjectId. `name` is required, trimmed, and limited to 50 characters; the stored name is lowercase. The body and path parameters are strict.

**Success:** HTTP `201`. The new environment is returned with `isDefault: false`.

```json
{
  "success": true,
  "message": "Environment created successfully",
  "data": { "name": "qa", "isDefault": false }
}
```

**Errors:** `400` for invalid input; `404` when the project does not exist or is not owned by the authenticated user; `409` if the project already has an environment with that name, ignoring case.

### PATCH `/project/:projectId`

**Authentication:** Requires a valid access token. The authenticated user must own the project.

Updates the project's name, description, and visibility. `projectId` must be a
MongoDB ObjectId; the strict request body requires `name` and `visibility`, and
accepts an optional `description` up to 500 characters.

```json
{
  "name": "payments-api",
  "description": "Core payments service",
  "visibility": "private"
}
```

**Errors:** `400` for invalid input or a duplicate project name in the organization; `404` if the project is not found or is not owned by the authenticated user.

Secrets can only be assigned to environments configured on their project. If a
secret request omits `environment`, it defaults to `development`.

### PATCH `/secret/:secretId`

**Authentication:** Requires a valid access token.

Updates a secret's key, value, or both. Either field may be omitted to preserve
its current value. Any supplied secret value is encrypted by the server. The
secret version is incremented, and the authenticated user is recorded as the
updater.

**Request body**

```json
{
  "key": "DATABASE_URL",
  "value": "new-secret-value"
}
```

**Validation:** `secretId` must be a MongoDB ObjectId. `key` and `value` are
optional non-empty strings, but at least one must be provided. The body and
path parameters are strict.

**Success:** HTTP `200`, with the updated secret in `data`.

**Errors:** `400` for invalid input; `404` if the secret is not found; `409` if
another secret in the same environment already uses the requested key.

### PATCH `/project/:projectId/environments/:environmentId`

**Authentication:** Requires a valid access token. The authenticated user must own the project.

Renames a non-default environment.

**Request body**

```json
{ "name": "qa" }
```

**Validation:** Both path IDs must be MongoDB ObjectIds. The trimmed name is required and limited to 50 characters; it is stored lowercase.

**Success:** HTTP `200`, with the renamed environment in `data`.

Existing active secrets in the environment are moved to the new environment name.

**Errors:** `400` for invalid input or an attempt to rename a default environment; `404` if the project or environment is not found; `409` if another environment in the project already has the requested name, ignoring case.

### DELETE `/project/:projectId/environments/:environmentId`

**Authentication:** Requires a valid access token. The authenticated user must own the project.

Deletes a non-default environment.

**Success:** HTTP `200`.

```json
{
  "success": true,
  "message": "Environment deleted successfully",
  "data": null
}
```

**Errors:** `400` for an attempt to delete a default environment; `404` if the project or environment is not found.

## Client cookie behavior

The frontend sends `credentials: "include"`. The server sets the cookie as HTTP-only, secure, strict same-site, and seven days. `secure: true` means local HTTP behavior may require environment-specific handling.

## Not found

No OpenAPI/Swagger specification was found.
