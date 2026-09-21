import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { LandingPage, type LandingCard, type LandingPull, type LandingBox, type LandingStats } from '@/components/LandingPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PullForge — Neon District',
  description:
    'Welcome to the Neon District. Rip packs, battle for the biggest pulls, and forge legendary collections. Every pull is forged in neon.',
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function uniqueCards(cards: LandingCard[]): LandingCard[] {
  const seen = new Set<string>();
  const out: LandingCard[] = [];
  for (const card of cards) {
    const key = card.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(card);
    if (out.length >= 3) break;
  }
  return out;
}

const emptyStats: LandingStats = {
  packsRipped: '0',
  battlesFought: '0',
  collectors: '0',
  liveBoxes: '0',
};

export default async function Home() {
  try {
    const [recentPulls, heroPulls, catalogCards, pullCount, battleCount, collectorCount, boxCount, featuredBoxes] =
      await Promise.all([
        prisma.pull.findMany({
          where: { cardId: { not: null }, user: { isBot: false } },
          include: {
            user: { select: { name: true } },
            card: { select: { name: true, rarity: true, coinValue: true, imageUrlGatherer: true } },
          },
          orderBy: { timestamp: 'desc' },
          take: 20,
        }),
        prisma.pull.findMany({
          where: { cardId: { not: null }, cardValue: { gt: 0 }, user: { isBot: false } },
          include: {
            card: { select: { name: true, rarity: true, coinValue: true, imageUrlGatherer: true } },
          },
          orderBy: [{ cardValue: 'desc' }, { timestamp: 'desc' }],
          take: 12,
        }),
        prisma.card.findMany({
          where: { box: { isActive: true }, imageUrlGatherer: { not: '' } },
          orderBy: { coinValue: 'desc' },
          take: 12,
          select: { name: true, rarity: true, coinValue: true, imageUrlGatherer: true },
        }),
        prisma.pull.count({ where: { cardId: { not: null } } }),
        prisma.battle.count(),
        prisma.user.count({ where: { isBot: false } }),
        prisma.box.count({ where: { isActive: true } }),
        prisma.box.findMany({
          where: { isActive: true, imageUrl: { not: '' } },
          orderBy: [{ featured: 'desc' }, { popularity: 'desc' }, { createdAt: 'desc' }],
          take: 3,
          select: { id: true, name: true, imageUrl: true, price: true },
        }),
      ]);

    const pulls: LandingPull[] = recentPulls
      .filter((p) => p.card)
      .map((p) => ({
        userName: p.user.name?.trim() || 'Anonymous',
        cardName: p.card!.name,
        rarity: p.card!.rarity || 'rare',
        coinValue: Number(p.card!.coinValue || 0),
      }));

    const fromPulls: LandingCard[] = heroPulls
      .filter((p) => p.card)
      .map((p) => ({
        name: p.card!.name,
        rarity: p.card!.rarity || 'rare',
        image: p.card!.imageUrlGatherer || null,
        coinValue: Number(p.card!.coinValue || 0),
      }));

    const fromCatalog: LandingCard[] = catalogCards.map((c) => ({
      name: c.name,
      rarity: c.rarity || 'rare',
      image: c.imageUrlGatherer || null,
      coinValue: Number(c.coinValue || 0),
    }));

    const heroCards = uniqueCards([...fromPulls, ...fromCatalog]);

    const boxes: LandingBox[] = featuredBoxes.map((b) => ({
      id: b.id,
      name: b.name,
      imageUrl: b.imageUrl,
      price: Number(b.price),
    }));

    const stats: LandingStats = {
      packsRipped: formatCount(pullCount),
      battlesFought: formatCount(battleCount),
      collectors: formatCount(collectorCount),
      liveBoxes: formatCount(boxCount),
    };

    return <LandingPage pulls={pulls} heroCards={heroCards} boxes={boxes} stats={stats} />;
  } catch (error) {
    console.error('[Landing] Failed to load live data:', error);
    return <LandingPage pulls={[]} heroCards={[]} boxes={[]} stats={emptyStats} />;
  }
}
