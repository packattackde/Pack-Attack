-- AlterTable: make boxId nullable on Battle (new battles use BattleRoundBox)
ALTER TABLE "Battle" ALTER COLUMN "boxId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BattleRoundBox" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "boxId" TEXT NOT NULL,

    CONSTRAINT "BattleRoundBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BattleRoundBox_battleId_roundNumber_key" ON "BattleRoundBox"("battleId", "roundNumber");

-- CreateIndex
CREATE INDEX "BattleRoundBox_battleId_idx" ON "BattleRoundBox"("battleId");

-- AddForeignKey
ALTER TABLE "BattleRoundBox" ADD CONSTRAINT "BattleRoundBox_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleRoundBox" ADD CONSTRAINT "BattleRoundBox_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;
