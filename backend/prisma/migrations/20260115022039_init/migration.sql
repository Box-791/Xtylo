/*
  Warnings:

  - The primary key for the `Student` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `campaign` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `highSchool` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Student` table. All the data in the column will be lost.
  - The `id` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AdminUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `campaignId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Student" DROP CONSTRAINT "Student_pkey",
DROP COLUMN "campaign",
DROP COLUMN "highSchool",
DROP COLUMN "status",
ADD COLUMN     "campaignId" INTEGER NOT NULL,
ADD COLUMN     "schoolId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ADD CONSTRAINT "Student_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "AdminUser";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" SERIAL NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachLog" (
    "id" SERIAL NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OutreachStatus" NOT NULL,
    "studentId" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "OutreachLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachLog" ADD CONSTRAINT "OutreachLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachLog" ADD CONSTRAINT "OutreachLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OutreachMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
