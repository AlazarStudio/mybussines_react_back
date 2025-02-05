/*
  Warnings:

  - You are about to drop the column `supportId` on the `TagsSupport` table. All the data in the column will be lost.
  - You are about to drop the `CenterService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupportTags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CenterToService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FormToService` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `centerId` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CenterService" DROP CONSTRAINT "CenterService_centerId_fkey";

-- DropForeignKey
ALTER TABLE "CenterService" DROP CONSTRAINT "CenterService_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "FormService" DROP CONSTRAINT "FormService_formId_fkey";

-- DropForeignKey
ALTER TABLE "FormService" DROP CONSTRAINT "FormService_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTags" DROP CONSTRAINT "SupportTags_supportId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTags" DROP CONSTRAINT "SupportTags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "TagsSupport" DROP CONSTRAINT "TagsSupport_supportId_fkey";

-- DropForeignKey
ALTER TABLE "_CenterToService" DROP CONSTRAINT "_CenterToService_A_fkey";

-- DropForeignKey
ALTER TABLE "_CenterToService" DROP CONSTRAINT "_CenterToService_B_fkey";

-- DropForeignKey
ALTER TABLE "_FormToService" DROP CONSTRAINT "_FormToService_A_fkey";

-- DropForeignKey
ALTER TABLE "_FormToService" DROP CONSTRAINT "_FormToService_B_fkey";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "centerId" INTEGER NOT NULL,
ADD COLUMN     "formId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TagsSupport" DROP COLUMN "supportId";

-- DropTable
DROP TABLE "CenterService";

-- DropTable
DROP TABLE "FormService";

-- DropTable
DROP TABLE "SupportTags";

-- DropTable
DROP TABLE "_CenterToService";

-- DropTable
DROP TABLE "_FormToService";

-- CreateTable
CREATE TABLE "_SupportToTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SupportToTags_AB_unique" ON "_SupportToTags"("A", "B");

-- CreateIndex
CREATE INDEX "_SupportToTags_B_index" ON "_SupportToTags"("B");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SupportToTags" ADD CONSTRAINT "_SupportToTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Support"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SupportToTags" ADD CONSTRAINT "_SupportToTags_B_fkey" FOREIGN KEY ("B") REFERENCES "TagsSupport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
