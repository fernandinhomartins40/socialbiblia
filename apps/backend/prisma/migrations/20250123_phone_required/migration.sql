-- Make phone field required
-- Set default phone for existing users without phone (if any)
UPDATE "users" SET "phone" = '00000000000' WHERE "phone" IS NULL OR "phone" = '';

-- Make phone field NOT NULL
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;