-- One-time pre-deploy migration for PR #64 (soft-delete users).
-- Idempotent: safe to re-run. Becomes a no-op once `is_active` is dropped.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by_id TEXT;
    UPDATE users SET deleted_at = NOW()
      WHERE is_active = false AND deleted_at IS NULL;
  END IF;
END $$;
