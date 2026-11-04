#!/usr/bin/env tsx
/**
 * Dry-run: add a card to the Cardmarket cart and set shipping — no checkout.
 *
 * Requires: npm run cardmarket:login first
 * Env: CARDMARKET_TEST_SEARCH (default Lightning Bolt), CARDMARKET_TEST_* shipping fields
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(process.cwd(), '.env.local') });
loadEnv({ path: resolve(process.cwd(), '.env') });

import { CardmarketBrowserFulfillment, loadCardmarketBrowserConfigFromEnv } from '../src/lib/cardmarket-browser';

async function main() {
  const config = loadCardmarketBrowserConfigFromEnv();
  const fulfillment = new CardmarketBrowserFulfillment(config);

  try {
    const who = await fulfillment.ensureLoggedIn();
    console.log('Logged in as', who.username ?? '(unknown)');

    const result = await fulfillment.prepareCartForCustomer({
      search: process.env.CARDMARKET_TEST_SEARCH ?? 'Lightning Bolt',
      resetCart: process.env.CARDMARKET_TEST_RESET_CART !== 'false',
      shipping: {
        name: process.env.CARDMARKET_TEST_SHIPPING_NAME ?? 'Pullforge Test User',
        street: process.env.CARDMARKET_TEST_SHIPPING_STREET ?? 'Teststraße 1',
        zip: process.env.CARDMARKET_TEST_SHIPPING_ZIP ?? '10115',
        city: process.env.CARDMARKET_TEST_SHIPPING_CITY ?? 'Berlin',
        country: process.env.CARDMARKET_TEST_SHIPPING_COUNTRY ?? 'DE',
        extra: process.env.CARDMARKET_TEST_SHIPPING_EXTRA,
      },
    });

    console.log(JSON.stringify(result, null, 2));
    console.log('\nDry run complete — checkout was NOT performed.');
  } finally {
    await fulfillment.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
