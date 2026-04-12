-- Migrate existing battles away from removed enum values
UPDATE "Battle" SET "winCondition" = 'HIGHEST' WHERE "winCondition" = 'JACKPOT';
UPDATE "Battle" SET "battleMode" = 'LOWEST_CARD' WHERE "battleMode" = 'ALL_CARDS';

-- Recreate WinCondition enum without JACKPOT
ALTER TYPE "WinCondition" RENAME TO "WinCondition_old";
CREATE TYPE "WinCondition" AS ENUM ('HIGHEST', 'LOWEST', 'SHARE_MODE');
ALTER TABLE "Battle" ALTER COLUMN "winCondition" TYPE "WinCondition" USING "winCondition"::text::"WinCondition";
ALTER TABLE "Battle" ALTER COLUMN "winCondition" SET DEFAULT 'HIGHEST';
DROP TYPE "WinCondition_old";

-- Recreate BattleMode enum without ALL_CARDS
ALTER TYPE "BattleMode" RENAME TO "BattleMode_old";
CREATE TYPE "BattleMode" AS ENUM ('LOWEST_CARD', 'HIGHEST_CARD');
ALTER TABLE "Battle" ALTER COLUMN "battleMode" TYPE "BattleMode" USING "battleMode"::text::"BattleMode";
ALTER TABLE "Battle" ALTER COLUMN "battleMode" SET DEFAULT 'LOWEST_CARD';
DROP TYPE "BattleMode_old";
