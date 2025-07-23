-- CreateTable: Enhance User table with robust authentication fields
-- Generated manually to improve JWT authentication system

-- Make phone field optional
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- Add new security and audit fields
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN "refreshToken" VARCHAR(500);
ALTER TABLE "User" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMPTZ(6);

-- Set default values for existing users
UPDATE "User" SET "failedLoginAttempts" = 0 WHERE "failedLoginAttempts" IS NULL;
UPDATE "User" SET "passwordChangedAt" = "createdAt" WHERE "passwordChangedAt" IS NULL;