# Access Recognition

Internal employee recognition app for Access Group. Team members publicly recognize colleagues via digital thank-you cards tied to company values.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Runtime | Node.js 20+, Bun (package manager) |
| Auth | better-auth (email/password + Google OAuth) |
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
│       ├── users/                 # User management (CRUD)
│       ├── departments/           # Department management (CRUD)
│       ├── recognition/           # Recognition Card feed + send form
│       │   └── create/            # Send Recognition Card page
│       └── profile/               # Profile + Preferences
│           └── preferences/       # Background color customization
├── api/
│   ├── auth/[...all]/             # better-auth catch-all handler
│   ├── recognition/               # Recognition Cards API (React Query)
│   │   └── users/                 # Active users for recipient picker
│   └── users/                     # Users API (React Query)
└── globals.css                    # Tailwind v4 theme (CSS variables)

components/
├── ui/                            # shadcn/ui primitives (do not edit)
└── shared/                        # Shared components (sidebar, header, etc.)

lib/
├── auth.ts                        # better-auth server config
├── auth-client.ts                 # better-auth client
├── auth-utils.ts                  # Session helpers (requireSession, requireRole)
├── permissions.ts                 # Role-based permission checks
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

- SUPERADMIN/ADMIN can manage users and departments
- All authenticated users can send and view recognition cards
- STAFF can view dashboard and edit own profile
- Deactivated users (`isActive: false`) are blocked at proxy and session level

### Recognition Cards

- Any user can send a recognition card to a colleague (cannot send to self)
- Cards include a message, date, and one or more company values: People, Safety, Respect, Communication, Continuous Improvement
- Public feed visible to all authenticated users

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
```

## Deployment

- **Vercel:** Zero config, all Next.js 16 features supported
- **Self-hosted (Coolify):** Uses `output: "standalone"` in next.config.ts

All secrets must be configured in the deployment platform's environment variable settings.
