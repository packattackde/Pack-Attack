'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { 
  Store, 
  ShoppingCart, 
  ArrowLeft, 
  Package, 
  Star,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Tag,
  Shield
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  images: string[];
  category: string;
  game: string | null;
  condition: string;
  stock: number;
  featured: boolean;
  shop: {
    id: string;
    name: string;
    logo: string | null;
    description: string | null;
  };
};

export default function ProductPage() {
  const t = useTranslations('shop');
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/shop/products/${params.id}`);
        const data = await res.json();
        
        if (data.success && data.product) {
          setProduct(data.product);
        } else {
          addToast({
            title: 'Error',
            description: t('product_detail.notFound'),
            variant: 'destructive',
          });
          router.push('/shop');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router, addToast]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const res = await fetch('/api/shop/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || t('failedToAdd'),
          variant: 'destructive',
        });
        return;
      }

      addToast({
        title: t('addedToCart'),
        description: t('addedToCartDesc'),
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: t('failedToAdd'),
        variant: 'destructive',
      });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-display">
        <div className="text-white flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[rgba(200,79,255,0.3)] border-t-transparent rounded-full animate-spin" />
          {t('manage.loading')}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center font-display">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('product_detail.notFound')}</h1>
          <Link href="/shop" className="text-[#C84FFF] hover:underline">
            {t('product_detail.backToShop')}
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.comparePrice 
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <div className="min-h-screen font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Breadcrumb */}
        <Link href="/shop" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t('product_detail.backToShop')}
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg">
              {product.images[currentImageIndex] ? (
                <Image
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-600" />
                </div>
              )}

              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.featured && (
                  <span className="px-3 py-1 rounded-lg bg-amber-500 text-gray-900 text-sm font-bold flex items-center gap-1">
                    <Star className="w-4 h-4" /> {t('featuredProducts')}
                  </span>
                )}
                {discount && discount > 0 && (
                  <span className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm font-bold">
                    -{discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      currentImageIndex === index ? 'border-[rgba(200,79,255,0.3)]' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Shop Info */}
            <Link 
              href={`/shop?shopId=${product.shop.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md hover:bg-white/5 transition-colors"
            >
              <Store className="w-4 h-4 text-[#C84FFF]" />
              <span className="text-[#f0f0f5]">{product.shop.name}</span>
            </Link>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">{product.name}</h1>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#12123a] text-[#f0f0f5] text-sm flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {t(`categories.${product.category}`)}
              </span>
              {product.game && (
                <span className="px-3 py-1 rounded-lg bg-[rgba(200,79,255,0.15)] text-[#C84FFF] text-sm">
                  {product.game}
                </span>
              )}
              <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {t(`conditions.${product.condition}`)}
              </span>
            </div>

            {/* Price */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-[#C84FFF]">€{product.price.toFixed(2)}</span>
                {product.comparePrice && (
                  <span className="text-xl text-gray-500 line-through">€{product.comparePrice.toFixed(2)}</span>
                )}
              </div>
              {discount && discount > 0 && (
                <p className="text-[#C84FFF] text-sm">You save €{(product.comparePrice! - product.price).toFixed(2)} ({discount}%)</p>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-[#C84FFF]" />
                  <span className="text-[#E879F9]">{t('product_detail.inStock')}</span>
                  {product.stock <= 5 && (
                    <span className="text-orange-400 text-sm">- {t('product_detail.onlyLeft', { count: product.stock })}</span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-400">{t('product_detail.outOfStock')}</span>
                </>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            {product.stock > 0 && (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-[#8888aa]">{t('product_detail.quantity')}:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md hover:bg-white/10 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <span className="w-12 text-center text-white font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="p-2 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full py-4 bg-[#C84FFF] text-white font-semibold rounded-xl hover:brightness-110 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('product_detail.addingToCart')}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {t('product_detail.addToCartPrice', { price: (product.price * quantity).toFixed(2) })}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">{t('product_detail.description')}</h2>
                <p className="text-[#8888aa] whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
