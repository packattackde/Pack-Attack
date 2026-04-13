import { redirect } from 'next/navigation';
import { InfoTooltip } from '@/components/InfoTooltip';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CollectionClient } from './CollectionClient';
import Link from 'next/link';
import { Layers, Package, Sparkles } from 'lucide-react';

async function getCollection() {
  const session = await getCurrentSession();
  if (!session?.user?.email) {
    return { pullsData: [] };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { pullsData: [] };
  }

  // PERFORMANCE: Limit initial load to 500 cards to prevent slow page loads
  const pulls = await prisma.pull.findMany({
    where: { userId: user.id },
    include: {
      card: {
        select: {
          id: true,
          name: true,
          imageUrlGatherer: true,
          coinValue: true,
          rarity: true,
          sourceGame: true,
        },
      },
      box: {
        select: { name: true },
      },
      cartItem: {
        select: { id: true },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 500,
  });

  const pullsData = pulls.map(pull => ({
    id: pull.id,
    card: pull.card
      ? {
          id: pull.card.id,
          name: pull.card.name,
          imageUrlGatherer: pull.card.imageUrlGatherer,
          coinValue: Number(pull.card.coinValue),
          rarity: pull.card.rarity,
          sourceGame: pull.card.sourceGame,
        }
      : null,
    box: { name: pull.box.name },
    cartItem: pull.cartItem ? { id: pull.cartItem.id } : null,
  }));

  return { pullsData };
}

export default async function CollectionPage() {
  const session = await getCurrentSession();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const { pullsData: pullsWithCart } = await getCollection();

  // Calculate stats
  const totalCards = pullsWithCart.length;
  const totalValue = pullsWithCart.reduce((sum, p) => sum + (p.card?.coinValue || 0), 0);
  const rarities = pullsWithCart.reduce((acc, p) => {
    const rarity = p.card?.rarity || 'Common';
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-sm">
            <Layers className="w-4 h-4 text-[#C84FFF]" />
            <span className="text-gray-300">Your Cards</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="text-white">My </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84FFF] to-[#9333EA]">Collection</span>
            </h1>
            <InfoTooltip infoKey="collection.overview" />
          </div>
          <p className="text-[#8888aa] text-lg">Manage your card collection</p>
        </div>

        {/* Stats Bar */}
        {totalCards > 0 && (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 mb-8">
            <div className={`grid grid-cols-2 gap-4 ${(rarities['None'] || 0) > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#C84FFF]">{totalCards}</div>
                <div className="text-sm text-[#8888aa]">Total Cards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{totalValue.toLocaleString()}</div>
                <div className="text-sm text-[#8888aa]">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{rarities['Rare'] || 0}</div>
                <div className="text-sm text-[#8888aa]">Rare Cards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{(rarities['Mythic'] || 0) + (rarities['Legendary'] || 0)}</div>
                <div className="text-sm text-[#8888aa]">Mythic/Legendary</div>
              </div>
              {(rarities['None'] || 0) > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#C84FFF]">{rarities['None']}</div>
                  <div className="text-sm text-[#8888aa]">Sealed Products</div>
                </div>
              )}
            </div>
          </div>
        )}

        {pullsWithCart.length === 0 ? (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-[#C84FFF]/20 to-[#9333EA]/20">
              <Package className="w-10 h-10 text-[#C84FFF]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Collection Empty</h2>
            <p className="text-[#8888aa] mb-6">Open some boxes to start building your collection!</p>
            <Link 
              href="/boxes" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_24px_rgba(200,79,255,0.3)]"
            >
              <Sparkles className="w-5 h-5" />
              Browse Boxes
            </Link>
          </div>
        ) : (
          <CollectionClient pulls={pullsWithCart} />
        )}
      </div>
    </div>
  );
}
