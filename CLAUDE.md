# auto-poc

## Tech Stack
- **Framework:** React 19 + TypeScript (strict mode)
- **Build:** Vite 7
- **Routing:** React Router v7 (v6 API)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Linting:** ESLint 9 (flat config)
- **Deployment:** GitHub Pages (static SPA)

## Project Structure
```
src/                  — App source code
  components/         — Reusable React components
  pages/              — Route-level page components
  hooks/              — Custom React hooks
  utils/              — Utility functions
  types/              — TypeScript type definitions
  router.tsx          — React Router configuration
  App.tsx             — Root app component
  main.tsx            — Entry point
e2e/                  — Playwright E2E tests
public/               — Static assets (404.html for SPA routing)
scripts/              — Agent and build scripts
.devcontainer/        — Codespace configuration
.github/workflows/    — CI/CD workflows
```

## Key Commands
- `npm run dev` — Start dev server (port 5173)
- `npm run build` — Type-check + build for production
- `npm run lint` — Run ESLint
- `npm run type-check` — TypeScript check (no emit)
- `npm test` — Run Vitest unit tests
- `npm run test:e2e` — Run Playwright E2E tests

## Conventions
- **Components:** Functional components only, PascalCase filenames
- **TypeScript:** Strict mode, no `any` unless absolutely necessary
- **Exports:** Named exports preferred, default export for page components
- **Tests:** Colocated with source (e.g., `App.test.tsx` next to `App.tsx`)
- **E2E Tests:** In `e2e/` directory
- **Commits:** Conventional commits (feat:, fix:, chore:, etc.)
- **Styling:** CSS modules or plain CSS, no CSS-in-JS

## Critical Rules
- **NEVER hardcode base paths.** Always use `import.meta.env.BASE_URL` for asset and route paths
- **NEVER delete `public/404.html`** — it handles SPA routing on GitHub Pages
- **NEVER modify `scripts/post-build.sh`** without understanding the 404.html patching logic
- The `VITE_BASE_PATH` env var controls the build base path:
  - Dev: `/` (default)
  - Production: `/<repo-name>/`
  - PR Preview: `/<repo-name>/pr-preview/pr-N/`
- React Router basename is set dynamically from `import.meta.env.BASE_URL`
