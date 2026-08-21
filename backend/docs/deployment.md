# Deployment

## Repository evidence

The backend provides these package scripts:

- `pnpm dev`: `tsx watch src/server.ts`
- `pnpm build`: `tsc`
- `pnpm start`: `node dist/server.js`
- `pnpm test`: placeholder command that exits with an error

`tsconfig.json` compiles `src` to `dist` using NodeNext modules and emits JavaScript, declarations, maps, and type checks. MongoDB must be reachable before the server starts listening.

## Deployment configuration status

Not found in the repository:

- Dockerfile or Docker Compose deployment.
- Kubernetes manifests or Helm chart.
- AWS, Azure, GCP, Render, Railway, or Vercel backend configuration.
- Terraform or other infrastructure-as-code.
- Reverse-proxy configuration.
- GitHub Actions or other CI/CD workflows.
- Process manager configuration.
- Health/readiness endpoint.
- Database migration, backup, or restore procedure.

The frontend README contains generic Next.js/Vercel guidance, but no backend deployment process is defined there.

## Verified production start sequence

The only production-like sequence supported by repository scripts is:

```text
pnpm install
pnpm build
pnpm start
```

Before startup, provide all required environment variables in [configuration.md](configuration.md). `server.ts` connects to MongoDB and only then calls `app.listen`.

## Operational considerations from code

- Expose the configured port through the hosting platform.
- Ensure MongoDB connectivity from the runtime.
- Provide Gmail OAuth2 credentials if email flows are enabled.
- Use HTTPS because auth cookies are configured with `secure: true`.
- Configure the frontend origin consistently with the hard-coded CORS setting or update the application configuration before deployment.
- Persist or ship the `logs/combined.log` and `logs/error.log` files if file logs are needed; Winston rotates each file at 10 MB and keeps five files.
- Do not treat the presence of a successful TypeScript build as evidence of deployment readiness; no automated tests or health checks are present.

No deploy command or hosting target can be documented more specifically because it is not found in the repository.
