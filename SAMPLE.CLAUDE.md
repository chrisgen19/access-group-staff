You are an expert Next.js developer. Help me build a Next.js 16 app using the following stack:

## Stack

### Required
- **Framework:** Next.js 16 (App Router), TypeScript 5.1+, Node.js 20.9+
- **Package Manager:** bun — do not use npm or yarn
- **Linting/Formatting:** Biome — do not use ESLint or Prettier
- **Auth:** better-auth (email/password + Google + Microsoft)
- **Database:** prisma + PostgreSQL (Neon / Supabase / self-hosted)
- **Styling:** Tailwind CSS v4 + shadcn/ui + lucide-react
- **Forms:** react-hook-form + zod + @hookform/resolvers
- **Toasts:** sonner
- **Env Vars:** @t3-oss/env-nextjs

### Optional (include only if this project needs it)
- **Client State:** zustand — only if global UI state is needed
- **Server State:** @tanstack/react-query — only for interactive client-side data (polling, optimistic updates, pagination)
- **Email:** resend + react-email — only if the app sends emails
- **File Uploads:** uploadthing — only if the app handles file uploads
- **Payments:** stripe — only if the app has billing
- **Dark Mode:** next-themes — only if the app supports dark mode

### Testing
- vitest — unit & integration tests
- @testing-library/react — component testing
- @testing-library/user-event — simulating user interactions
- @testing-library/jest-dom — DOM assertions (toBeInTheDocument, toHaveValue, etc.)
- msw — mocking API/fetch calls in tests
- playwright — E2E testing

---

## Project
**Name:** [EDIT]
**Description:** [EDIT: What does this app do?]
**Current task:** [EDIT: What do you want built right now?]
**Optional packages needed:** [EDIT: e.g., zustand, react-query, resend, uploadthing, stripe, next-themes / N/A]

---

## Rules
### General
- Prefer Server Components. Use "use client" only when needed.
- Fetch data in Server Components using async/await by default — no library needed.
- Prefer Server Actions for user-initiated mutations and form submissions; use Route Handlers for webhooks, third-party callbacks, and public API endpoints.
- Use React Query only for interactive client-side state that needs caching, background refetching, optimistic updates, or pagination.
- Do not use useEffect for standard data fetching. Use Server Components by default, or React Query for interactive client-side server state. useEffect is still valid for subscriptions, DOM integrations, and browser-only work.
- All forms must use react-hook-form + zod.
- All env vars must go through env.ts, never access process.env directly.
- Never use `any`. Use `unknown` and narrow it.
- Validate on both client AND server — never trust client input.
- Use sonner for global feedback (success, errors, notifications); use inline field errors for form validation.
- Return `{ success: true, data }` or `{ success: false, error }` from Server Actions.
- Route Handlers must also return consistent JSON: `{ success: true, data }` or `{ success: false, error }` with appropriate HTTP status codes (200, 400, 401, 404, 500).
- Use cn() (clsx + tailwind-merge) for conditional classes.
- Treat components/ui/ as low-level primitives — prefer wrapping them in feature components rather than editing them directly.
- Only install optional packages listed under "Optional packages needed" above.
- Always use `bun` for installing packages — never npm or yarn. If a tool requires npx explicitly (e.g., Playwright CLI, shadcn CLI), that is acceptable.
- Prisma CLI commands (`prisma generate`, `prisma migrate`, `prisma db push`) may occasionally have edge case issues with bun. If `bun` fails on Prisma CLI commands, fall back to `bunx` or `npx` for those specific commands.
- Always use Biome for linting and formatting — never ESLint or Prettier.

### Auth (better-auth)
- `proxy.ts` at the project root replaces `middleware.ts` in Next.js 16 — use it for route protection (redirecting unauthenticated users).
- `proxy.ts` runs on Node.js runtime only — edge runtime is not supported.
- `app/api/auth/[...all]/route.ts` is the better-auth catch-all handler — this handles all auth requests (login, register, OAuth callbacks, etc.).
- Access sessions in Server Components via `auth.api.getSession({ headers: await headers() })`.
- Access sessions on the client via `useSession()` from `lib/auth-client.ts`.
- Never invent a custom auth check pattern — always use the above.

### Caching
- `cacheLife` and `cacheTag` are stable in Next.js 16 — do not use the `unstable_` prefix.
- Use `use cache` directive for caching pages, components, and functions.
- Use `revalidateTag` for background revalidation (stale-while-revalidate).
- Use `updateTag` inside Server Actions for immediate read-your-writes updates.

### Database (Prisma)
- Schema is defined in `prisma/schema.prisma`.
- Run `bunx prisma generate` after every schema change to update the client.
- Add `"postinstall": "prisma generate"` to `package.json` so the client auto-generates after every `bun install` — required for CI and teammates.
- In development: use `bunx prisma db push` to sync schema without migration files.
- In production: always use `bunx prisma migrate deploy` — never push directly to production.
- Access the DB via a singleton client in `lib/db/index.ts` to avoid connection exhaustion.
- Use transactions via `prisma.$transaction()` for multi-step writes.
- Use a pooled connection string for serverless deployments (Vercel); use a direct connection string for long-running servers (Coolify). Consider Prisma Accelerate or Neon's pooler URL for Vercel.
- Run `bunx prisma studio` for visual database browsing in development — do not suggest third-party DB GUIs.
- Run `bunx prisma format` to auto-format `schema.prisma` — Biome does not format Prisma files.
- Add a `prisma/seed.ts` file for development seed data.
- Add `"prisma": { "seed": "bun prisma/seed.ts" }` to `package.json`.

### Auth (better-auth) + Prisma
- The Prisma adapter is built into better-auth — import `prismaAdapter` from `better-auth/adapters/prisma`. No separate package needed.
- Wire it in `lib/auth.ts`: `database: prismaAdapter(prisma, { provider: "postgresql" })`.
- Run `bunx @better-auth/cli generate` to auto-generate the required auth tables (User, Session, Account, Verification) into `prisma/schema.prisma`.
- Never manually define auth tables — always use the better-auth CLI to generate them.

### Error & Loading States
- Use `error.tsx` per route segment for unexpected errors caught by Next.js.
- Use `loading.tsx` for route-level loading UI; prefer `<Suspense>` boundaries for granular streaming control.
- Wrap all Server Action calls on the client in try/catch; show errors via sonner toasts.
- Never let unhandled promise rejections surface to the user silently.

### Naming
- Files: `kebab-case` (e.g., `stats-card.tsx`)
- Components: `PascalCase` (e.g., `StatsCard`)
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- DB columns: `snake_case` — use Prisma `@map` to map to camelCase in the schema

### Styling (Tailwind v4)
- Tailwind v4 uses CSS-based config — there is no `tailwind.config.ts`.
- Configure theme, custom tokens, and plugins inside your CSS file using `@theme` and `@plugin` directives.
- Do not generate or reference a `tailwind.config.ts` file — it does not exist in v4.

### Testing
- Unit test all utility functions in lib/ and Server Actions.
- Component tests go in __tests__/ next to the component file.
- E2E tests go in /e2e and cover critical user flows only (auth, checkout, etc.).
- Mock external services (DB, email, payments) in unit/component tests using msw or vi.mock().
- Never test implementation details — test behavior and output.

### Do NOT
- Create barrel files (`index.ts` re-exports) — import directly from the source file.
- Add comments explaining obvious code — code should be self-explanatory.
- Install packages not listed in the stack without asking first.
- Create `README.md` or documentation files unless explicitly asked.
- Use default exports except for Next.js pages, layouts, and loading/error files.

---

## Structure

### Component Convention (Hybrid)
- Co-locate components used by a single route inside that route folder as `_components/`
- Centralize components shared across multiple routes in `components/[feature]/`
- shadcn/ui primitives always stay in `components/ui/` regardless

```
app/
└── dashboard/
    ├── page.tsx
    └── _components/        ← only used by /dashboard
        └── StatsCard.tsx
└── projects/
    ├── page.tsx
    └── _components/        ← only used by /projects
        └── ProjectRow.tsx

components/
├── ui/                     ← shadcn/ui primitives (wrap, don't casually edit)
├── shared/                 ← used across 2+ routes (e.g., Header, Sidebar, PageWrapper)
└── [feature]/              ← shared feature components (e.g., /billing, /notifications)
```

### Full Structure
```
app/                          → App Router pages and layouts
app/api/                      → Route Handlers (webhooks, third-party callbacks, public endpoints)
app/[route]/_components/      → components used only by that route
components/ui/                → shadcn/ui primitives (wrap, don't casually edit)
components/shared/            → components shared across 2+ routes
components/[feature]/         → shared feature-specific components
lib/auth.ts                   → better-auth server instance
lib/auth-client.ts            → better-auth client instance
prisma/schema.prisma          → Prisma schema
lib/db/index.ts               → Prisma client singleton
lib/validations/              → zod schemas (shared across client & server)
stores/                       → zustand stores (if needed)
hooks/                        → custom React hooks
emails/                       → react-email templates (if needed)
env.ts                        → typed env via @t3-oss/env-nextjs
e2e/                          → playwright E2E tests
```

---

## Deployment
- **Primary:** Vercel — zero config, all Next.js 16 features supported out of the box
- **Self-hosted:** Coolify using Nixpacks — ensure the app builds correctly as a standalone Next.js output

Add this to `next.config.ts` for standalone output (required for Coolify/Nixpacks):
```ts
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```

- Never hardcode environment variables — all secrets must be configured in Vercel's or Coolify's environment variable settings
- The same codebase deploys to both — no environment-specific code

---

## Notes
[EDIT: Any domain logic, multi-tenancy, currency format, business rules, etc.]