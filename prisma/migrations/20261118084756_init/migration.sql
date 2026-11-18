-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "BudgetRange" AS ENUM ('UNDER_10M', 'M10_25M', 'M25_50M', 'M50_100M', 'OVER_100M');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('BRANDING', 'WEBSITE', 'MOBILE_APP', 'AI_AUTOMATION', 'SOCIAL_MEDIA', 'LAINNYA');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "needs" TEXT NOT NULL,
    "budget" "BudgetRange" NOT NULL,
    "targetTimeline" DATE NOT NULL,
    "pipelineStatus" "PipelineStatus" NOT NULL DEFAULT 'NEW',
    "aiStatus" "AiStatus" NOT NULL DEFAULT 'PENDING',
    "aiCategory" "ServiceCategory",
    "aiPriority" "Priority",
    "aiResult" JSONB,
    "aiError" TEXT,
    "aiAttempts" INTEGER NOT NULL DEFAULT 0,
    "aiProcessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Brief_createdAt_idx" ON "Brief"("createdAt");

-- CreateIndex
CREATE INDEX "Brief_aiCategory_aiPriority_idx" ON "Brief"("aiCategory", "aiPriority");

-- CreateIndex
CREATE INDEX "Brief_pipelineStatus_idx" ON "Brief"("pipelineStatus");
