-- Migrate existing battles away from removed enum values
UPDATE "Battle" SET "winCondition" = 'HIGHEST' WHERE "winCondition" = 'JACKPOT';
UPDATE "Battle" SET "battleMode" = 'LOWEST_CARD' WHERE "battleMode" = 'ALL_CARDS';

-- Recreate WinCondition enum without JACKPOT
-- Must drop default before changing type, then re-add after
ALTER TABLE "Battle" ALTER COLUMN "winCondition" DROP DEFAULT;
ALTER TYPE "WinCondition" RENAME TO "WinCondition_old";
CREATE TYPE "WinCondition" AS ENUM ('HIGHEST', 'LOWEST', 'SHARE_MODE');
ALTER TABLE "Battle" ALTER COLUMN "winCondition" TYPE "WinCondition" USING "winCondition"::text::"WinCondition";
ALTER TABLE "Battle" ALTER COLUMN "winCondition" SET DEFAULT 'HIGHEST'::"WinCondition";
DROP TYPE "WinCondition_old";

-- Recreate BattleMode enum without ALL_CARDS
ALTER TABLE "Battle" ALTER COLUMN "battleMode" DROP DEFAULT;
ALTER TYPE "BattleMode" RENAME TO "BattleMode_old";
CREATE TYPE "BattleMode" AS ENUM ('LOWEST_CARD', 'HIGHEST_CARD');
ALTER TABLE "Battle" ALTER COLUMN "battleMode" TYPE "BattleMode" USING "battleMode"::text::"BattleMode";
ALTER TABLE "Battle" ALTER COLUMN "battleMode" SET DEFAULT 'LOWEST_CARD'::"BattleMode";
DROP TYPE "BattleMode_old";
