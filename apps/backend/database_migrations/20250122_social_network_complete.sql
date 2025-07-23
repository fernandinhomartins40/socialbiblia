-- =================================================================
-- BIBLICAI - COMPLETE SOCIAL NETWORK IMPLEMENTATION
-- Generated: 2025-01-22
-- Purpose: Create full social network database structure with RLS
-- =================================================================

-- Begin transaction
BEGIN;

-- =======================
-- 1. UPDATE USER TABLE
-- =======================

-- Add new user fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" VARCHAR(50) UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageUrl" VARCHAR(500);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "denomination" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN DEFAULT false;

-- Update existing table name mapping
ALTER TABLE "User" RENAME TO "users";

-- =======================
-- 2. CREATE POSTS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "posts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "imageUrl" VARCHAR(500),
    "videoUrl" VARCHAR(500),
    "verseReference" VARCHAR(100),
    "verseText" TEXT,
    "isPublic" BOOLEAN DEFAULT true,
    "isPinned" BOOLEAN DEFAULT false,
    "authorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "communityId" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON "posts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 3. CREATE COMMENTS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "comments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "postId" UUID NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
    "authorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "parentId" UUID REFERENCES "comments"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON "comments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 4. CREATE LIKES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "likes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "postId" UUID NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "postId")
);

-- =======================
-- 5. CREATE COMMENT LIKES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "comment_likes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "commentId" UUID NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "commentId")
);

-- =======================
-- 6. CREATE SHARES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "shares" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "postId" UUID NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
    "content" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "postId")
);

-- =======================
-- 7. CREATE FOLLOWS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "follows" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "followerId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "followingId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("followerId", "followingId"),
    CHECK ("followerId" != "followingId")
);

-- =======================
-- 8. CREATE COMMUNITIES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "communities" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(500),
    "isPrivate" BOOLEAN DEFAULT false,
    "createdBy" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON "communities"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 9. CREATE COMMUNITY MEMBERS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "community_members" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "communityId" UUID NOT NULL REFERENCES "communities"("id") ON DELETE CASCADE,
    "role" VARCHAR(20) DEFAULT 'member',
    "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "communityId")
);

-- =======================
-- 10. CREATE COMMUNITY POSTS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "community_posts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "communityId" UUID NOT NULL REFERENCES "communities"("id") ON DELETE CASCADE,
    "isPinned" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON "community_posts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 11. CREATE TAGS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "tags" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) UNIQUE NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- 12. CREATE POST TAGS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "post_tags" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
    "tagId" UUID NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
    UNIQUE("postId", "tagId")
);

-- =======================
-- 13. CREATE BIBLE READING PROGRESS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "bible_reading_progress" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "book" VARCHAR(50) NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER,
    "completed" BOOLEAN DEFAULT false,
    "readAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("userId", "book", "chapter")
);

-- =======================
-- 14. CREATE PRAYER REQUESTS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "prayer_requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN DEFAULT false,
    "authorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "isAnswered" BOOLEAN DEFAULT false,
    "answeredAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_prayer_requests_updated_at BEFORE UPDATE ON "prayer_requests"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 15. CREATE DEVOTIONALS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "devotionals" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "verseReference" VARCHAR(100),
    "verseText" TEXT,
    "authorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "isPublic" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_devotionals_updated_at BEFORE UPDATE ON "devotionals"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 16. CREATE USER PREFERENCES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "emailNotifications" BOOLEAN DEFAULT true,
    "pushNotifications" BOOLEAN DEFAULT true,
    "dailyVerseReminder" BOOLEAN DEFAULT true,
    "prayerReminder" BOOLEAN DEFAULT true,
    "communityUpdates" BOOLEAN DEFAULT true,
    "language" VARCHAR(10) DEFAULT 'pt-BR',
    "bibleVersion" VARCHAR(10) DEFAULT 'NVI',
    "theme" VARCHAR(10) DEFAULT 'light',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON "user_preferences"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 17. ADD FOREIGN KEY CONSTRAINTS
-- =======================

-- Add community foreign key to posts
ALTER TABLE "posts" ADD CONSTRAINT "posts_communityId_fkey" 
    FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL;

-- =======================
-- 18. ENABLE ROW LEVEL SECURITY (RLS)
-- =======================

-- Enable RLS on all user-related tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comment_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "community_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "community_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bible_reading_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prayer_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "devotionals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;

-- =======================
-- 19. CREATE RLS POLICIES
-- =======================

-- USERS POLICIES
CREATE POLICY "Users can view public profiles" ON "users"
    FOR SELECT USING (NOT "isPrivate" OR "id" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own profile" ON "users"
    FOR UPDATE USING ("id" = current_setting('app.current_user_id')::UUID);

-- POSTS POLICIES
CREATE POLICY "View public posts" ON "posts"
    FOR SELECT USING ("isPublic" = true);

CREATE POLICY "View own posts" ON "posts"
    FOR SELECT USING ("authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Create own posts" ON "posts"
    FOR INSERT WITH CHECK ("authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Update own posts" ON "posts"
    FOR UPDATE USING ("authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Delete own posts" ON "posts"
    FOR DELETE USING ("authorId" = current_setting('app.current_user_id')::UUID);

-- COMMENTS POLICIES
CREATE POLICY "View comments on visible posts" ON "comments"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "posts" 
            WHERE "posts"."id" = "comments"."postId" 
            AND ("posts"."isPublic" = true OR "posts"."authorId" = current_setting('app.current_user_id')::UUID)
        )
    );

CREATE POLICY "Create comments on visible posts" ON "comments"
    FOR INSERT WITH CHECK (
        "authorId" = current_setting('app.current_user_id')::UUID AND
        EXISTS (
            SELECT 1 FROM "posts" 
            WHERE "posts"."id" = "comments"."postId" 
            AND ("posts"."isPublic" = true OR "posts"."authorId" = current_setting('app.current_user_id')::UUID)
        )
    );

CREATE POLICY "Update own comments" ON "comments"
    FOR UPDATE USING ("authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Delete own comments" ON "comments"
    FOR DELETE USING ("authorId" = current_setting('app.current_user_id')::UUID);

-- LIKES POLICIES
CREATE POLICY "View likes on visible posts" ON "likes"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "posts" 
            WHERE "posts"."id" = "likes"."postId" 
            AND ("posts"."isPublic" = true OR "posts"."authorId" = current_setting('app.current_user_id')::UUID)
        )
    );

CREATE POLICY "Manage own likes" ON "likes"
    FOR ALL USING ("userId" = current_setting('app.current_user_id')::UUID);

-- FOLLOWS POLICIES
CREATE POLICY "View all follows" ON "follows" FOR SELECT USING (true);

CREATE POLICY "Manage own follows" ON "follows"
    FOR ALL USING ("followerId" = current_setting('app.current_user_id')::UUID);

-- COMMUNITIES POLICIES
CREATE POLICY "View public communities" ON "communities"
    FOR SELECT USING ("isPrivate" = false);

CREATE POLICY "View joined private communities" ON "communities"
    FOR SELECT USING (
        "isPrivate" = true AND
        EXISTS (
            SELECT 1 FROM "community_members" 
            WHERE "community_members"."communityId" = "communities"."id" 
            AND "community_members"."userId" = current_setting('app.current_user_id')::UUID
        )
    );

CREATE POLICY "Create communities" ON "communities"
    FOR INSERT WITH CHECK ("createdBy" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Update own communities" ON "communities"
    FOR UPDATE USING ("createdBy" = current_setting('app.current_user_id')::UUID);

-- PERSONAL DATA POLICIES
CREATE POLICY "Manage own bible progress" ON "bible_reading_progress"
    FOR ALL USING ("userId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "View public prayer requests" ON "prayer_requests"
    FOR SELECT USING ("isPrivate" = false OR "authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Manage own prayer requests" ON "prayer_requests"
    FOR ALL USING ("authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "View public devotionals" ON "devotionals"
    FOR SELECT USING ("isPublic" = true OR "authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Manage own devotionals" ON "devotionals"
    FOR ALL USING ("authorId" = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Manage own preferences" ON "user_preferences"
    FOR ALL USING ("userId" = current_setting('app.current_user_id')::UUID);

-- =======================
-- 20. CREATE INDEXES FOR PERFORMANCE
-- =======================

-- Posts indexes
CREATE INDEX IF NOT EXISTS "idx_posts_author" ON "posts"("authorId");
CREATE INDEX IF NOT EXISTS "idx_posts_community" ON "posts"("communityId");
CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "posts"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_posts_public" ON "posts"("isPublic", "createdAt" DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS "idx_comments_post" ON "comments"("postId");
CREATE INDEX IF NOT EXISTS "idx_comments_author" ON "comments"("authorId");
CREATE INDEX IF NOT EXISTS "idx_comments_parent" ON "comments"("parentId");

-- Likes indexes
CREATE INDEX IF NOT EXISTS "idx_likes_post" ON "likes"("postId");
CREATE INDEX IF NOT EXISTS "idx_likes_user" ON "likes"("userId");

-- Follows indexes
CREATE INDEX IF NOT EXISTS "idx_follows_follower" ON "follows"("followerId");
CREATE INDEX IF NOT EXISTS "idx_follows_following" ON "follows"("followingId");

-- Users indexes
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users"("username");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");

-- =======================
-- 21. CREATE HELPER FUNCTIONS
-- =======================

-- Function to get user's feed (posts from followed users + own posts)
CREATE OR REPLACE FUNCTION get_user_feed(user_id UUID, page_limit INTEGER DEFAULT 20, page_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    post_id UUID,
    content TEXT,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    verse_reference VARCHAR(100),
    verse_text TEXT,
    author_id UUID,
    author_name VARCHAR(255),
    author_username VARCHAR(50),
    author_avatar VARCHAR(500),
    likes_count BIGINT,
    comments_count BIGINT,
    is_liked_by_user BOOLEAN,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p."id" as post_id,
        p."content",
        p."imageUrl" as image_url,
        p."videoUrl" as video_url,
        p."verseReference" as verse_reference,
        p."verseText" as verse_text,
        p."authorId" as author_id,
        u."name" as author_name,
        u."username" as author_username,
        u."profileImageUrl" as author_avatar,
        COALESCE(l.likes_count, 0) as likes_count,
        COALESCE(c.comments_count, 0) as comments_count,
        CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as is_liked_by_user,
        p."createdAt" as created_at
    FROM "posts" p
    INNER JOIN "users" u ON p."authorId" = u."id"
    LEFT JOIN (
        SELECT "postId", COUNT(*) as likes_count 
        FROM "likes" 
        GROUP BY "postId"
    ) l ON p."id" = l."postId"
    LEFT JOIN (
        SELECT "postId", COUNT(*) as comments_count 
        FROM "comments" 
        GROUP BY "postId"
    ) c ON p."id" = c."postId"
    LEFT JOIN (
        SELECT "postId", "userId" as user_id 
        FROM "likes" 
        WHERE "userId" = user_id
    ) ul ON p."id" = ul."postId"
    WHERE p."isPublic" = true
    AND (
        p."authorId" = user_id 
        OR p."authorId" IN (
            SELECT "followingId" 
            FROM "follows" 
            WHERE "followerId" = user_id
        )
    )
    ORDER BY p."createdAt" DESC
    LIMIT page_limit OFFSET page_offset;
END;
$$;

-- =======================
-- 22. SET DEFAULT VALUES FOR EXISTING USERS
-- =======================

-- Split existing names into firstName and lastName
UPDATE "users" 
SET 
    "firstName" = SPLIT_PART("name", ' ', 1),
    "lastName" = CASE 
        WHEN array_length(string_to_array("name", ' '), 1) > 1 
        THEN array_to_string(string_to_array("name", ' ')[2:], ' ')
        ELSE NULL
    END
WHERE "firstName" IS NULL;

-- Create default user preferences for existing users
INSERT INTO "user_preferences" ("userId")
SELECT "id" FROM "users" 
WHERE "id" NOT IN (SELECT "userId" FROM "user_preferences");

COMMIT;

-- =================================================================
-- VERIFICATION QUERIES (for testing)
-- =================================================================

-- Check table structures
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE schemaname = 'public';

-- Check indexes
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';