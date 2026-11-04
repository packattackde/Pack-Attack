import { prisma } from '@/lib/prisma';
import { CardmarketBrowserFulfillment } from './fulfillment';
import { loadCardmarketBrowserConfigFromEnv } from './config';
import { ensureCardmarketStorageState } from './session-login';
import {
  preparePullforgeOrderInCardmarket,
  pullforgeOrderToShipment,
} from './prepare-pullforge-order';
import { cardmarketShoppingCartUrl } from './links';
import { notifyAdminsCardmarketCartReady } from './notify-admin';

const runningOrderIds = new Set<string>();

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

  try {
    await ensureCardmarketStorageState(config);

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

    fulfillment = new CardmarketBrowserFulfillment(config);
    const browserPrep = await preparePullforgeOrderInCardmarket(
      fulfillment,
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Cardmarket cart automation failed';
    console.error(`Cardmarket cart job ${orderId}:`, error);
    await prisma.order
      .update({
        where: { id: orderId },
        data: { cardmarketLastError: message },
      })
      .catch(() => undefined);
  } finally {
    await fulfillment?.close();
  }
}
