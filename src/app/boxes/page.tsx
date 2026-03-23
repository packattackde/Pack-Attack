import { prisma } from '@/lib/prisma';
import { Package } from 'lucide-react';
import BoxesClient from './BoxesClient';
import type { Metadata } from 'next';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Trading Card Boxes - Pack Attack',
  description: 'Browse our selection of trading card boxes. Open Pokemon, Magic: The Gathering, Yu-Gi-Oh, One Piece, Lorcana and more. Real cards, real thrills!',
  openGraph: {
    title: 'Trading Card Boxes - Pack Attack',
    description: 'Browse our selection of trading card boxes from all major TCGs.',
    type: 'website',
  },
};

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
    <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-14 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] text-sm shadow-md">
            <Package className="w-4 h-4 text-[#BFFF00]" />
            <span className="text-[#f0f0f5] font-medium">Card Packs</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            <span className="text-white">All </span>
            <span className="text-[#BFFF00]">Boxes</span>
          </h1>
          <p className="text-[#8888aa] text-lg">Browse and open packs to build your collection</p>
        </div>

        {/* Client-side filterable boxes */}
        <BoxesClient boxes={boxes} availableGames={availableGames} />
      </div>
    </div>
  );
}
