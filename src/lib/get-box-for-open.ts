import { prisma, withRetry } from '@/lib/prisma';
import { boxCache } from '@/lib/cache';
import { cache } from 'react';

const BOX_OPEN_CACHE_TTL = 10 * 60 * 1000;

function resolveCardImageUrl(card: {
  imageUrlGatherer: string;
  imageUrlScryfall: string | null;
}): string | null {
  const scry = card.imageUrlScryfall?.trim();
  if (scry) return scry;
  const gatherer = card.imageUrlGatherer?.trim();
  return gatherer || null;
}

export type OpenBoxCard = {
  id: string;
  name: string;
  imageUrlGatherer: string;
  imageUrlScryfall: string | null;
  coinValue: number;
  pullRate: number;
  rarity: string;
};

export type OpenBoxData = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  cardsPerPack: number;
  cardBackUrl: string | null;
  games: string[];
  cards: OpenBoxCard[];
};

/** Server-side box + full card pool for /open/[boxId] (deduped per request). */
export const getBoxForOpen = cache(async (boxId: string): Promise<OpenBoxData | null> => {
  const cacheKey = `box-open:${boxId}`;
  const cached = boxCache.get(cacheKey) as OpenBoxData | undefined;
  if (cached) {
    return cached;
  }

  const box = await withRetry(
    () =>
      prisma.box.findUnique({
        where: { id: boxId },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          cardsPerPack: true,
          cardBackUrl: true,
          games: true,
          isActive: true,
          cards: {
            orderBy: { coinValue: 'desc' },
            select: {
              id: true,
              name: true,
              imageUrlGatherer: true,
              imageUrlScryfall: true,
              coinValue: true,
              pullRate: true,
              rarity: true,
            },
          },
        },
      }),
    'openBox:find',
  );

  if (!box || !box.isActive) {
    return null;
  }

  let imageUrl = box.imageUrl;
  const topCard = box.cards[0];
  const chaseUrl = topCard ? resolveCardImageUrl(topCard) : null;
  if (chaseUrl && imageUrl !== chaseUrl) {
    imageUrl = chaseUrl;
  }

  const result: OpenBoxData = {
    id: box.id,
    name: box.name,
    description: box.description ?? '',
    imageUrl,
    price: Number(box.price),
    cardsPerPack: box.cardsPerPack,
    cardBackUrl: box.cardBackUrl,
    games: box.games,
    cards: box.cards.map((card) => ({
      id: card.id,
      name: card.name,
      imageUrlGatherer: card.imageUrlGatherer,
      imageUrlScryfall: card.imageUrlScryfall,
      coinValue: Number(card.coinValue),
      pullRate: Number(card.pullRate),
      rarity: card.rarity,
    })),
  };

  boxCache.set(cacheKey, result, BOX_OPEN_CACHE_TTL);
  return result;
});

export function getCardImagePreloadUrls(cards: OpenBoxCard[], max = 16): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    const url = card.imageUrlGatherer || card.imageUrlScryfall;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= max) break;
  }
  return urls;
}