-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM (
  'BATTLE_WIN',
  'BATTLE_LOSS',
  'BATTLE_DRAW',
  'CARD_HIT_BONUS',
  'VOLUME_BONUS',
  'DECAY',
  'ADMIN_ADJUSTMENT'
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "allTimePoints" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "battlesThisWeek" INTEGER NOT NULL DEFAULT 0,
    "totalBattles" INTEGER NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "totalLosses" INTEGER NOT NULL DEFAULT 0,
    "lastBattleAt" TIMESTAMP(3),
    "lastDecayAt" TIMESTAMP(3),
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeaderboardEntry_userId_key" ON "LeaderboardEntry"("userId");

CREATE INDEX "LeaderboardEntry_totalPoints_idx" ON "LeaderboardEntry"("totalPoints");
CREATE INDEX "LeaderboardEntry_weeklyPoints_idx" ON "LeaderboardEntry"("weeklyPoints");
CREATE INDEX "LeaderboardEntry_monthlyPoints_idx" ON "LeaderboardEntry"("monthlyPoints");

ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "leaderboardEntryId" TEXT NOT NULL,
    "battleId" TEXT,
    "type" "PointTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PointTransaction_leaderboardEntryId_createdAt_idx" ON "PointTransaction"("leaderboardEntryId", "createdAt" DESC);
CREATE INDEX "PointTransaction_battleId_idx" ON "PointTransaction"("battleId");

ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_leaderboardEntryId_fkey" FOREIGN KEY ("leaderboardEntryId") REFERENCES "LeaderboardEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
