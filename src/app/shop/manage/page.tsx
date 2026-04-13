'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { 
  Store, 
  Package, 
  ShoppingBag,
  BarChart3,
  Plus,
  Settings,
  Image as ImageIcon
} from 'lucide-react';

type Shop = {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  isActive: boolean;
  products: any[];
  _count: {
    products: number;
    orders: number;
  };
};

export default function ShopManagePage() {
  const t = useTranslations('shop.manage');
  const router = useRouter();
  const { addToast } = useToast();
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch('/api/shop/owner');
        const data = await res.json();
        
        if (res.status === 403) {
          addToast({
            title: t('accessDenied'),
            description: t('needShopOwner'),
            variant: 'destructive',
          });
          router.push('/shop');
          return;
        }

        if (data.success) {
          setShop(data.shop);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [router, addToast]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopName.trim()) {
      addToast({
        title: 'Error',
        description: t('shopNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/shop/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: shopName,
          description: shopDescription || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || t('failedToCreate'),
          variant: 'destructive',
        });
        return;
      }

      addToast({
        title: t('shopCreated'),
        description: t('shopCreatedDesc'),
      });

      window.location.reload();
    } catch (error) {
      addToast({
        title: 'Error',
        description: t('failedToCreate'),
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-display">
        <div className="text-white flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[rgba(200,79,255,0.3)] border-t-transparent rounded-full animate-spin" />
          {t('loading')}
        </div>
      </div>
    );
  }

  if (shop === null) {
    return (
      <div className="min-h-screen font-display">
        <div className="fixed inset-0 bg-grid opacity-30" />
        <div className="fixed inset-0 radial-gradient" />

        <div className="relative container py-12">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#C84FFF] to-[#C84FFF] flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">{t('createShop')}</h1>
              <p className="text-[#8888aa]">{t('createShopDesc')}</p>
            </div>

            <form onSubmit={handleCreateShop} className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('shopName')} *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                  placeholder={t('shopNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('shopDescription')}</label>
                <textarea
                  value={shopDescription}
                  onChange={(e) => setShopDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none resize-none"
                  placeholder={t('shopDescPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-4 bg-[#C84FFF] text-white font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('creatingShop')}
                  </>
                ) : (
                  <>
                    <Store className="w-5 h-5" />
                    {t('createShopBtn')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-8 h-8 text-[#C84FFF]" />
              <h1 className="text-3xl font-bold text-white">{shop?.name}</h1>
              {shop?.isActive ? (
                <span className="px-2 py-1 rounded-lg bg-[#C84FFF]/20 text-[#E879F9] text-xs font-medium">Active</span>
              ) : (
                <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">Inactive</span>
              )}
            </div>
            <p className="text-[#8888aa]">{t('subtitle')}</p>
          </div>
          <Link
            href="/shop/manage/products/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl hover:brightness-110 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('addProduct')}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[rgba(200,79,255,0.15)]">
                <Package className="w-6 h-6 text-[#C84FFF]" />
              </div>
              <div>
                <p className="text-[#8888aa] text-sm">{t('statsProducts')}</p>
                <p className="text-2xl font-bold text-white">{shop?._count.products || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[rgba(200,79,255,0.1)]">
                <ShoppingBag className="w-6 h-6 text-[#C84FFF]" />
              </div>
              <div>
                <p className="text-[#8888aa] text-sm">{t('statsOrders')}</p>
                <p className="text-2xl font-bold text-white">{shop?._count.orders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[rgba(200,79,255,0.1)]">
                <BarChart3 className="w-6 h-6 text-[#C84FFF]" />
              </div>
              <div>
                <p className="text-[#8888aa] text-sm">{t('statsActive')}</p>
                <p className="text-2xl font-bold text-white">
                  {shop?.products.filter(p => p.isActive).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <ImageIcon className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-[#8888aa] text-sm">{t('statsFeatured')}</p>
                <p className="text-2xl font-bold text-white">
                  {shop?.products.filter(p => p.featured).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/shop/manage/products" className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-[rgba(200,79,255,0.15)] group-hover:bg-[rgba(200,79,255,0.2)] transition-colors">
                <Package className="w-6 h-6 text-[#C84FFF]" />
              </div>
              <h2 className="text-xl font-bold text-white">{t('productsCard')}</h2>
            </div>
            <p className="text-[#8888aa]">{t('productsDesc')}</p>
          </Link>

          <Link href="/shop/manage/orders" className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-[rgba(200,79,255,0.1)] group-hover:bg-[rgba(200,79,255,0.15)] transition-colors">
                <ShoppingBag className="w-6 h-6 text-[#C84FFF]" />
              </div>
              <h2 className="text-xl font-bold text-white">{t('ordersCard')}</h2>
            </div>
            <p className="text-[#8888aa]">{t('ordersDesc')}</p>
          </Link>

          <Link href="/shop/manage/settings" className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-[rgba(200,79,255,0.1)] group-hover:bg-[rgba(200,79,255,0.2)] transition-colors">
                <Settings className="w-6 h-6 text-[#C84FFF]" />
              </div>
              <h2 className="text-xl font-bold text-white">{t('settingsCard')}</h2>
            </div>
            <p className="text-[#8888aa]">{t('settingsDesc')}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
