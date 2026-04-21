# Access Recognition

Internal employee recognition app for Access Group. Team members publicly recognize colleagues via digital thank-you cards tied to company values.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Runtime | Node.js 20+, Bun (package manager) |
| Auth | better-auth (email/password + Google + Microsoft OAuth) |
| Database | PostgreSQL + Prisma 7 |
| Styling | Tailwind CSS v4 + shadcn/ui + Lucide React |
| Forms | React Hook Form + Zod |
| Client State | Zustand |
| Server State | TanStack React Query |
| Toasts | Sonner |
| Linting | Biome |
| Dark Mode | next-themes |
| Env Validation | @t3-oss/env-nextjs |
| Unit Tests | Vitest + React Testing Library + jsdom |
| E2E Tests | Playwright |

## Getting Started

### Prerequisites

- Node.js 20.9+
- [Bun](https://bun.sh) (package manager)
- PostgreSQL (local or Docker)

### Setup

```bash
# Clone and install
git clone https://github.com/chrisgen19/access-group-staff.git
cd access-group-staff
bun install

# Environment variables
cp .env.example .env
# Edit .env with your database URL and auth secrets

# Database
bunx prisma db push
bun prisma/seed.ts

# Run dev server
bun run dev
```

### Environment Variables

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | App base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `MICROSOFT_CLIENT_ID` | Microsoft Entra ID client ID (optional) |
| `MICROSOFT_CLIENT_SECRET` | Microsoft Entra ID client secret (optional) |
| `MICROSOFT_TENANT_ID` | Microsoft Entra ID tenant ID for single-tenant auth (optional, defaults to `common`) |

### Seed Users

| Email | Password | Role |
|-------|----------|------|
| admin@accessgroup.com.au | Password123! | SUPERADMIN |
| eng.admin@accessgroup.com.au | Password123! | ADMIN |
| john.doe@accessgroup.com.au | Password123! | STAFF |
| sarah.jones@accessgroup.com.au | Password123! | STAFF |

## Project Structure

```
app/
├── (auth)/                        # Auth pages (login, register)
├── (dashboard)/                   # Dashboard layout + pages
│   └── dashboard/
│       ├── page.tsx               # Dashboard home
│       ├── users/                 # User management (CRUD, branch assignment)
│       ├── departments/           # Department management (CRUD)
│       ├── recognition/           # Personal recognition inbox (received/sent tabs)
│       │   └── create/            # Send Recognition Card (branded 2-step form)
│       ├── helpme/                # Help Me Tickets (staff raise, admins respond)
│       │   ├── new/               # Create ticket form (rich text)
│       │   └── [id]/              # Ticket detail + threaded replies
│       ├── leaderboard/           # Monthly leaderboard
│       ├── admin-settings/        # Admin settings (ADMIN+)
│       ├── super-admin/           # Super admin panel (SUPERADMIN only)
│       └── profile/               # Profile + Preferences
│           ├── connected-accounts/ # OAuth account linking (Google, Microsoft)
│           └── preferences/       # Background color, card view, card size
├── api/
│   ├── auth/[...all]/             # better-auth catch-all handler
│   ├── recognition/               # Recognition Cards API (filter, search, export CSV)
│   │   ├── stats/                 # Recognition stats (sent/received counts, leaderboard)
│   │   └── users/                 # Active users for recipient picker
│   └── users/                     # Users API (React Query)
└── globals.css                    # Tailwind v4 theme (CSS variables)

components/
├── ui/                            # shadcn/ui primitives (do not edit)
└── shared/                        # Shared components (sidebar, header, logos, help-fab, etc.)

lib/
├── auth.ts                        # better-auth server config
├── auth-client.ts                 # better-auth client
├── auth-utils.ts                  # Session helpers (requireSession, requireRole)
├── permissions.ts                 # Role-based permission checks
├── recognition.ts                 # Shared types, constants, and utils for recognition
├── actions/                       # Server Actions (user, department, profile, recognition, helpme, notifications)
├── validations/                   # Zod schemas (user, auth, department, recognition, helpme)
└── db/index.ts                    # Prisma client singleton

stores/                            # Zustand stores
prisma/
├── schema.prisma                  # Database schema
└── seed.ts                        # Seed data
proxy.ts                           # Route protection (replaces middleware.ts)
env.ts                             # Typed env via @t3-oss/env-nextjs
```

## Database Schema

**Models:** User, Session, Account, Verification, Department, RecognitionCard, CardReaction, CardComment, ActivityLog, Notification, HelpMeTicket, TicketReply, ShiftSchedule, AppSetting, MonthlyLeaderboardSnapshot

**Roles:** `SUPERADMIN` > `ADMIN` > `STAFF`

**Branch:** `ISO` | `PERTH` (optional field on User)

- SUPERADMIN can access Super Admin panel and all admin features
- ADMIN can manage users, departments, and access Admin Settings
- All authenticated users can send and view recognition cards
- STAFF can view dashboard, recognition inbox, and edit own profile
- Soft-deleted users (`deletedAt != null`) are blocked at proxy and session level and hidden from the default staff directory; admins can toggle "Show deleted" to view and restore them

### Dashboard

- 2-column widget layout: Recognition Stats (left) + Public Recognition Feed (right)
- Stats widget: cards sent/received, monthly total, top 3 most recognized leaderboard
- Feed widget with Public / My Department tabs
- Send Recognition Card button

### Recognition Cards

- **Create**: Branded 2-step form (Fill Card → Review & Submit) using Access Group physical card design with both logos and company values
- **Inbox** (`/dashboard/recognition`): Personal inbox with Received / Sent tabs
- **Feed**: Mini branded card view replicating the physical card design, or simple list view (configurable in preferences)
- Cards include a message, date, and one or more company values: People, Safety, Respect, Communication, Continuous Improvement
- Card size preference: Compact / Normal / Expanded
- **Admin All Table**: Filter bar with search by name, company values toggle (AND logic), and month/year dropdowns
- **CSV Export**: Export filtered recognition cards as CSV matching `export-sample.csv` structure — columns: Department, Team Member, Role, Date Received, Receivers/Givers Branch, Given By, Message, Values (x/blank), Quarter Received

### Preferences

- Background color: Light Gray, Warm White, Cool White, Pure White, Cream (default), Slate
- Card view: Physical Card (branded mini card) or Simple (compact list)
- Card size: Compact, Normal, Expanded

### Help Me Tickets

Internal HR / IT / company-issue ticketing with threaded replies.

- `/dashboard/helpme` — role-branched list: STAFF see only their own tickets, ADMIN/SUPERADMIN see all with the raiser column
- `/dashboard/helpme/new` — create form (TipTap rich text, react-hook-form + zod)
- `/dashboard/helpme/[id]` — ticket detail + threaded replies (edit/delete for own replies; admins cannot delete others' replies)
- **Admin name masking** — STAFF viewers see "Admin" + shield icon on ADMIN/SUPERADMIN replies; admins see real names
- **Server-side sanitization** — all rich-text writes pass through `isomorphic-dompurify` (formatting tags allowlist, `http`/`https`/`mailto` URLs only; `javascript:` and event handlers stripped)
- **Global Help FAB** — floating action button on all `/dashboard/*` pages (hidden on `/dashboard/helpme/*` to avoid duplicating the in-page CTA); links unauthenticated visitors through `/login?callbackUrl=...`
- **Categories**: HR, IT & Website, Facilities, Other (`PAYROLL` retained in the Prisma enum but inactive — see `prisma/schema.prisma` notes)
- **Statuses**: OPEN → IN_PROGRESS → RESOLVED → CLOSED. Reply form is hidden and server-rejected when the ticket is CLOSED; staff cannot reopen — they must create a new ticket.

## Database Migrations

Migrations live in `prisma/migrations/` and are the source of truth for schema changes across environments. CI replays them on every push/PR (the **Migrations replay** job) and fails if a migration can't apply to a fresh DB or if `schema.prisma` has drifted away from what the migrations produce.

### Day-to-day

```bash
# After editing prisma/schema.prisma:
bunx prisma migrate dev --name <short_description>   # creates + applies a new migration locally
bunx prisma generate                                  # refresh the client (runs automatically via postinstall)
```

Commit the generated `prisma/migrations/<timestamp>_<name>/` directory alongside the schema change.

### Production

`bunx prisma migrate deploy` is the only command used in prod — it applies pending migrations and is tolerant of checksum drift on already-applied ones. Never run `migrate dev` against production.

### One-time local recovery (after PR #116 / this section landing)

PR #116 fixes two broken migrations (`0001_init` had a stray non-SQL line; `0002_add_missing_schema` was redundant after the schema was regenerated in #111). That changes the checksums of already-applied rows in your local `_prisma_migrations` table. The next time you run `prisma migrate dev`, Prisma will complain about the drift.

Fix it once with a local reset (loses local dev data — E2E users and seed data are restored by the seed script):

```bash
bunx prisma migrate reset --force
bun prisma/seed.ts
bun run db:e2e:seed   # only if you run E2E locally
```

**Production and CI need no action** — prod uses `migrate deploy` (tolerant), CI uses `db push` for E2E (bypasses the migrations table entirely).

## Scripts

```bash
bun run dev              # Start dev server (Turbopack)
bun run build            # Production build
bun run start            # Start production server
bun run lint             # Biome check
bun run lint:fix         # Biome auto-fix
bun run format           # Biome format
bun run db:push          # Push schema to database
bun run db:seed          # Seed database
bun run db:e2e:seed      # Seed E2E test users (sender + recipient)
bun run db:studio        # Open Prisma Studio
bun run test             # Run unit tests (alias for test:unit)
bun run test:unit        # Run Vitest unit tests once
bun run test:unit:watch  # Run Vitest in watch mode
bun run test:e2e         # Run Playwright E2E tests
bun run test:e2e:ui      # Run Playwright in UI mode
bun run wt:new           # Create a git worktree (see Git Worktrees below)
bun run wt:ls            # List all worktrees
bun run wt:rm            # Remove a worktree
```

## Git Worktrees

Work on multiple branches in parallel without re-cloning or constant branch switching. Each worktree is a separate checkout sharing the same `.git` metadata.

### Layout

Worktrees live as a sibling folder to the main clone:

```
~/projects/
├── access-group-staff/                         ← main clone (tracks `main`)
└── access-group-staff.worktrees/               ← all worktrees
    ├── feature-x/
    └── bugfix-47-auth-redirect-loop/
```

### Create a worktree

```bash
# From the main clone:
bun run wt:new feature/my-thing                 # branch off origin/main
bun run wt:new bugfix/existing-branch           # check out an existing remote branch
bun run wt:new hotfix/urgent origin/production  # branch off a different base
```

The script:
1. Creates `../access-group-staff.worktrees/<slug>/` (slashes in branch → dashes)
2. Checks out the branch (existing local → existing remote → new from base)
3. Symlinks `.env` and `.env.local` from the main clone
4. Suggests a dev port (auto-incremented from `3001`)

### Run the worktree

```bash
cd ~/projects/access-group-staff.worktrees/feature-my-thing
bun install                  # required per worktree; triggers prisma generate
bun dev --port 3001          # use a unique port so it doesn't clash with main
```

### List / remove

```bash
bun run wt:ls                           # list all worktrees
bun run wt:rm feature/my-thing          # remove the worktree (branch is kept)
git branch -d feature/my-thing          # delete the branch after
```

Always use `bun run wt:rm` (or `git worktree remove`) instead of `rm -rf` — manual deletion leaves stale git metadata.

### Gotchas

- **`node_modules` is per-worktree.** Run `bun install` after every `wt:new`.
- **Env symlinks share secrets.** All worktrees point at the same `.env.local`. For schema experiments, replace the `.env.local` symlink with a real file pointing at a separate Neon branch DB so `prisma db push` doesn't alter your main dev DB.
- **Ports must differ.** Use `--port 3001`, `3002`, … or set `PORT` in the worktree's `.env.local`.
- **Same branch can't be checked out twice.** If you need the currently-checked-out branch in a worktree, switch the main clone to `main` first.
- **`.claude/` state is per-worktree.** Claude Code sessions don't bleed across branches.

## Testing

Two layers, both enforced in CI on every PR.

### Layout

```
vitest.config.ts                 # Vitest config (jsdom, @ alias)
vitest.setup.ts                  # @testing-library/jest-dom matchers
playwright.config.ts             # Playwright config (chromium, webServer)
lib/**/*.test.ts                 # Unit tests (co-located with source)
e2e/
├── fixtures.ts                  # loggedInPage fixture (logs in via better-auth API)
├── test-users.ts                # E2E test user constants
└── recognition-create.spec.ts   # E2E specs for /dashboard/recognition/create
prisma/seed.e2e.ts               # Creates sender + recipient users
```

### Unit tests (Vitest)

```bash
bun run test:unit           # run once
bun run test:unit:watch     # watch mode
```

- Import from `vitest` (not `bun:test`). Runs on jsdom.
- Mock Prisma, auth, and `next/cache` at the top of action tests using `vi.mock(...)`.
- Unit test every Zod schema and every Server Action.

### E2E tests (Playwright)

```bash
# 1. Seed E2E users (safe to re-run — only touches E2E fixtures)
bun run db:e2e:seed

# 2. Build Next — must bake the right public URL into the client bundle:
NEXT_PUBLIC_APP_URL=http://localhost:3100 BETTER_AUTH_URL=http://localhost:3100 bun run next build

# 3. Run Playwright (starts `next start -p 3100` automatically)
bun run test:e2e
```

E2E fixture users (created by `db:e2e:seed`):

| Email | Password | Role |
|-------|----------|------|
| e2e.sender@example.test | E2ePassword123! | STAFF |
| e2e.recipient@example.test | E2ePassword123! | STAFF |

**Local gotcha — `NEXT_PUBLIC_APP_URL` must match the E2E port.** `NEXT_PUBLIC_*` vars are baked into the client bundle at build time. If your `.env` has `http://localhost:3000` but Playwright runs on `:3100`, `useSession()` will fetch from the wrong origin and never hydrate client-side. Rebuild with the E2E URL (see step 2) before running `bun run test:e2e`. CI does this automatically.

### CI

`.github/workflows/ci.yml` has two jobs:

- **unit** — runs on every push and PR. Lint + Vitest.
- **e2e** — runs only on PRs. Postgres service container → `prisma db push` → seed E2E users → `next build` with `NEXT_PUBLIC_APP_URL=http://localhost:3100` → Playwright. Uploads `playwright-report/` as an artifact on failure.

## Deployment

- **Vercel:** Zero config, all Next.js 16 features supported
- **Self-hosted (Coolify):** Uses `output: "standalone"` in next.config.ts

All secrets must be configured in the deployment platform's environment variable settings.
