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
└── shared/                        # Shared components (sidebar, header, logos, etc.)

lib/
├── auth.ts                        # better-auth server config
├── auth-client.ts                 # better-auth client
├── auth-utils.ts                  # Session helpers (requireSession, requireRole)
├── permissions.ts                 # Role-based permission checks
├── recognition.ts                 # Shared types, constants, and utils for recognition
├── actions/                       # Server Actions (user, department, profile, recognition)
├── validations/                   # Zod schemas (user, auth, department, recognition)
└── db/index.ts                    # Prisma client singleton

stores/                            # Zustand stores
prisma/
├── schema.prisma                  # Database schema
└── seed.ts                        # Seed data
proxy.ts                           # Route protection (replaces middleware.ts)
env.ts                             # Typed env via @t3-oss/env-nextjs
```

## Database Schema

**Models:** User, Session, Account, Verification, Department, RecognitionCard

**Roles:** `SUPERADMIN` > `ADMIN` > `STAFF`

**Branch:** `ISO` | `PERTH` (optional field on User)

- SUPERADMIN can access Super Admin panel and all admin features
- ADMIN can manage users, departments, and access Admin Settings
- All authenticated users can send and view recognition cards
- STAFF can view dashboard, recognition inbox, and edit own profile
- Deactivated users (`isActive: false`) are blocked at proxy and session level

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

## Scripts

```bash
bun run dev          # Start dev server (Turbopack)
bun run build        # Production build
bun run start        # Start production server
bun run lint         # Biome check
bun run lint:fix     # Biome auto-fix
bun run format       # Biome format
bun run db:push      # Push schema to database
bun run db:seed      # Seed database
bun run db:studio    # Open Prisma Studio
bun run wt:new       # Create a git worktree (see Git Worktrees below)
bun run wt:ls        # List all worktrees
bun run wt:rm        # Remove a worktree
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

## Deployment

- **Vercel:** Zero config, all Next.js 16 features supported
- **Self-hosted (Coolify):** Uses `output: "standalone"` in next.config.ts

All secrets must be configured in the deployment platform's environment variable settings.
