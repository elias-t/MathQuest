-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "machineForm" TEXT,
ADD COLUMN     "variable" TEXT;
