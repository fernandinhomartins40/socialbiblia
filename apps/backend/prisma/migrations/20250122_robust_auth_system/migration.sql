-- CreateTable: Enhance User table with robust authentication fields
-- Generated manually to improve JWT authentication system

-- Make phone field optional
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;

-- Add new security and audit fields
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "passwordChangedAt" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "refreshToken" VARCHAR(500);
ALTER TABLE "users" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMPTZ(6);

-- Set default values for existing users
UPDATE "users" SET "failedLoginAttempts" = 0 WHERE "failedLoginAttempts" IS NULL;
UPDATE "users" SET "passwordChangedAt" = "createdAt" WHERE "passwordChangedAt" IS NULL;