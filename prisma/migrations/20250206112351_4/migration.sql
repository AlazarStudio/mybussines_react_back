/*
  Warnings:

  - You are about to drop the column `all` on the `Map` table. All the data in the column will be lost.
  - Added the required column `smsp` to the `Map` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Map" DROP COLUMN "all",
ADD COLUMN     "smsp" TEXT NOT NULL;
