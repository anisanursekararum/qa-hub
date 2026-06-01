/*
  Warnings:

  - You are about to drop the column `module` on the `TestCase` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "CaseStatus" ADD VALUE 'DEPRECATED';

-- AlterTable
ALTER TABLE "TestCase" DROP COLUMN "module",
ADD COLUMN     "expectedResult" TEXT,
ADD COLUMN     "moduleId" TEXT,
ADD COLUMN     "prerequisite" TEXT,
ADD COLUMN     "publicId" TEXT;

-- CreateTable
CREATE TABLE "ProjectModule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currentSequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectModule_projectId_code_key" ON "ProjectModule"("projectId", "code");

-- AddForeignKey
ALTER TABLE "ProjectModule" ADD CONSTRAINT "ProjectModule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ProjectModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
