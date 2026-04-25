-- Add PASSWORD_SET to ActivityAction so we can log when an OAuth-only user
-- sets their initial password from the security page.
ALTER TYPE "ActivityAction" ADD VALUE 'PASSWORD_SET';
