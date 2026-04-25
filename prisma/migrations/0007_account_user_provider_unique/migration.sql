-- Better-auth never legitimately creates two account rows with the same
-- (userId, providerId) — credential, google, microsoft are distinct providers
-- and each provider links once per user. Enforcing uniqueness at the DB
-- closes a TOCTOU race in setInitialPasswordAction's check-then-create path.
CREATE UNIQUE INDEX "accounts_user_id_provider_id_key" ON "accounts"("user_id", "provider_id");
