-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "generatedForId" TEXT;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_generatedForId_fkey" FOREIGN KEY ("generatedForId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
