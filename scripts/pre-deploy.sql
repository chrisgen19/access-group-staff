-- Pre-deploy sync between legacy `is_active` and new `deleted_at`.
-- Idempotent and safe to re-run. `is_active` is kept for one release as
-- a backwards-compat column (see schema.prisma); a follow-up migration
-- will drop it once this release is stable in prod.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by_id TEXT;

    -- Mirror either column into the other so old and new readers agree
    -- during the deploy window.
    UPDATE users SET deleted_at = NOW()
      WHERE is_active = false AND deleted_at IS NULL;
    UPDATE users SET is_active = false
      WHERE deleted_at IS NOT NULL AND is_active = true;
  END IF;
END $$;
