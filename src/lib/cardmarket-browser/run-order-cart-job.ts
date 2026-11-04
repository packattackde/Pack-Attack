import { prisma } from '@/lib/prisma';
import { CardmarketBrowserFulfillment } from './fulfillment';
import {
  isCardmarketBrowserConfigured,
  loadCardmarketBrowserConfigFromEnv,
} from './config';
import {
  preparePullforgeOrderInCardmarket,
  pullforgeOrderToShipment,
} from './prepare-pullforge-order';
import { cardmarketShoppingCartUrl } from './links';
import { notifyAdminsCardmarketCartReady } from './notify-admin';
import { CardmarketBotCheckError } from './bot-guard';

const runningOrderIds = new Set<string>();
const JOB_TIMEOUT_MS = 120_000;

export function isCardmarketCartJobRunning(orderId: string): boolean {
  return runningOrderIds.has(orderId);
}

export async function startCardmarketCartJob(orderId: string): Promise<
  'started' | 'already_running'
> {
  if (runningOrderIds.has(orderId)) {
    return 'already_running';
  }
  runningOrderIds.add(orderId);
  void executeCardmarketCartJob(orderId).finally(() => runningOrderIds.delete(orderId));
  return 'started';
}

async function executeCardmarketCartJob(orderId: string): Promise<void> {
  const config = loadCardmarketBrowserConfigFromEnv();
  let fulfillment: CardmarketBrowserFulfillment | null = null;

  const run = async (): Promise<void> => {
    let localFulfillment: CardmarketBrowserFulfillment | null = null;
    try {
    if (!config.allowServerAutomation) {
      throw new Error(
        'Server cart automation is off (Cardmarket bot check). Use “Add to cart on this PC” with the local bridge running.'
      );
    }
    if (!isCardmarketBrowserConfigured(config)) {
      throw new Error(
        'No Cardmarket session on server. Use local cart fill on your PC (npm run cardmarket:local-bridge).'
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!existing || existing.items.length === 0) {
      throw new Error('Order not found or has no items');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        cardmarketQueuedAt: new Date(),
        cardmarketPreparedAt: null,
        cardmarketLastError: null,
      },
    });

    localFulfillment = new CardmarketBrowserFulfillment(config);
    fulfillment = localFulfillment;
    const browserPrep = await preparePullforgeOrderInCardmarket(
      localFulfillment,
      pullforgeOrderToShipment(existing)
    );

    const cartUrl = browserPrep.cartUrl ?? cardmarketShoppingCartUrl();

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        fulfillmentChannel: 'CARDMARKET',
        cardmarketPreparedAt: new Date(),
        cardmarketLastError: null,
      },
    });

    notifyAdminsCardmarketCartReady({
      pullforgeOrderIds: [orderId],
      lines: existing.items.map((i) => i.cardName),
      cartUrl,
    }).catch((err) => console.error('Cardmarket notify email failed:', err));
    } finally {
      await localFulfillment?.close();
    }
  };

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error('Cardmarket cart job timed out (bot check or slow page).')),
      JOB_TIMEOUT_MS
    );
  });

  try {
    await Promise.race([run(), timeout]);
  } catch (error) {
    const message =
      error instanceof CardmarketBotCheckError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Cardmarket cart automation failed';
    console.error(`Cardmarket cart job ${orderId}:`, error);
    await prisma.order
      .update({
        where: { id: orderId },
        data: { cardmarketLastError: message },
      })
      .catch(() => undefined);
  }
}
