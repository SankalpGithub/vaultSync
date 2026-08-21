# Project Structure

## Repository layout

```text
Secret-management-system/
├── README.md
├── backend/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── README.md
│   ├── VALIDATOR_GUIDE.md
│   ├── src/
│   └── test/
├── Frontend/my-app/
│   ├── package.json
│   └── src/
├── documentation/
│   ├── api/
│   ├── arc/
│   ├── database/
│   └── planning/
└── docs/
```

## Backend source

| Path                                         | Purpose and important files                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `backend/src/app.ts`                         | Creates the Express app, registers global middleware, and mounts `/api/v1`.                                      |
| `backend/src/server.ts`                      | Loads validated environment configuration, connects to MongoDB, and starts the HTTP server.                      |
| `backend/src/routes/`                        | `root.routes.ts` mounts `auth.routes.ts` at `/auth`; `auth.routes.ts` defines all currently mounted endpoints.   |
| `backend/src/controllers/`                   | `auth.controller.ts` translates Express requests into service calls and manages the refresh-token cookie.        |
| `backend/src/services/auth/`                 | Use cases for signup/OTP, login, refresh, logout, resend OTP, and password reset.                                |
| `backend/src/services/nodemailer.service.ts` | Active Gmail OAuth2 email transport.                                                                             |
| `backend/src/services/mailjet.service.ts`    | Entirely commented-out Mailjet alternative; not runtime code.                                                    |
| `backend/src/repository/`                    | User, OTP, and session persistence operations.                                                                   |
| `backend/src/models/`                        | Active `User`, `otps`, and `sessions` Mongoose schemas. Organization, project, and secret model files are empty. |
| `backend/src/types/`                         | Request/auth and model TypeScript interfaces.                                                                    |
| `backend/src/validation/`                    | Environment schema, reusable field validators, request schema builder, and auth request schemas.                 |
| `backend/src/middlewares/`                   | Async error forwarding, request validation, HTTP logging, and centralized error handling.                        |
| `backend/src/utils/`                         | `AppError`, OTP generation, hashing, logger, and response envelope helper.                                       |
| `backend/src/templates/`                     | OTP TypeScript HTML template and password-reset HTML template.                                                   |
| `backend/src/configs/`                       | MongoDB connection and environment loading.                                                                      |
| `backend/src/constant.ts`                    | Refresh-token cookie name.                                                                                       |
| `backend/test/`                              | Empty directory; no executable tests found.                                                                      |

## Frontend integration

`Frontend/my-app/src/lib/auth.ts` calls the backend at the hard-coded local URL `http://localhost:5000/api/v1/auth` and sends `credentials: "include"`. `AuthContext.tsx` stores the access token in React state, attempts refresh on mount, and exposes signup, login, OTP, logout, and refresh operations.

## Existing documentation outside `docs/`

- `backend/README.md` contains an earlier backend/auth guide.
- `backend/VALIDATOR_GUIDE.md` describes intended validator usage, but some examples reference APIs and types not present in the current validator implementation. The source files are authoritative.
- `documentation/planning/SRS.md` describes planned authorization, projects, secrets, versioning, import/export, encryption, rate limiting, and operational targets. These requirements are not implemented in the mounted backend.
- `documentation/api/auth/auth.flowcharts.excalidraw` contains an existing diagram artifact.

## Extension boundary

For a new implemented backend feature, the current convention is:

```text
route -> validation middleware -> asyncHandler -> controller -> service -> repository -> model
```

Email, hashing, JWT, response formatting, and logging should remain behind their existing utilities/services where applicable.
