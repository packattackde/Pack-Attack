'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  isActive: boolean;
  featured: boolean;
};

export default function ManageProductsPage() {
  const t = useTranslations('shop.manageProducts');
  const tCat = useTranslations('shop.categories');
  const router = useRouter();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/shop/owner');
        const data = await res.json();
        
        if (res.status === 403) {
          router.push('/shop');
          return;
        }

        if (data.success && data.shop) {
          setProducts(data.shop.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  const handleDelete = async (productId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    setDeleting(productId);
    try {
      const res = await fetch(`/api/shop/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        addToast({
          title: 'Error',
          description: data.error || t('failedToDelete'),
          variant: 'destructive',
        });
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      addToast({
        title: t('deleted'),
        description: t('deletedDesc'),
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: t('failedToDelete'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/shop/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) {
        throw new Error('Failed to update');
      }

      setProducts((prev) => prev.map((p) => 
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      ));

      addToast({
        title: product.isActive ? t('deactivated') : t('activated'),
        description: product.isActive ? t('nowHidden') : t('nowVisible'),
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: t('failedToUpdate'),
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const res = await fetch(`/api/shop/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      });

      if (!res.ok) {
        throw new Error('Failed to update');
      }

      setProducts((prev) => prev.map((p) => 
        p.id === product.id ? { ...p, featured: !p.featured } : p
      ));

      addToast({
        title: product.featured ? t('unfeatured') : t('featured'),
        description: product.featured ? t('removedFromFeatured') : t('addedToFeatured'),
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: t('failedToUpdate'),
        variant: 'destructive',
      });
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Breadcrumb */}
        <Link href="/shop/manage" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t('backToDashboard')}
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-[#C84FFF]" />
            <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
            <span className="px-3 py-1 rounded-full bg-[#12123a] text-[#f0f0f5] text-sm">
              {t('totalCount', { count: products.length })}
            </span>
          </div>
          <Link
            href="/shop/manage/products/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl hover:brightness-110 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('addProduct')}
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8888aa]" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none transition-colors"
          />
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? t('noProducts') : t('noProductsYet')}
            </h2>
            <p className="text-[#8888aa] mb-6">
              {searchQuery ? t('tryDifferent') : t('addFirst')}
            </p>
            {!searchQuery && (
              <Link
                href="/shop/manage/products/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl"
              >
                <Plus className="w-5 h-5" />
                {t('addProduct')}
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8888aa]">{t('tableHeaders.product')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8888aa]">{t('tableHeaders.category')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8888aa]">{t('tableHeaders.price')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8888aa]">{t('tableHeaders.stock')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8888aa]">{t('tableHeaders.status')}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#8888aa]">{t('tableHeaders.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#12123a] flex-shrink-0">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{product.name}</p>
                            {product.featured && (
                              <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                                <Star className="w-3 h-3" /> {t('featured')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#f0f0f5]">
                          {tCat(product.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#C84FFF] font-semibold">
                          €{product.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={product.stock > 0 ? 'text-[#E879F9]' : 'text-red-400'}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          product.isActive 
                            ? 'bg-[#C84FFF]/20 text-[#E879F9]' 
                            : 'bg-gray-500/20 text-[#8888aa]'
                        }`}>
                          {product.isActive ? t('active') : t('hidden')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleFeatured(product)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.featured 
                                ? 'text-amber-400 hover:bg-amber-500/20' 
                                : 'text-[#8888aa] hover:bg-[#12123a]'
                            }`}
                            title={product.featured ? t('removeFromFeatured') : t('addToFeatured')}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(product)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.isActive 
                                ? 'text-[#E879F9] hover:bg-[#C84FFF]/20' 
                                : 'text-[#8888aa] hover:bg-[#12123a]'
                            }`}
                            title={product.isActive ? t('hideProduct') : t('showProduct')}
                          >
                            {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <Link
                            href={`/shop/manage/products/${product.id}/edit`}
                            className="p-2 rounded-lg text-[#C84FFF] hover:bg-[rgba(200,79,255,0.15)] transition-colors"
                            title={t('editProduct')}
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title={t('deleteProduct')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
