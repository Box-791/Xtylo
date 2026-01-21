/*
  Warnings:

  - You are about to drop the column `endDate` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `OutreachMessage` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `OutreachMessage` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `OutreachMessage` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `OutreachMessage` table. All the data in the column will be lost.
  - Added the required column `message` to the `OutreachMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `OutreachMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OutreachMessage" DROP COLUMN "body",
DROP COLUMN "channel",
DROP COLUMN "createdAt",
DROP COLUMN "subject",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "studentId" INTEGER NOT NULL;
