-- Enforce one USER_VISITED activity log per actor per calendar day.
-- Prisma stores timestamp columns in UTC, so casting created_at to ::date
-- yields the UTC date without relying on a non-IMMUTABLE timezone expression.
--
-- Partial + expression unique indexes cannot be represented in
-- prisma/schema.prisma, so this index is maintained via raw SQL. Application
-- code in lib/activity-log.ts swallows P2002 for USER_VISITED to make the
-- insert idempotent when the cookie-based throttle races or misses.
CREATE UNIQUE INDEX "activity_logs_user_visited_daily_key"
  ON "activity_logs" ("actor_id", (created_at::date))
  WHERE action = 'USER_VISITED';
