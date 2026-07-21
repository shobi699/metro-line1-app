-- AlterTable: Add advanced audit log fields
ALTER TABLE "AuditLog" ADD COLUMN "reason" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "device" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "metadata" JSONB;
