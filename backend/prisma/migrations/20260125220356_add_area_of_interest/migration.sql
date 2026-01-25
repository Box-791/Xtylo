-- CreateEnum
CREATE TYPE "AreaOfInterest" AS ENUM ('COSMETOLOGY', 'BARBER', 'NAIL_TECHNICIAN');

-- DropIndex
DROP INDEX "Student_campaignId_idx";

-- DropIndex
DROP INDEX "Student_email_idx";

-- DropIndex
DROP INDEX "Student_phone_idx";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "areaOfInterest" "AreaOfInterest" NOT NULL DEFAULT 'COSMETOLOGY';
