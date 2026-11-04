import { cardmarketProductSearchUrl, cardmarketShoppingCartUrl } from './links';
import { assertSingleCardmarketGame, inferCardmarketGameSlug } from './cardmarket-game';

export type CardmarketOrderExport = {
  pullforgeOrderId: string;
  exportedAt: string;
  shipping: {
    name: string;
    email: string;
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  game: string;
  items: Array<{
    cardName: string;
    cardmarketSearchUrl: string;
    game: string;
  }>;
  cardmarketShoppingCartUrl: string;
  sellerRulesHint: string;
};

export function buildCardmarketOrderExport(order: {
  id: string;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  items: { cardName: string }[];
}): CardmarketOrderExport {
  const names = order.items.map((i) => i.cardName);
  const game = names.length > 0 ? assertSingleCardmarketGame(names) : 'Magic';

  return {
    pullforgeOrderId: order.id,
    exportedAt: new Date().toISOString(),
    game,
    shipping: {
      name: order.shippingName,
      email: order.shippingEmail,
      street: order.shippingAddress,
      city: order.shippingCity,
      zip: order.shippingZip,
      country: order.shippingCountry,
    },
    items: order.items.map((item) => {
      const itemGame = inferCardmarketGameSlug(item.cardName);
      return {
        cardName: item.cardName,
        game: itemGame,
        cardmarketSearchUrl: cardmarketProductSearchUrl(item.cardName, { game: itemGame }),
      };
    }),
    cardmarketShoppingCartUrl: cardmarketShoppingCartUrl({ game }),
    sellerRulesHint: 'Germany sellers only, min 100 sales, cheapest listing.',
  };
}

/** Plain text for pasting into Cardmarket address modal. */
export function formatShippingClipboard(exportData: CardmarketOrderExport): string {
  const s = exportData.shipping;
  return [s.name, s.street, `${s.zip} ${s.city}`, s.country].filter(Boolean).join('\n');
}

export function cardmarketExportFilename(orderId: string): string {
  return `pullforge-cardmarket-${orderId.slice(-8)}.json`;
}
