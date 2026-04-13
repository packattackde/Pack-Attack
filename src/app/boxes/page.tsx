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
export const revalidate = 60; // Revalidate every 60 seconds

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
          select: { cards: true }
        },
        cards: {
          orderBy: { coinValue: 'desc' },
          take: 3,
          select: {
            id: true,
            name: true,
            imageUrlGatherer: true,
            coinValue: true,
          }
        },
        createdByShop: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
  } catch {
    return [];
  }
}

export default async function BoxesPage() {
  const t = await getTranslations('boxes');
  const rawBoxes = await getBoxes();

  // Convert Decimal to Number for client component
  const boxes = rawBoxes.map(box => ({
    ...box,
    price: Number(box.price),
    cards: box.cards.map(card => ({
      ...card,
      coinValue: Number(card.coinValue),
    })),
  }));

  // Extract unique games from all boxes
  const availableGames = [...new Set(
    boxes.flatMap(box => box.games || [])
  )].sort();

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
              <span className="text-white">{t('title').split(' ').slice(0, -1).join(' ')} </span>
              <span className="text-[#C84FFF]">{t('title').split(' ').slice(-1)[0]}</span>
            </h1>
            <InfoTooltip infoKey="boxes.overview" />
          </div>
          <p className="text-[#8888aa] text-lg">{t('subtitle')}</p>
        </div>

        {/* Client-side filterable boxes */}
        <BoxesClient boxes={boxes} availableGames={availableGames} />
      </div>
    </div>
  );
}
