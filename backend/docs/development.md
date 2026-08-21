# Development Guide

## Prerequisites and setup

Install Node.js, pnpm, and MongoDB. From the repository root:

```bash
cd backend
pnpm install
```

Create `backend/.env` using [configuration.md](configuration.md). Gmail OAuth2 values are required by startup validation even when a particular request does not send email.

## Commands

```bash
pnpm dev      # Watch src/server.ts with tsx
pnpm build    # Compile TypeScript to dist/
pnpm start    # Run dist/server.js
pnpm test     # Currently a placeholder that exits with an error
```

No backend lint or formatting script is declared in `backend/package.json`. The frontend has its own `lint` script and is outside this backend guide.

## Debugging

The development server uses `tsx watch`. Use the terminal output and Winston logs under `backend/logs/`. HTTP completion logs include method, URL, status, duration, and IP. The server must connect to MongoDB before it begins listening.

Do not log passwords, OTPs, access tokens, refresh tokens, reset tokens, or hashes. The current reset-password service contains a `console.log` of the reset-token hash; this should be treated as a security issue during development and production review.

## Adding an API endpoint

Follow the implemented flow:

```text
route -> validation schema -> validateReq -> asyncHandler -> controller -> service -> repository -> model
```

1. Add a Zod request schema in `backend/src/validation/` using `createRequestSchema` and reusable validators where appropriate.
2. Add a service function for business logic in the relevant `services/` area.
3. Add repository methods for database access rather than querying Mongoose from the controller.
4. Add or update a Mongoose model only when persistence requires it.
5. Add a controller that reads validated request data, calls the service, and uses `sendResponse`.
6. Register the controller and validator in the relevant router.
7. Ensure async failures are inside `asyncHandler`.
8. Document the route in `docs/api.md` and add tests once a test runner exists.

## Adding a service

Services currently return `ResponseData` objects for expected business outcomes and throw for failures that should reach centralized error handling. Keep Express request/response objects out of services; pass only the values the use case needs. Reuse `createHash`, `compareHash`, `hashToken`, `sendEmail`, and the repositories rather than duplicating those concerns.

## Adding a database model

1. Define a TypeScript model interface in `src/types/models/`.
2. Define a Mongoose schema in `src/models/` with required fields, defaults, refs, enum constraints, and timestamps as needed.
3. Export the model.
4. Add a repository module exposing focused operations.
5. Call the repository from a service.
6. Update [database.md](database.md) with fields, indexes, relationships, and lifecycle behavior.

No migration framework is present, so schema/index changes require an explicit operational plan.

## Adding validation or middleware

`validateReq` validates a complete request object containing body, query, params, headers, and cookies. Request schemas are strict for bodies by default. Invalid data is forwarded as `AppError(..., 400)`. Global middleware belongs in `src/app.ts`; route-specific middleware belongs in the route declaration.

If adding authentication middleware, define how the verified user is attached to the request and document it in [authentication.md](authentication.md). No such middleware currently exists.

## Testing status

`backend/test/` is empty and `pnpm test` is a placeholder. Not found in the repository: a test runner, unit tests, integration tests, fixtures, mocks, coverage configuration, or CI test job.

## Review checklist

- Confirm the route is mounted and its documented HTTP method matches implementation.
- Verify request schemas reject unknown or malformed input as intended.
- Verify response status and envelope through `sendResponse`.
- Verify thrown errors reach `errorMiddleware`.
- Verify database fields match both TypeScript interfaces and Mongoose schemas.
- Check logs for sensitive data.
- Run `pnpm build` before handing off the change.
