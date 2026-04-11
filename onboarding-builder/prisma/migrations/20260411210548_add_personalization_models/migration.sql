-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DESIGNER', 'RECRUITER');

-- CreateEnum
CREATE TYPE "EnrollmentStage" AS ENUM ('ENROLL', 'PROFILE', 'PERSONALIZE', 'DELIVERED');

-- CreateEnum
CREATE TYPE "AdaptationType" AS ENUM ('STANDARD', 'FAST_TRACK', 'SUPPLEMENTAL', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ContentDepth" AS ENUM ('FOUNDATIONAL', 'STANDARD', 'ADVANCED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'DESIGNER';

-- CreateTable
CREATE TABLE "Joinee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Joinee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoineeEnrollment" (
    "id" TEXT NOT NULL,
    "joineeId" TEXT NOT NULL,
    "sourceProjectId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "stage" "EnrollmentStage" NOT NULL DEFAULT 'ENROLL',
    "profile" JSONB,
    "personalizationPlan" JSONB,
    "joineeSlug" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoineeEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalizedProject" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalizedModule" (
    "id" TEXT NOT NULL,
    "personalizedProjectId" TEXT NOT NULL,
    "sourceModuleId" TEXT,
    "type" "ModuleType" NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "adaptationType" "AdaptationType" NOT NULL,
    "contentDepth" "ContentDepth" NOT NULL,
    "content" JSONB NOT NULL,
    "rationale" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Joinee_email_key" ON "Joinee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JoineeEnrollment_joineeSlug_key" ON "JoineeEnrollment"("joineeSlug");

-- CreateIndex
CREATE INDEX "JoineeEnrollment_sourceProjectId_idx" ON "JoineeEnrollment"("sourceProjectId");

-- CreateIndex
CREATE INDEX "JoineeEnrollment_joineeId_idx" ON "JoineeEnrollment"("joineeId");

-- CreateIndex
CREATE INDEX "JoineeEnrollment_recruiterId_idx" ON "JoineeEnrollment"("recruiterId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedProject_enrollmentId_key" ON "PersonalizedProject"("enrollmentId");

-- CreateIndex
CREATE INDEX "PersonalizedModule_personalizedProjectId_position_idx" ON "PersonalizedModule"("personalizedProjectId", "position");

-- AddForeignKey
ALTER TABLE "JoineeEnrollment" ADD CONSTRAINT "JoineeEnrollment_joineeId_fkey" FOREIGN KEY ("joineeId") REFERENCES "Joinee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoineeEnrollment" ADD CONSTRAINT "JoineeEnrollment_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedProject" ADD CONSTRAINT "PersonalizedProject_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "JoineeEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedModule" ADD CONSTRAINT "PersonalizedModule_personalizedProjectId_fkey" FOREIGN KEY ("personalizedProjectId") REFERENCES "PersonalizedProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
