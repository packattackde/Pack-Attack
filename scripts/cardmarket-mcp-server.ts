#!/usr/bin/env tsx
/**
 * Cardmarket fulfillment MCP (browser session — no MKM API).
 * Cart prep only; checkout disabled unless CARDMARKET_ALLOW_CHECKOUT=true.
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(process.cwd(), '.env.local') });
loadEnv({ path: resolve(process.cwd(), '.env') });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  CardmarketBrowserFulfillment,
  CardmarketBrowserSession,
  cardmarketProductSearchUrl,
  loadCardmarketBrowserConfigFromEnv,
  notifyAdminsCardmarketCartReady,
  planCartBatches,
  type PullforgeOrderForMkm,
} from '../src/lib/cardmarket-browser';

let fulfillment: CardmarketBrowserFulfillment | null = null;

function getFulfillment(): CardmarketBrowserFulfillment {
  const config = loadCardmarketBrowserConfigFromEnv();
  CardmarketBrowserSession.requireStorageFile(config);
  if (!fulfillment) {
    fulfillment = new CardmarketBrowserFulfillment(config);
  }
  return fulfillment;
}

const server = new Server(
  { name: 'pullforge-cardmarket', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'cardmarket_browser_status',
      description: 'Check Cardmarket login via saved browser session.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'cardmarket_get_cart',
      description: 'Read shopping cart summary from the website (not MKM API).',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'cardmarket_find_product_url',
      description: 'Build Cardmarket singles search URL for a card name (no API).',
      inputSchema: {
        type: 'object',
        properties: { search: { type: 'string' } },
        required: ['search'],
      },
    },
    {
      name: 'cardmarket_prepare_cart',
      description:
        'Add card to cart via browser and set per-seller shipping address. Does NOT checkout.',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Product name; picks first search hit' },
          productUrl: { type: 'string' },
          idArticle: { type: 'number' },
          resetCart: { type: 'boolean', default: true },
          shippingName: { type: 'string' },
          shippingStreet: { type: 'string' },
          shippingZip: { type: 'string' },
          shippingCity: { type: 'string' },
          shippingCountry: { type: 'string', description: 'ISO country, e.g. DE' },
          shippingExtra: { type: 'string' },
        },
        required: [
          'shippingName',
          'shippingStreet',
          'shippingZip',
          'shippingCity',
          'shippingCountry',
        ],
      },
    },
    {
      name: 'cardmarket_plan_batches',
      description:
        'Given Pullforge orders and chosen MKM seller usernames per order, return safe cart batches (same seller cannot ship to two addresses in one cart).',
      inputSchema: {
        type: 'object',
        properties: {
          orders: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                orderId: { type: 'string' },
                sellerUsernames: { type: 'array', items: { type: 'string' } },
                shippingName: { type: 'string' },
                shippingStreet: { type: 'string' },
                shippingZip: { type: 'string' },
                shippingCity: { type: 'string' },
                shippingCountry: { type: 'string' },
                shippingExtra: { type: 'string' },
              },
              required: [
                'orderId',
                'sellerUsernames',
                'shippingName',
                'shippingStreet',
                'shippingZip',
                'shippingCity',
                'shippingCountry',
              ],
            },
          },
        },
        required: ['orders'],
      },
    },
    {
      name: 'cardmarket_notify_admin_cart_ready',
      description:
        'Email admins Cardmarket cart link + Pullforge order ids after cart prep (requires RESEND + FULFILLMENT_NOTIFY_EMAIL or ADMIN users).',
      inputSchema: {
        type: 'object',
        properties: {
          pullforgeOrderIds: { type: 'array', items: { type: 'string' } },
          lines: { type: 'array', items: { type: 'string' } },
        },
        required: ['pullforgeOrderIds'],
      },
    },
  ],
}));

const prepareSchema = z.object({
  search: z.string().min(1).optional(),
  productUrl: z.string().url().optional(),
  idArticle: z.number().int().positive().optional(),
  resetCart: z.boolean().optional(),
  shippingName: z.string().min(1),
  shippingStreet: z.string().min(1),
  shippingZip: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingCountry: z.string().min(1),
  shippingExtra: z.string().optional(),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const svc = getFulfillment();

  switch (request.params.name) {
    case 'cardmarket_browser_status': {
      const status = await svc.ensureLoggedIn();
      return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
    }
    case 'cardmarket_get_cart': {
      const cart = await svc.getCartSummary();
      return { content: [{ type: 'text', text: JSON.stringify(cart, null, 2) }] };
    }
    case 'cardmarket_find_product_url': {
      const { search } = z.object({ search: z.string().min(1) }).parse(request.params.arguments ?? {});
      return {
        content: [{ type: 'text', text: cardmarketProductSearchUrl(search) }],
      };
    }
    case 'cardmarket_prepare_cart': {
      const args = prepareSchema.parse(request.params.arguments ?? {});
      if (!args.search && !args.productUrl && !args.idArticle) {
        throw new Error('Provide search, productUrl, or idArticle');
      }
      const result = await svc.prepareCartForCustomer({
        search: args.search,
        productUrl: args.productUrl,
        idArticle: args.idArticle,
        resetCart: args.resetCart ?? true,
        shipping: {
          name: args.shippingName,
          street: args.shippingStreet,
          zip: args.shippingZip,
          city: args.shippingCity,
          country: args.shippingCountry,
          extra: args.shippingExtra,
        },
      });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'cardmarket_plan_batches': {
      const body = z
        .object({
          orders: z.array(
            z.object({
              orderId: z.string().min(1),
              sellerUsernames: z.array(z.string()),
              shippingName: z.string().min(1),
              shippingStreet: z.string().min(1),
              shippingZip: z.string().min(1),
              shippingCity: z.string().min(1),
              shippingCountry: z.string().min(1),
              shippingExtra: z.string().optional(),
            })
          ),
        })
        .parse(request.params.arguments ?? {});
      const mapped: PullforgeOrderForMkm[] = body.orders.map((o) => ({
        orderId: o.orderId,
        sellerUsernames: o.sellerUsernames,
        shipping: {
          name: o.shippingName,
          street: o.shippingStreet,
          zip: o.shippingZip,
          city: o.shippingCity,
          country: o.shippingCountry,
          extra: o.shippingExtra,
        },
      }));
      const batches = planCartBatches(mapped);
      return { content: [{ type: 'text', text: JSON.stringify(batches, null, 2) }] };
    }
    case 'cardmarket_notify_admin_cart_ready': {
      const body = z
        .object({
          pullforgeOrderIds: z.array(z.string().min(1)).min(1),
          lines: z.array(z.string()).optional(),
        })
        .parse(request.params.arguments ?? {});
      const result = await notifyAdminsCardmarketCartReady(body);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await fulfillment?.close();
  process.exit(0);
});
