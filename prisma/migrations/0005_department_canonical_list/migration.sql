-- Align departments with the canonical production list.
-- Safe to apply after a manual local reconcile: existing canonical rows are
-- preserved, legacy rows are reused where possible to keep user assignments,
-- and unexpected obsolete departments with assigned users abort the migration
-- instead of silently rehoming people to the wrong team.

DO $$
DECLARE
  blocked_departments TEXT;
  legacy_department_id TEXT;
  canonical_department_id TEXT;
BEGIN
  -- Merge or reuse the old Engineering and Safety rows so linked users land on
  -- the canonical department even if both legacy and canonical rows already
  -- coexist from a phased/manual rollout.
  SELECT "id" INTO legacy_department_id
  FROM "departments"
  WHERE "code" = 'ENG';

  SELECT "id" INTO canonical_department_id
  FROM "departments"
  WHERE "code" = 'COE';

  IF legacy_department_id IS NOT NULL AND canonical_department_id IS NOT NULL THEN
    UPDATE "users"
    SET "department_id" = canonical_department_id
    WHERE "department_id" = legacy_department_id;

    DELETE FROM "departments"
    WHERE "id" = legacy_department_id;
  ELSIF legacy_department_id IS NOT NULL THEN
    UPDATE "departments"
    SET "name" = 'COE',
        "code" = 'COE',
        "updated_at" = NOW()
    WHERE "id" = legacy_department_id;
  END IF;

  SELECT "id" INTO legacy_department_id
  FROM "departments"
  WHERE "code" = 'SAF';

  SELECT "id" INTO canonical_department_id
  FROM "departments"
  WHERE "code" = 'TRN';

  IF legacy_department_id IS NOT NULL AND canonical_department_id IS NOT NULL THEN
    UPDATE "users"
    SET "department_id" = canonical_department_id
    WHERE "department_id" = legacy_department_id;

    DELETE FROM "departments"
    WHERE "id" = legacy_department_id;
  ELSIF legacy_department_id IS NOT NULL THEN
    UPDATE "departments"
    SET "name" = 'Training',
        "code" = 'TRN',
        "updated_at" = NOW()
    WHERE "id" = legacy_department_id;
  END IF;

  INSERT INTO "departments" ("id", "name", "code", "updated_at")
  VALUES
    ('department-coe', 'COE', 'COE', NOW()),
    ('department-cm', 'Credit Management', 'CM', NOW()),
    ('department-fin', 'Finance', 'FIN', NOW()),
    ('department-flt', 'Fleet', 'FLT', NOW()),
    ('department-hr', 'Human Resources', 'HR', NOW()),
    ('department-it', 'IT', 'IT', NOW()),
    ('department-its', 'IT Support', 'ITS', NOW()),
    ('department-lg', 'Lead Generation', 'LG', NOW()),
    ('department-mkt', 'Marketing', 'MKT', NOW()),
    ('department-ops', 'Operations', 'OPS', NOW()),
    ('department-trn', 'Training', 'TRN', NOW())
  ON CONFLICT ("code") DO UPDATE
  SET "name" = EXCLUDED."name",
      "updated_at" = NOW();

  SELECT string_agg(
    format('%s (%s): %s users', department_name, department_code, user_count),
    E'\n'
  )
  INTO blocked_departments
  FROM (
    SELECT
      d."name" AS department_name,
      d."code" AS department_code,
      COUNT(u."id")::TEXT AS user_count
    FROM "departments" d
    LEFT JOIN "users" u ON u."department_id" = d."id"
    WHERE d."code" NOT IN ('COE', 'CM', 'FIN', 'FLT', 'HR', 'IT', 'ITS', 'LG', 'MKT', 'OPS', 'TRN')
    GROUP BY d."id", d."name", d."code"
    HAVING COUNT(u."id") > 0
  ) blocked;

  IF blocked_departments IS NOT NULL THEN
    RAISE EXCEPTION USING MESSAGE =
      E'Cannot remove obsolete departments with assigned users.\n' || blocked_departments;
  END IF;

  DELETE FROM "departments" d
  WHERE d."code" NOT IN ('COE', 'CM', 'FIN', 'FLT', 'HR', 'IT', 'ITS', 'LG', 'MKT', 'OPS', 'TRN')
    AND NOT EXISTS (
      SELECT 1
      FROM "users" u
      WHERE u."department_id" = d."id"
    );
END $$;
