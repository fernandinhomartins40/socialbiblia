-- =================================================================
-- BIBLICAI - ROBUST AUTHENTICATION SYSTEM ENHANCEMENT
-- Generated: 2025-01-22
-- Purpose: Enhance User table with security and audit fields
-- =================================================================

-- Begin transaction
BEGIN;

-- 1. Make phone field optional (allow NULL values)
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- 2. Add new security and audit fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refreshToken" VARCHAR(500);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMPTZ(6);

-- 3. Set default values for existing users
UPDATE "User" 
SET "failedLoginAttempts" = 0 
WHERE "failedLoginAttempts" IS NULL;

UPDATE "User" 
SET "passwordChangedAt" = "createdAt" 
WHERE "passwordChangedAt" IS NULL;

-- 4. Set existing registered users as verified (if needed)
UPDATE "User" 
SET "emailVerifiedAt" = "createdAt" 
WHERE "isRegistered" = true AND "emailVerifiedAt" IS NULL;

-- Commit transaction
COMMIT;

-- =================================================================
-- VERIFICATION QUERIES (for testing)
-- =================================================================

-- Check table structure
-- \d "User"

-- Verify data integrity
-- SELECT id, email, name, phone, "isRegistered", "failedLoginAttempts", "passwordChangedAt" 
-- FROM "User" 
-- LIMIT 5;