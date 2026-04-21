-- Store an explicit UTC calendar day for USER_VISITED rows and enforce
-- uniqueness on it, replacing the prior (created_at::date) expression.
-- `created_at` is TIMESTAMP (without tz) so its cast to DATE depends on the
-- Postgres session timezone. Persisting a dedicated DATE populated in app
-- code (JS Date#toISOString, always UTC) makes the day boundary unambiguous
-- regardless of server/session TZ.

ALTER TABLE "activity_logs" ADD COLUMN "visit_day_utc" DATE;

DROP INDEX "activity_logs_user_visited_daily_key";

CREATE UNIQUE INDEX "activity_logs_user_visited_daily_key"
  ON "activity_logs" ("actor_id", "visit_day_utc")
  WHERE action = 'USER_VISITED';
