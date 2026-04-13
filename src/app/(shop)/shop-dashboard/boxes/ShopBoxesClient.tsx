'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Edit, Eye, EyeOff, Trash2, ShoppingCart, Users, Coins, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

type Box = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  cardsPerPack: number;
  isActive: boolean;
  createdAt: string;
  createdByShop?: { id: string; name: string } | null;
  cards: { id: string; name: string; coinValue: number }[];
  _count: { pulls: number; shopBoxOrders: number };
};

export function ShopBoxesClient({ boxes: initialBoxes, isAdmin }: { boxes: Box[]; isAdmin: boolean }) {
  const t = useTranslations('shopDashboard.boxes');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const [boxes, setBoxes] = useState(initialBoxes);
  const [updatingBox, setUpdatingBox] = useState<string | null>(null);
  const [deletingBox, setDeletingBox] = useState<string | null>(null);

  const toggleBoxStatus = async (boxId: string, currentStatus: boolean) => {
    setUpdatingBox(boxId);
    try {
      const res = await fetch(`/api/shop-dashboard/boxes/${boxId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update box');
      }

      setBoxes(boxes.map(box => 
        box.id === boxId ? { ...box, isActive: !currentStatus } : box
      ));

      addToast({
        title: tc('success'),
        description: !currentStatus ? t('boxActivated') : t('boxDeactivated'),
      });
    } catch (error) {
      addToast({
        title: tc('error'),
        description: t('failedUpdate'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingBox(null);
    }
  };

  const deleteBox = async (boxId: string) => {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    setDeletingBox(boxId);
    try {
      const res = await fetch(`/api/shop-dashboard/boxes/${boxId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete box');
      }

      setBoxes(boxes.filter(box => box.id !== boxId));

      addToast({
        title: tc('success'),
        description: t('boxDeleted'),
      });
    } catch (error) {
      addToast({
        title: tc('error'),
        description: t('failedDelete'),
        variant: 'destructive',
      });
    } finally {
      setDeletingBox(null);
    }
  };

  if (boxes.length === 0) {
    return (
      <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
        <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">{t('noBoxes')}</h3>
        <p className="text-[#8888aa] mb-6 max-w-md mx-auto">
          {t('noBoxesDesc')}
        </p>
        <Link
          href="/shop-dashboard/boxes/create"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C84FFF] to-cyan-500 hover:from-[#9333EA] hover:to-[#7c3aed] text-white font-medium transition-all"
        >
          <Package className="w-5 h-5" />
          <span>{t('createFirst')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {boxes.map((box) => (
        <div 
          key={box.id} 
          className={`bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl overflow-hidden transition-all hover:ring-2 ${
            box.isActive ? 'hover:ring-cyan-500/50' : 'hover:ring-gray-500/50 opacity-75'
          }`}
        >
          {/* Box Image */}
          <div className="relative aspect-[4/3] bg-[#12123a]">
            {box.imageUrl ? (
              <Image
                src={box.imageUrl}
                alt={box.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-700" />
              </div>
            )}
            
            {/* Status Badge */}
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
              box.isActive 
                ? 'bg-[#C84FFF]/20 text-[#E879F9] border border-[#C84FFF]/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {box.isActive ? t('active') : t('inactive')}
            </div>

            {/* Shop Badge (Admin view) */}
            {isAdmin && box.createdByShop && (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {box.createdByShop.name}
              </div>
            )}
          </div>

          {/* Box Info */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-1 truncate">{box.name}</h3>
            <p className="text-sm text-[#8888aa] line-clamp-2 mb-4">{box.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-[#12123a]">
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                  <Coins className="w-3 h-3" />
                  <span className="text-sm font-bold">{box.price}</span>
                </div>
                <span className="text-[10px] text-gray-500">{t('price')}</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#12123a]">
                <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
                  <Users className="w-3 h-3" />
                  <span className="text-sm font-bold">{box._count.pulls}</span>
                </div>
                <span className="text-[10px] text-gray-500">{t('opens')}</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#12123a]">
                <div className="flex items-center justify-center gap-1 text-[#E879F9] mb-1">
                  <ShoppingCart className="w-3 h-3" />
                  <span className="text-sm font-bold">{box._count.shopBoxOrders}</span>
                </div>
                <span className="text-[10px] text-gray-500">{t('orders')}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              {t('cardsPerPack', { cards: box.cards.length, perPack: box.cardsPerPack })}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBoxStatus(box.id, box.isActive)}
                disabled={updatingBox === box.id}
                className={`flex-1 ${
                  box.isActive 
                    ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' 
                    : 'border-[#C84FFF]/50 text-[#E879F9] hover:bg-[#C84FFF]/10'
                }`}
              >
                {box.isActive ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    {t('deactivate')}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    {t('activate')}
                  </>
                )}
              </Button>
              
              <Link href={`/shop-dashboard/boxes/${box.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteBox(box.id)}
                disabled={deletingBox === box.id}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
