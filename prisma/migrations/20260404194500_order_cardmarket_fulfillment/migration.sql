-- CreateEnum
CREATE TYPE "OrderFulfillmentChannel" AS ENUM ('SHOP', 'CARDMARKET');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "fulfillmentChannel" "OrderFulfillmentChannel",
ADD COLUMN "cardmarketQueuedAt" TIMESTAMP(3),
ADD COLUMN "cardmarketPreparedAt" TIMESTAMP(3),
ADD COLUMN "cardmarketLastError" TEXT;

CREATE INDEX "Order_fulfillmentChannel_idx" ON "Order"("fulfillmentChannel");
