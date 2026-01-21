-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "consent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Student_campaignId_idx" ON "Student"("campaignId");

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_phone_idx" ON "Student"("phone");
