import { prisma } from '@/lib/prisma';
import { Package } from 'lucide-react';
import BoxesMockupClient from './BoxesMockupClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pack Display Mockup · packs.com style',
  description: 'Mockup: booster-pack-style display comparison for Pack-Attack.',
  robots: { index: false, follow: false },
};

export const revalidate = 60;

async function getBoxes() {
  try {
    return await prisma.box.findMany({
      where: { isActive: true },
      orderBy: [
        { featured: 'desc' },
        { popularity: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: { select: { cards: true } },
        cards: {
          orderBy: { coinValue: 'desc' },
          take: 1,
          select: {
            id: true,
            name: true,
            imageUrlGatherer: true,
            coinValue: true,
          },
        },
        createdByShop: { select: { id: true, name: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function BoxesMockupPage() {
  const rawBoxes = await getBoxes();

  const boxes = rawBoxes.map((box) => ({
    id: box.id,
    name: box.name,
    imageUrl: box.imageUrl,
    price: Number(box.price),
    cardsPerPack: box.cardsPerPack,
    featured: box.featured,
    games: box.games,
    topCard: box.cards[0]
      ? {
          id: box.cards[0].id,
          name: box.cards[0].name,
          imageUrlGatherer: box.cards[0].imageUrlGatherer,
          coinValue: Number(box.cards[0].coinValue),
        }
      : null,
    totalCards: box._count.cards,
    createdByShop: box.createdByShop,
  }));

  const availableGames = [
    ...new Set(boxes.flatMap((b) => b.games || [])),
  ].sort();

  return (
    <div className="min-h-screen font-display relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 radial-gradient" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,79,255,0.15),transparent_60%)]" />

      <div className="relative container py-14 sm:py-16">
        {/* Mockup banner */}
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-[rgba(200,79,255,0.12)] to-[rgba(59,130,246,0.1)] border border-[rgba(200,79,255,0.3)] flex flex-wrap items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-[#C84FFF] text-white text-[11px] font-bold uppercase tracking-wider">
            Mockup
          </span>
          <span className="text-[#f0f0f5] text-sm">
            <b>packs.com-style</b> pack display — compare with current at{' '}
            <a href="/boxes" className="underline text-[#C84FFF]">
              /boxes
            </a>
          </span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-5 rounded-full bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] text-sm shadow-md">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[rgba(200,79,255,0.15)]">
              <Package className="w-3 h-3 text-[#C84FFF]" />
            </div>
            <span className="text-[#f0f0f5] font-medium">Rip Packs</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-3">
            <span className="text-white">Open </span>
            <span className="bg-gradient-to-r from-[#C84FFF] to-[#E879F9] bg-clip-text text-transparent">
              Packs
            </span>
          </h1>
          <p className="text-[#8888aa] text-lg max-w-xl">
            Pick a pack, rip it open and keep, ship, or sell the hits instantly.
          </p>
        </div>

        <BoxesMockupClient boxes={boxes} availableGames={availableGames} />
      </div>
    </div>
  );
}
