import type { ShippingAddressInput } from './types';

/** Minimal Pullforge order payload for Cardmarket batch planning. */
export type PullforgeOrderForMkm = {
  orderId: string;
  shipping: ShippingAddressInput;
  /** Cardmarket seller usernames already chosen for each line (after listing pick). */
  sellerUsernames: string[];
};

export type CartBatchPlan = {
  /** Orders that can share one cart before a single admin checkout. */
  orderIds: string[];
  /** Why this batch stands alone (human-readable). */
  reason: string;
};

export function shippingFingerprint(shipping: ShippingAddressInput): string {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return [
    norm(shipping.name),
    norm(shipping.street),
    norm(shipping.zip),
    norm(shipping.city),
    norm(shipping.country),
    norm(shipping.extra ?? ''),
  ].join('|');
}

/**
 * Cardmarket groups the cart by **seller**. Each seller block has **one** ship-to address
 * for all items from that seller in the current cart.
 *
 * You can combine multiple Pullforge orders in one cart only if no MKM seller would need
 * two different addresses at once.
 */
export function planCartBatches(orders: PullforgeOrderForMkm[]): CartBatchPlan[] {
  const batches: CartBatchPlan[] = [];
  let current: PullforgeOrderForMkm[] = [];
  const sellerToShipKey = new Map<string, string>();

  const flush = (reason: string) => {
    if (current.length === 0) return;
    batches.push({
      orderIds: current.map((o) => o.orderId),
      reason,
    });
    current = [];
    sellerToShipKey.clear();
  };

  for (const order of orders) {
    const shipKey = shippingFingerprint(order.shipping);
    let conflict = false;
    for (const seller of order.sellerUsernames) {
      const existing = sellerToShipKey.get(seller);
      if (existing && existing !== shipKey) {
        conflict = true;
        break;
      }
    }

    if (conflict) {
      flush('Previous batch closed: same MKM seller cannot ship to two addresses in one cart.');
      current.push(order);
      for (const seller of order.sellerUsernames) {
        sellerToShipKey.set(seller, shipKey);
      }
      continue;
    }

    current.push(order);
    for (const seller of order.sellerUsernames) {
      sellerToShipKey.set(seller, shipKey);
    }
  }

  if (current.length > 0) {
    flush(
      current.length === 1
        ? 'Single Pullforge order (safest default).'
        : 'Orders share no conflicting seller → address pairs.'
    );
  }

  return batches;
}
