import { CardmarketBrowserFulfillment } from './fulfillment';
import {
  isCardmarketBrowserConfigured,
  loadCardmarketBrowserConfigFromEnv,
} from './config';
import {
  preparePullforgeOrderInCardmarket,
  type PullforgeOrderShipment,
} from './prepare-pullforge-order';

export type FulfillOrderLocallyResult = {
  cartUrl: string;
  browserPrep: Awaited<ReturnType<typeof preparePullforgeOrderInCardmarket>>;
};

export async function fulfillPullforgeOrderLocally(
  shipment: PullforgeOrderShipment
): Promise<FulfillOrderLocallyResult> {
  const config = loadCardmarketBrowserConfigFromEnv();
  config.headless = false;

  if (!isCardmarketBrowserConfigured(config)) {
    throw new Error(
      'Run npm run cardmarket:login on this PC first (real browser — pass bot check), then try again.'
    );
  }

  const fulfillment = new CardmarketBrowserFulfillment(config);
  try {
    const browserPrep = await preparePullforgeOrderInCardmarket(fulfillment, shipment);
    return { cartUrl: browserPrep.cartUrl, browserPrep };
  } finally {
    await fulfillment.close();
  }
}

export async function fetchShipmentFromPullforge(
  pullforgeBaseUrl: string,
  orderId: string,
  fulfillmentKey: string
): Promise<PullforgeOrderShipment> {
  const url = `${pullforgeBaseUrl.replace(/\/$/, '')}/api/admin/orders/${orderId}/cardmarket/shipment`;
  const res = await fetch(url, {
    headers: { 'x-fulfillment-key': fulfillmentKey },
  });
  const data = (await res.json()) as { shipment?: PullforgeOrderShipment; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to load order (${res.status})`);
  }
  if (!data.shipment) {
    throw new Error('Invalid shipment response from Pullforge');
  }
  return data.shipment;
}

export async function markOrderPreparedOnPullforge(
  pullforgeBaseUrl: string,
  orderId: string,
  fulfillmentKey: string,
  cartUrl: string
): Promise<void> {
  const url = `${pullforgeBaseUrl.replace(/\/$/, '')}/api/admin/orders/${orderId}/cardmarket/complete-local`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-fulfillment-key': fulfillmentKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cartUrl }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to update order (${res.status})`);
  }
}
