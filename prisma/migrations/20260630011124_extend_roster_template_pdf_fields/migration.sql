/*
  Warnings:

  - You are about to drop the `RosterFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "RosterFile_uploaderId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RosterFile";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RosterTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'EXCEL',
    "rightMapping" JSONB,
    "leftMapping" JSONB,
    "pageWidth" INTEGER,
    "pageHeight" INTEGER,
    "rightBlock" JSONB,
    "leftBlock" JSONB,
    "headerZones" JSONB,
    "pdfColumns" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_RosterTemplate" ("createdAt", "description", "id", "isActive", "leftMapping", "name", "rightMapping", "updatedAt") SELECT "createdAt", "description", "id", "isActive", "leftMapping", "name", "rightMapping", "updatedAt" FROM "RosterTemplate";
DROP TABLE "RosterTemplate";
ALTER TABLE "new_RosterTemplate" RENAME TO "RosterTemplate";
CREATE UNIQUE INDEX "RosterTemplate_name_key" ON "RosterTemplate"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
