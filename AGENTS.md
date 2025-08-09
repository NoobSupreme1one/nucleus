# Repository Guidelines

## Project Structure & Module Organization
- `client/`: React + Vite app (entry `client/src/main.tsx`).
- `server/`: Express API (`server/index.ts`), routes, middleware, and tests in `server/tests/`.
- `shared/`: Reusable TS utilities and types.
- `tests/e2e/`: Playwright end-to-end specs.
- `prisma/`: Prisma schema and generated client.
- `infrastructure/`, `serverless.yml`: IaC and deployment configs.
- Build output: `dist/` (server bundle), Playwright artifacts in `test-results/`.

## Build, Test, and Development Commands
- `npm run dev`: Start server in dev with Vite middleware.
- `npm run build`: Build client (Vite) and bundle server (esbuild) to `dist/`.
- `npm start`: Run production server from `dist/index.js`.
- `npm test`: Run unit (Vitest) and integration (Jest) suites.
- `npm run test:e2e`: Run Playwright E2E tests.
- `npm run test:coverage`: Generate coverage for Vitest and Jest.
- `npm run check`: Type-check all TS sources.
- Prisma: `npm run db:generate | db:push | db:migrate | db:studio`.

## Coding Style & Naming Conventions
- Language: TypeScript (ESM). Strict mode enabled; path aliases `@/*` and `@shared/*`.
- Indentation: 2 spaces; prefer named exports; use PascalCase for components, camelCase for functions/vars.
- Client file names: `*.tsx` components in `client/src/components`, pages in `client/src/pages`.
- No repo-wide linter configured; keep code formatted consistently and pass `npm run check`.

## Testing Guidelines
- Unit: Vitest (jsdom) for `client/src/**/*.{test,spec}.tsx?` with setup in `client/src/tests/setup.ts`.
- Integration: Jest for `server/**/*.(test|spec).ts` (see `jest.config.cjs`).
- E2E: Playwright specs under `tests/e2e/*.spec.ts` (baseURL `http://localhost:5000`).
- Coverage: Use `npm run test:coverage`; include meaningful tests for new/changed code.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`) with clear scope and concise body.
- PRs: Include purpose, linked issues, test plan (commands and results), and screenshots for UI changes.
- Checks: Ensure CI scripts pass locally (`npm run check`, `npm test`) and no secrets in diffs.

## Security & Configuration Tips
- Secrets: Use `.env` variants; do not commit secrets. Mirror new variables in `.env.example`.
- Security middleware: CORS, Helmet, input sanitization, and rate limiting are enabled in the server.
- Monitoring: Sentry is integrated; keep DSN/config via env.
- Ports: App serves on `PORT` (default 5000). Ensure this for local and E2E tests.

