# Database

## Database technology

`src/configs/db.config.ts` connects to MongoDB using Mongoose and `MONGO_URI`. The server connects before calling `app.listen`. No migrations, seed scripts, indexes beyond schema-level uniqueness, backup configuration, or database lifecycle tooling were found.

## Collections and schemas

### `User`

Model: `backend/src/models/user.models.ts`.

| Field                    | Type             | Required/default | Constraints and use                                                           |
| ------------------------ | ---------------- | ---------------- | ----------------------------------------------------------------------------- |
| `_id`                    | MongoDB ObjectId | Generated        | Mongoose identifier.                                                          |
| `name`                   | String           | Required         | Signup validation limits it to 2-100 characters.                              |
| `username`               | String           | Required         | Signup validation limits it to 3-50 characters and restricts its characters.  |
| `email`                  | String           | Required         | `unique: true` in the Mongoose schema; signup validation checks email format. |
| `passwordHash`           | String           | Required         | Stores bcrypt output, not the submitted password.                             |
| `hashResetPasswordToken` | String           | Default `null`   | SHA-256 hash of the raw password-reset token.                                 |
| `passwordResetExpires`   | Date             | Default `null`   | Reset-token expiry.                                                           |
| `isEmailVerified`        | Boolean          | Default `false`  | Set true after OTP verification.                                              |
| `createdAt`, `updatedAt` | Date             | Automatic        | Added by `timestamps: true`.                                                  |

### `otps`

Model: `backend/src/models/otp.model.ts`.

| Field                    | Type             | Required/default | Constraints and use                                 |
| ------------------------ | ---------------- | ---------------- | --------------------------------------------------- |
| `_id`                    | MongoDB ObjectId | Generated        | Used when deleting an OTP.                          |
| `userId`                 | ObjectId         | Required         | `ref: "User"`; links the OTP to a user.             |
| `email`                  | String           | Required         | Lookup key used by `findOtp`.                       |
| `otpHash`                | String           | Required         | Bcrypt hash of the OTP.                             |
| `purpose`                | String           | Required         | Enum: `email_verification` or `password_reset`.     |
| `expiresAt`              | Date             | Required         | Checked by verification service.                    |
| `isUsed`                 | Boolean          | Default `false`  | Present in schema but not used by current services. |
| `createdAt`, `updatedAt` | Date             | Automatic        | Added by timestamps.                                |

No unique index, TTL index, or explicit index is declared for OTP documents. The resend repository accepts a new expiry but updates only `otpHash`.

### `sessions`

Model: `backend/src/models/session.model.ts`.

| Field                    | Type             | Required/default   | Constraints and use                                           |
| ------------------------ | ---------------- | ------------------ | ------------------------------------------------------------- |
| `_id`                    | MongoDB ObjectId | Generated          | Embedded in JWT payload as `sessionId`.                       |
| `userId`                 | ObjectId         | Required           | `ref: "User"`; identifies the session owner.                  |
| `refreshTokenHash`       | String           | Optional in schema | SHA-256 hash written during login, verification, and refresh. |
| `ip`                     | String           | Required           | Request IP captured at session creation.                      |
| `userAgent`              | String           | Required           | User-Agent captured at session creation.                      |
| `revoke`                 | Boolean          | Default `false`    | Used by refresh/logout services.                              |
| `createdAt`, `updatedAt` | Date             | Automatic          | Added by timestamps.                                          |

No explicit indexes are declared. `findUserSessions` is available in the repository but is not used by a mounted controller.

## Relationships

```text
User 1 ---- many OTP documents through OTP.userId
User 1 ---- many Session documents through Session.userId
```

The references are declared with `ref: "User"`, but the current repository queries do not use `populate`. OTP lookup also uses email, and session lookup uses the session ObjectId from the JWT.

## Persistence behavior

- Registration creates a user and one OTP document.
- OTP verification updates `isEmailVerified`, deletes the OTP, and creates a session.
- Login creates a session.
- Refresh updates the session's stored refresh hash.
- Logout updates one session's `revoke` flag.
- Logout-all and password reset update active sessions for a user with `updateMany`.
- Password reset writes and later clears the reset-token hash and expiry.

## Not found in the repository

No active organization, project, secret, role, permission, audit, migration, seed, backup, encryption-at-rest, or recovery schema was found. The empty model files do not constitute database structures.
