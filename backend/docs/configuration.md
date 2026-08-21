# Configuration

## Loading and validation

`src/configs/env.config.ts` calls `dotenv.config()` and parses `process.env` with the Zod schema in `src/validation/env.validation.ts`. The parsed object is exported as `env`. `server.ts` imports it before connecting to MongoDB and listening.

All fields below are required by the schema unless a default is stated.

| Variable               | Required | Purpose                                                   | Example                                       |
| ---------------------- | -------- | --------------------------------------------------------- | --------------------------------------------- |
| `PORT`                 | No       | HTTP listener port. Coerced to number; default is `3000`. | `5000`                                        |
| `FRONTEND_URL`         | Yes      | Base URL used in password-reset links.                    | `http://localhost:3000`                       |
| `MONGO_URI`            | Yes      | MongoDB connection string.                                | `mongodb://127.0.0.1:27017/secret-management` |
| `JWT_SECRET`           | Yes      | JWT signing key for access and refresh tokens.            | `<long-random-secret>`                        |
| `NODE_ENV`             | Yes      | Must be `development`, `production`, or `test`.           | `development`                                 |
| `GOOGLE_CLIENT_ID`     | Yes      | Gmail OAuth2 client ID for Nodemailer.                    | `<oauth-client-id>`                           |
| `GOOGLE_CLIENT_SECRET` | Yes      | Gmail OAuth2 client secret.                               | `<oauth-client-secret>`                       |
| `GOOGLE_REFRESH_TOKEN` | Yes      | Gmail OAuth2 refresh token.                               | `<oauth-refresh-token>`                       |
| `GOOGLE_USER`          | Yes      | Gmail sender account.                                     | `sender@example.com`                          |

`LOG_LEVEL` is also read by `src/utils/logger.ts`, but it is not part of the startup Zod schema. It changes the Winston logger level; production defaults to `info`, and non-production defaults to `debug`.

## Local environment

Create `backend/.env` locally. Environment files are ignored by the repository `.gitignore`; no `.env.example` was found.

```dotenv
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/secret-management
JWT_SECRET=<long-random-secret>
NODE_ENV=development
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REFRESH_TOKEN=<refresh-token>
GOOGLE_USER=<sender-address>
LOG_LEVEL=debug
```

Never commit real credentials. The repository contains no secret-manager integration.

## Runtime configuration not centralized

- CORS origin is hard-coded to `http://localhost:3000` in `src/app.ts` rather than read from `FRONTEND_URL`.
- Cookie flags are hard-coded in auth controllers.
- The email sender `from` address uses `process.env.EMAIL_USER`, which is not in the validated environment schema and is not listed as a required startup variable.
- `PORT` defaults to 3000, while the frontend integration currently assumes backend port 5000.

## Environments

The schema accepts `development`, `production`, and `test`, and the logger changes its default level for production. No environment-specific deployment files, configuration overlays, or test configuration were found.
