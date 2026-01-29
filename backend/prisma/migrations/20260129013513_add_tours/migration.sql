-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "TourVisit" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "TourStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "TourVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TourVisit_startsAt_idx" ON "TourVisit"("startsAt");

-- CreateIndex
CREATE INDEX "TourVisit_studentId_idx" ON "TourVisit"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TourVisit_startsAt_key" ON "TourVisit"("startsAt");

-- AddForeignKey
ALTER TABLE "TourVisit" ADD CONSTRAINT "TourVisit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
