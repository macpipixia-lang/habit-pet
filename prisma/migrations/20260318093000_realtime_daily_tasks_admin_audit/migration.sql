-- CreateEnum
CREATE TYPE "DailyTaskCompletionStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "XpLedgerScope" AS ENUM ('USER', 'PET');

-- CreateTable
CREATE TABLE "XpLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPetId" TEXT,
    "scope" "XpLedgerScope" NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTaskCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "taskSlug" TEXT NOT NULL,
    "userPetId" TEXT,
    "status" "DailyTaskCompletionStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "revertedAt" TIMESTAMP(3),
    "revertedBy" TEXT,
    "pointsDelta" INTEGER NOT NULL DEFAULT 0,
    "userXpDelta" INTEGER NOT NULL DEFAULT 0,
    "petXpDelta" INTEGER NOT NULL DEFAULT 0,
    "ledgerGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XpLedger_userId_createdAt_idx" ON "XpLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "XpLedger_userPetId_createdAt_idx" ON "XpLedger"("userPetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTaskCompletion_userId_dateKey_taskSlug_key" ON "DailyTaskCompletion"("userId", "dateKey", "taskSlug");

-- CreateIndex
CREATE INDEX "DailyTaskCompletion_userId_dateKey_status_idx" ON "DailyTaskCompletion"("userId", "dateKey", "status");

-- AddForeignKey
ALTER TABLE "XpLedger" ADD CONSTRAINT "XpLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpLedger" ADD CONSTRAINT "XpLedger_userPetId_fkey" FOREIGN KEY ("userPetId") REFERENCES "UserPet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTaskCompletion" ADD CONSTRAINT "DailyTaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTaskCompletion" ADD CONSTRAINT "DailyTaskCompletion_userPetId_fkey" FOREIGN KEY ("userPetId") REFERENCES "UserPet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
