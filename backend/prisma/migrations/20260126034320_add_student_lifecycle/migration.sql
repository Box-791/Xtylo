/*
  Warnings:

  - You are about to drop the column `consent` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "consent",
ADD COLUMN     "contacted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactedAt" TIMESTAMP(3),
ADD COLUMN     "visitCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visitCompletedAt" TIMESTAMP(3);
