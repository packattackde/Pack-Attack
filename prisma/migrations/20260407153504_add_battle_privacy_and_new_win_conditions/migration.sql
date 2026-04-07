-- CreateEnum
CREATE TYPE "BattlePrivacy" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterEnum
ALTER TYPE "WinCondition" ADD VALUE 'SHARE_MODE';
ALTER TYPE "WinCondition" ADD VALUE 'JACKPOT';

-- AlterTable
ALTER TABLE "Battle" ADD COLUMN "privacy" "BattlePrivacy" NOT NULL DEFAULT 'PUBLIC';
