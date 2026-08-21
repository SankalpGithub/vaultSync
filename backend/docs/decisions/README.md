# Architecture Decision Records

This directory is reserved for Architecture Decision Records (ADRs). The repository does not contain historical ADRs, so the decisions below record observable implementation choices rather than claiming undocumented historical intent.

## ADR format

New records should include:

- Status
- Decision
- Context
- Alternatives
- Consequences/trade-offs
- Links to affected source files

When the reason cannot be established from code or repository documentation, write: **Historical reason is not documented in the repository.**

## Observable decisions

### ADR-001: Layered route/controller/service/repository structure

- **Status:** Implemented.
- **Decision:** Routes dispatch through middleware and controllers; auth business logic is in services; persistence is behind repositories and Mongoose models.
- **Context:** This is the dependency direction used by the current auth implementation.
- **Alternatives:** Direct controller-to-model access, or a different application framework.
- **Reason:** Historical reason is not documented in the repository. The observable benefit is separation of HTTP handling, use-case logic, and persistence.
- **Trade-offs:** More files and indirection for small operations, but clearer boundaries for extension and testing.

### ADR-002: JWT access and refresh tokens with a cookie refresh channel

- **Status:** Implemented.
- **Decision:** Issue 15-minute access JWTs in JSON and 7-day refresh JWTs in an HTTP-only `refreshToken` cookie.
- **Context:** Login and OTP verification create both tokens; refresh replaces the cookie.
- **Alternatives:** Server-side sessions only, access tokens in cookies, or returning both tokens in JSON.
- **Reason:** Historical reason is not documented in the repository.
- **Trade-offs:** Short access lifetime limits exposure, while cookie-based refresh requires credentialed CORS and correct HTTPS/cookie deployment configuration.

### ADR-003: Hash credentials and token material before persistence

- **Status:** Implemented.
- **Decision:** Use bcrypt for passwords and OTPs, and SHA-256 for refresh/reset token values stored in MongoDB.
- **Context:** `src/utils/hash.ts` provides the shared implementation.
- **Alternatives:** Plaintext persistence or another password/token storage mechanism.
- **Reason:** Historical reason is not documented in the repository.
- **Trade-offs:** Hash comparison adds work and token recovery is impossible from stored hashes, which is desirable for these credentials.

### ADR-004: Environment validation at startup

- **Status:** Implemented.
- **Decision:** Parse `process.env` with Zod before server startup and fail when required values are absent or invalid.
- **Context:** `env.config.ts` imports dotenv and parses `env.validation.ts`.
- **Alternatives:** Read environment values ad hoc at call time or provide unchecked defaults.
- **Reason:** Historical reason is not documented in the repository.
- **Trade-offs:** Configuration errors fail early, but required email credentials prevent startup even when email functionality is not being exercised.

### ADR-005: Current backend scope is authentication only

- **Status:** Current repository state.
- **Decision:** Only `/api/v1/auth` is mounted in the root router.
- **Context:** Organization, project, and secret model files are empty; no corresponding routes, services, or repositories were found.
- **Alternatives:** Treat planning documents or empty model files as implemented functionality.
- **Reason:** Historical reason is not documented in the repository.
- **Trade-offs:** The runtime is narrow and understandable, but planned secret-management capabilities are not available through this backend.
