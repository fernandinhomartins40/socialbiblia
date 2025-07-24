-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'POST',
    "score" REAL NOT NULL DEFAULT 0.0,
    "category" TEXT,
    "tags" TEXT,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'POST',
    "interactionType" TEXT NOT NULL,
    "value" REAL NOT NULL DEFAULT 1.0,
    "sessionId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recommendation_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recommendation_feedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "recommendations_userId_idx" ON "recommendations"("userId");
CREATE INDEX "recommendations_itemType_idx" ON "recommendations"("itemType");
CREATE INDEX "recommendations_score_idx" ON "recommendations"("score");
CREATE INDEX "recommendations_isActive_idx" ON "recommendations"("isActive");
CREATE INDEX "recommendations_createdAt_idx" ON "recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "user_interactions_userId_idx" ON "user_interactions"("userId");
CREATE INDEX "user_interactions_itemId_idx" ON "user_interactions"("itemId");
CREATE INDEX "user_interactions_itemType_idx" ON "user_interactions"("itemType");
CREATE INDEX "user_interactions_interactionType_idx" ON "user_interactions"("interactionType");
CREATE INDEX "user_interactions_createdAt_idx" ON "user_interactions"("createdAt");

-- CreateIndex
CREATE INDEX "recommendation_feedback_userId_idx" ON "recommendation_feedback"("userId");
CREATE INDEX "recommendation_feedback_recommendationId_idx" ON "recommendation_feedback"("recommendationId");
CREATE INDEX "recommendation_feedback_feedbackType_idx" ON "recommendation_feedback"("feedbackType");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_userId_itemId_itemType_key" ON "recommendations"("userId", "itemId", "itemType");
CREATE UNIQUE INDEX "user_interactions_userId_itemId_itemType_interactionType_key" ON "user_interactions"("userId", "itemId", "itemType", "interactionType");
CREATE UNIQUE INDEX "recommendation_feedback_userId_recommendationId_key" ON "recommendation_feedback"("userId", "recommendationId");