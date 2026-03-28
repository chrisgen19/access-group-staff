**Current task:** Phase 1 — Project Setup + Auth + User CRUD

## Goals
Set up the full project foundation with authentication and user management.

## 1. Project Initialization
- Initialize Next.js 16 with TypeScript, Tailwind CSS v4, and App Router
- Install and configure Biome (no ESLint, no Prettier)
- Set up env.ts using @t3-oss/env-nextjs with the following variables:
  DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,
  NEXT_PUBLIC_APP_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, RESEND_API_KEY
- Add `"postinstall": "prisma generate"` to package.json
- Add `"prisma": { "seed": "bun prisma/seed.ts" }` to package.json
- Configure next.config.ts with `output: "standalone"` for Coolify

## 2. Database (Prisma + Self-hosted PostgreSQL)
- Initialize Prisma with PostgreSQL provider
- Create the Prisma singleton client in lib/db/index.ts
- Run the better-auth CLI to generate auth tables:
  User, Session, Account, Verification into schema.prisma
- Define a Role enum:
  enum Role { SUPERADMIN, ADMIN, STAFF }
- Create a Department model:
  - id        String   @id @default(uuid())
  - name      String   @unique
  - code      String   @unique  // e.g. "ENG", "HR", "OPS"
  - createdAt DateTime @default(now())
  - updatedAt DateTime @updatedAt
  - users     User[]
  - @@map("departments")
- Extend the User model with the following fields:
  - firstName   String
  - lastName    String
  - displayName String?
  - phone       String?
  - position    String?
  - avatar      String?
  - role        Role     @default(STAFF)
  - isActive    Boolean  @default(true)
  - createdAt   DateTime @default(now())
  - updatedAt   DateTime @updatedAt
  - departmentId String?
  - department   Department? @relation(fields: [departmentId], references: [id])
- All DB columns use snake_case via Prisma @map
- Run `bunx prisma db push` to sync schema to the database
- Create prisma/seed.ts with the following seed data:
  Departments: Engineering (ENG), Human Resources (HR),
  Operations (OPS), Finance (FIN), Safety (SAF)
  Users:
  - 1 SUPERADMIN: admin@accessgroup.com.au
  - 1 ADMIN: in Engineering department
  - 2 STAFF: in different departments

## 3. Auth (better-auth)
- Set up better-auth in lib/auth.ts using prismaAdapter with postgresql provider
- Enable email/password, Google OAuth, and Microsoft OAuth providers
- Set up lib/auth-client.ts for client-side auth helpers
- Create the catch-all route handler at app/api/auth/[...all]/route.ts
- Set up proxy.ts at project root to protect all /dashboard routes —
  redirect unauthenticated users to /login
- proxy.ts runs on Node.js runtime only

## 4. Role-based Access Control
Enforce the following permissions throughout the app:

| Permission              | STAFF | ADMIN | SUPERADMIN |
|-------------------------|-------|-------|------------|
| View dashboard feed     | ✅    | ✅    | ✅         |
| Send recognition cards  | ✅    | ✅    | ✅         |
| Manage own profile      | ✅    | ✅    | ✅         |
| View all users          | ❌    | ✅    | ✅         |
| Create/edit users       | ❌    | ✅    | ✅         |
| Deactivate users        | ❌    | ✅    | ✅         |
| Manage departments      | ❌    | ✅    | ✅         |
| Assign ADMIN role       | ❌    | ❌    | ✅         |
| Full system access      | ❌    | ❌    | ✅         |

- Create a lib/permissions.ts utility that checks role access
- Use it in Server Actions and proxy.ts to guard protected operations
- Never rely on client-side role checks alone — always validate server-side

## 5. Auth Pages
- /login — email/password login form + Google + Microsoft OAuth buttons
- /register — registration form with fields:
  email, password, confirm password, first name, last name
- Both pages use react-hook-form + zod validation
- Show inline field errors for validation; use sonner for global feedback
- Redirect to /dashboard after successful login/register
- Route group: app/(auth)/

## 6. Dashboard + User CRUD
- /dashboard — protected, basic shell layout with sidebar and header
  showing logged-in user's name, avatar, role badge, and department
- /dashboard/users — ADMIN and SUPERADMIN only
  List all users in a table with columns:
  name, email, department, position, role, status (active/inactive)
  Use @tanstack/react-query to fetch the user list client-side
- /dashboard/users/[id] — view full user profile
- /dashboard/users/[id]/edit — edit user details form
  SUPERADMIN can change any user's role including to ADMIN
  ADMIN can only assign STAFF role
- /dashboard/users/new — create new user form (ADMIN and SUPERADMIN only)
- /dashboard/departments — ADMIN and SUPERADMIN only
  List, create, edit, and delete departments
- /dashboard/profile — current user's own profile edit page (all roles)
- User and department forms use react-hook-form + zod
- All CRUD operations use Server Actions
- Server Actions return { success: true, data } or { success: false, error }
- Route group: app/(dashboard)/

## 7. Theme
- Install and configure next-themes for dark/light mode toggle
- Add theme toggle button in the dashboard header

## 8. State
- Install zustand — create useModalStore for managing open/close state
  of modals (confirm delete user, confirm deactivate, etc.)

## Notes
- This is an internal employee recognition app for Access Group (Australian company)
- Do not build the recognition card features yet — that is Phase 2
- Use UUID for user IDs (better-auth handles this internally)
- Use self-hosted PostgreSQL — no Neon or Supabase drivers needed
- STAFF users should never see /dashboard/users or /dashboard/departments —
  redirect them to /dashboard if they try to access those routes