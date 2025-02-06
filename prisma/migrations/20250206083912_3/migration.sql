/*
  Warnings:

  - You are about to drop the column `centerId` on the `Service` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_centerId_fkey";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "centerId";

-- CreateTable
CREATE TABLE "ServiceOnCenters" (
    "centerId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "ServiceOnCenters_pkey" PRIMARY KEY ("centerId","serviceId")
);

-- AddForeignKey
ALTER TABLE "ServiceOnCenters" ADD CONSTRAINT "ServiceOnCenters_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOnCenters" ADD CONSTRAINT "ServiceOnCenters_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
