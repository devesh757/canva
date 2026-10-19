-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "meta" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "meta" TEXT NOT NULL DEFAULT '{}';
