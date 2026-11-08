# Secret Management System

Secret Management System manages application secrets across developers and
environments. The backend provides an Express/MongoDB authentication service
and project and secret-management APIs.

## Technologies

- Backend: Node.js, TypeScript, Express 5, Mongoose, MongoDB
- Authentication: bcrypt, JSON Web Tokens, HTTP-only cookies
- Validation: Zod
- Email: Nodemailer with Gmail OAuth2
- Logging/security middleware: Winston, Helmet, CORS, cookie-parser
- Frontend: Next.js, React, TypeScript
- Package manager: pnpm

## Architecture

```text
Client -> Express app -> route -> validation -> controller
	-> service -> repository -> Mongoose model -> MongoDB
```

The backend mounts authentication at `/api/v1/auth`, organization routes at
`/api/v1/org`, project routes at `/api/v1/project`, and secret routes at
`/api/v1/secret`. The secret APIs encrypt values on the backend before storing
them; see the [secret data flow and encryption guide](backend/docs/secret-data-flow.md).

## Prerequisites

- Node.js
- pnpm 10.17.1 or compatible
- MongoDB
- Gmail OAuth2 credentials for the configured email service

## Backend setup

```bash
cd backend
pnpm install
```

Create `backend/.env` with the variables documented in
[docs/configuration.md](docs/configuration.md). Do not commit credentials.

## Run locally

```bash
cd backend
pnpm dev
```

The server connects to MongoDB before listening. The default configured port
is `3000`; the frontend integration currently expects port `5000`.

## Build and production startup

```bash
cd backend
pnpm build
pnpm start
```

`pnpm start` runs the compiled `dist/server.js`. No Docker, CI/CD, cloud
hosting, reverse proxy, or infrastructure configuration was found.

## Tests and quality checks

The backend `test/` directory is empty and `pnpm test` is a placeholder that
exits with an error. No backend lint or formatting script is declared. Run
`pnpm build` as the available compile check.

## Documentation

- [Architecture](docs/architecture.md)
- [Project structure](docs/project-structure.md)
- [API reference](docs/api.md)
- [Secret data flow and encryption](backend/docs/secret-data-flow.md)
- [Database](docs/database.md)
- [Authentication](docs/authentication.md)
- [Error handling](docs/error-handling.md)
- [Configuration](docs/configuration.md)
- [Deployment](docs/deployment.md)
- [Development guide](docs/development.md)
- [Architecture decisions](docs/decisions/README.md)
- [RBAC permissions planning](documentation/planning/rbac-permissions-planning.md)

## Important development notes

Documentation is based on the current implementation, not only the planning
documents. Signup now generates a random six-digit OTP and sends it through the
configured email service; the resend service still uses its current fixed OTP
value. Access-token authorization is not implemented. Review the implementation
notes in the detailed documents before using the backend as a production
authentication service.
