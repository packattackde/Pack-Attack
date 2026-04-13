'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { 
  Package, 
  ArrowLeft,
  Plus,
  X,
  Image as ImageIcon
} from 'lucide-react';

const categoryKeys = [
  'SINGLE_CARD', 'BOOSTER_BOX', 'BOOSTER_PACK', 'STARTER_DECK', 'STRUCTURE_DECK',
  'ACCESSORIES', 'SLEEVES', 'PLAYMAT', 'BINDER', 'DECK_BOX', 'OTHER',
] as const;

const gameKeys = [
  '', 'MAGIC_THE_GATHERING', 'ONE_PIECE', 'POKEMON', 'LORCANA', 'YUGIOH', 'FLESH_AND_BLOOD',
] as const;

const gameDisplayNames: Record<string, string> = {
  '': 'No specific game',
  MAGIC_THE_GATHERING: 'Magic: The Gathering',
  ONE_PIECE: 'One Piece',
  POKEMON: 'Pokémon',
  LORCANA: 'Lorcana',
  YUGIOH: 'Yu-Gi-Oh!',
  FLESH_AND_BLOOD: 'Flesh and Blood',
};

const conditionKeys = [
  'MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'LIGHT_PLAYED', 'PLAYED', 'POOR',
] as const;

export default function NewProductPage() {
  const t = useTranslations('shop.productForm');
  const tCat = useTranslations('shop.categories');
  const tCond = useTranslations('shop.conditions');
  const router = useRouter();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    images: [] as string[],
    category: 'SINGLE_CARD',
    game: '',
    condition: 'NEAR_MINT',
    stock: '1',
    sku: '',
    featured: false,
  });

  const addImage = () => {
    if (imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      addToast({
        title: t('missingInfo'),
        description: t('fillRequired'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/shop/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          images: formData.images,
          category: formData.category,
          game: formData.game || null,
          condition: formData.condition,
          stock: parseInt(formData.stock) || 0,
          sku: formData.sku || null,
          featured: formData.featured,
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
        title: t('created'),
        description: t('createdDesc'),
      });

      router.push('/shop/manage/products');
    } catch (error) {
      addToast({
        title: 'Error',
        description: t('failedToCreate'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Breadcrumb */}
        <Link href="/shop/manage/products" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t('backToProducts')}
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-8 h-8 text-[#C84FFF]" />
            <h1 className="text-3xl font-bold text-white">{t('addTitle')}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">{t('basicInfo')}</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('productName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                  placeholder={t('productNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none resize-none"
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('category')} *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                  >
                    {categoryKeys.map((key) => (
                      <option key={key} value={key} className="bg-[#0B0B2B]">
                        {tCat(key)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('game')}</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                  >
                    {gameKeys.map((key) => (
                      <option key={key} value={key} className="bg-[#0B0B2B]">
                        {gameDisplayNames[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('condition')}</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                >
                  {conditionKeys.map((key) => (
                    <option key={key} value={key} className="bg-[#0B0B2B]">
                      {tCond(key)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">{t('pricingInventory')}</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('price')} *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('comparePrice')}</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                    placeholder={t('comparePricePlaceholder')}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('stock')} *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">{t('sku')}</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                    placeholder={t('skuPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5 rounded bg-[#12123a] border-[rgba(255,255,255,0.06)] text-[#C84FFF] focus:ring-[rgba(200,79,255,0.3)]"
                />
                <label htmlFor="featured" className="text-[#f0f0f5]">{t('featureProduct')}</label>
              </div>
            </div>

            {/* Images */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">{t('images')}</h2>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none"
                  placeholder={t('imageUrlPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-4 py-3 rounded-xl bg-[#C84FFF] text-white font-semibold hover:brightness-110 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {formData.images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-[#12123a]">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs">
                          {t('main')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-[rgba(255,255,255,0.06)] rounded-xl">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-[#8888aa]">{t('noImages')}</p>
                  <p className="text-gray-500 text-sm">{t('addImagesHint')}</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Link
                href="/shop/manage/products"
                className="flex-1 py-4 bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#f0f0f5] font-semibold rounded-xl hover:bg-white/10 transition-colors text-center"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-4 bg-[#C84FFF] text-white font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {t('createProduct')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
