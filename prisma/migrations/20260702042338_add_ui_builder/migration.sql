-- CreateTable
CREATE TABLE "KnowledgeFAQ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "articleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ui_menu_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "requiredPermission" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ui_menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ui_menu_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ui_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "layoutType" TEXT NOT NULL DEFAULT 'list',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ui_page_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ui_page_versions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ui_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ui_dashboard_widgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT,
    "widgetType" TEXT NOT NULL,
    "title" TEXT,
    "size" TEXT NOT NULL DEFAULT 'md',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "configJson" JSONB NOT NULL,
    "requiredPermission" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ui_themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "primaryColor" TEXT NOT NULL DEFAULT '#ae0011',
    "accentColor" TEXT NOT NULL DEFAULT '#575e70',
    "radius" INTEGER NOT NULL DEFAULT 12,
    "fontSize" TEXT NOT NULL DEFAULT 'md',
    "darkModeDefault" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "attachments" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "ownerId" TEXT,
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'internal',
    "relatedPostId" TEXT,
    "relatedQuizPostId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_KnowledgeArticle" ("attachments", "authorId", "body", "category", "createdAt", "id", "slug", "tags", "title", "updatedAt") SELECT "attachments", "authorId", "body", "category", "createdAt", "id", "slug", "tags", "title", "updatedAt" FROM "KnowledgeArticle";
DROP TABLE "KnowledgeArticle";
ALTER TABLE "new_KnowledgeArticle" RENAME TO "KnowledgeArticle";
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");
CREATE INDEX "KnowledgeArticle_createdAt_idx" ON "KnowledgeArticle"("createdAt");
CREATE INDEX "KnowledgeArticle_confidentialityLevel_idx" ON "KnowledgeArticle"("confidentialityLevel");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'news',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "coverUrl" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishAt" DATETIME,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "archivedAt" DATETIME,
    "nextReviewAt" DATETIME,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "body", "category", "coverUrl", "createdAt", "excerpt", "id", "mandatory", "mediaType", "mediaUrl", "published", "slug", "title", "type", "updatedAt") SELECT "authorId", "body", "category", "coverUrl", "createdAt", "excerpt", "id", "mandatory", "mediaType", "mediaUrl", "published", "slug", "title", "type", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
CREATE INDEX "Post_type_status_idx" ON "Post"("type", "status");
CREATE INDEX "Post_type_published_idx" ON "Post"("type", "published");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_status_idx" ON "Post"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "KnowledgeFAQ_category_idx" ON "KnowledgeFAQ"("category");

-- CreateIndex
CREATE INDEX "ui_menu_items_parentId_idx" ON "ui_menu_items"("parentId");

-- CreateIndex
CREATE INDEX "ui_menu_items_orderIndex_idx" ON "ui_menu_items"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ui_pages_slug_key" ON "ui_pages"("slug");

-- CreateIndex
CREATE INDEX "ui_page_versions_pageId_idx" ON "ui_page_versions"("pageId");

-- CreateIndex
CREATE INDEX "ui_dashboard_widgets_orderIndex_idx" ON "ui_dashboard_widgets"("orderIndex");
