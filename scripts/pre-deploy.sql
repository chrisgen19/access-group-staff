-- Pre-deploy sync between legacy `is_active` and new `deleted_at`.
-- Idempotent and safe to re-run. `is_active` is kept for one release as
-- a backwards-compat column (see schema.prisma); a follow-up migration
-- will drop both the column and this trigger once the release is stable
-- in prod.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by_id TEXT;

    -- One-time backfill so existing rows agree before the trigger takes over.
    UPDATE users SET deleted_at = NOW()
      WHERE is_active = false AND deleted_at IS NULL;
    UPDATE users SET is_active = false
      WHERE deleted_at IS NOT NULL AND is_active = true;
  END IF;
END $$;

-- Keep both columns in sync for the duration of the deploy window.
-- The old release toggles `is_active` only; the new release writes both
-- but we still want defence-in-depth in case a code path is missed.
-- Drop this trigger in the same follow-up PR that drops `is_active`.
CREATE OR REPLACE FUNCTION users_sync_deleted_active() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND NEW.deleted_at IS NULL THEN
    NEW.deleted_at := NOW();
  ELSIF NEW.is_active = true AND NEW.deleted_at IS NOT NULL THEN
    NEW.deleted_at := NULL;
    NEW.deleted_by_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    DROP TRIGGER IF EXISTS users_sync_deleted_active_trigger ON users;
    CREATE TRIGGER users_sync_deleted_active_trigger
      BEFORE INSERT OR UPDATE OF is_active, deleted_at ON users
      FOR EACH ROW
      EXECUTE FUNCTION users_sync_deleted_active();
  END IF;
END $$;
