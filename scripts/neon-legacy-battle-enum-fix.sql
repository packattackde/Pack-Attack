-- Run against Neon before `prisma db push` when upgrading from legacy PullForge battle enums.
-- Maps old BattleMode / BattleStatus labels to current Prisma schema values.

BEGIN;

ALTER TABLE "Battle" ALTER COLUMN "battleMode" DROP DEFAULT;
ALTER TABLE "Battle" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Battle" ALTER COLUMN "battleMode" TYPE text USING ("battleMode"::text);
ALTER TABLE "Battle" ALTER COLUMN "status" TYPE text USING ("status"::text);

UPDATE "Battle" SET "battleMode" = CASE
  WHEN "battleMode" = 'NORMAL' THEN 'LOWEST_CARD'
  WHEN "battleMode" = 'UPSIDE_DOWN' THEN 'HIGHEST_CARD'
  WHEN "battleMode" = 'JACKPOT' THEN 'ALL_CARDS'
  ELSE 'LOWEST_CARD'
END;

UPDATE "Battle" SET "status" = CASE
  WHEN "status" = 'WAITING' THEN 'OPEN'
  WHEN "status" = 'COUNTDOWN' THEN 'READY'
  WHEN "status" = 'IN_PROGRESS' THEN 'ACTIVE'
  WHEN "status" = 'FINISHED' THEN 'FINISHED_WIN'
  WHEN "status" = 'CANCELLED' THEN 'CANCELLED'
  ELSE 'OPEN'
END;

UPDATE "Battle" SET "status" = 'OPEN'
WHERE "status" NOT IN (
  'OPEN', 'FULL', 'READY', 'ACTIVE', 'FINISHED_WIN', 'FINISHED_DRAW', 'CANCELLED'
);

DROP TYPE IF EXISTS "BattleMode" CASCADE;
DROP TYPE IF EXISTS "BattleStatus" CASCADE;

COMMIT;
