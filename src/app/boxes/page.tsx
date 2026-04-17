import { prisma } from '@/lib/prisma';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Package } from 'lucide-react';
import BoxesClient from './BoxesClient';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('boxes');
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDesc'),
      type: 'website',
    },
  };
}

// PERFORMANCE: Use ISR with 60-second revalidation instead of force-dynamic
// This caches the page and regenerates it every 60 seconds, reducing DB load
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
        _count: {
          select: { cards: true },
        },
        // Only need the top-value card for the pack hero art
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
        createdByShop: {
          select: { id: true, name: true },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function BoxesPage() {
  const t = await getTranslations('boxes');
  const rawBoxes = await getBoxes();

  const boxes = rawBoxes.map((box) => ({
    id: box.id,
    name: box.name,
    imageUrl: box.imageUrl,
    price: Number(box.price),
    cardsPerPack: box.cardsPerPack,
    featured: box.featured,
    games: box.games,
    totalCards: box._count.cards,
    topCard: box.cards[0]
      ? {
          id: box.cards[0].id,
          name: box.cards[0].name,
          imageUrlGatherer: box.cards[0].imageUrlGatherer,
          coinValue: Number(box.cards[0].coinValue),
        }
      : null,
    createdByShop: box.createdByShop,
  }));

  const availableGames = [
    ...new Set(boxes.flatMap((box) => box.games || [])),
  ].sort();

  return (
    <div className="min-h-screen font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-14 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-5 rounded-full bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] text-sm shadow-md">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[rgba(200,79,255,0.15)]">
              <Package className="w-3 h-3 text-[#C84FFF]" />
            </div>
            <span className="text-[#f0f0f5] font-medium">{t('badge')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="text-white">
                {t('title').split(' ').slice(0, -1).join(' ')}{' '}
              </span>
              <span className="text-[#C84FFF]">
                {t('title').split(' ').slice(-1)[0]}
              </span>
            </h1>
            <InfoTooltip infoKey="boxes.overview" />
          </div>
          <p className="text-[#8888aa] text-lg">{t('subtitle')}</p>
        </div>

        <BoxesClient boxes={boxes} availableGames={availableGames} />
      </div>
    </div>
  );
}
