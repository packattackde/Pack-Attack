'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Package, 
  CreditCard,
  CheckCircle,
  Truck,
  Store
} from 'lucide-react';

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    shop: {
      id: string;
      name: string;
    };
  };
};

type Cart = {
  items: CartItem[];
  total: number;
  itemCount: number;
};

export default function ShopCheckoutPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    shippingName: '',
    shippingEmail: '',
    shippingAddress: '',
    shippingCity: '',
    shippingZip: '',
    shippingCountry: '',
    shippingPhone: '',
    notes: '',
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch('/api/shop/cart');
        const data = await res.json();
        
        if (data.success && data.cart && data.cart.items.length > 0) {
          setCart(data.cart);
        } else {
          router.push('/shop/cart');
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        router.push('/shop/cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shippingName || !formData.shippingEmail || !formData.shippingAddress || 
        !formData.shippingCity || !formData.shippingZip || !formData.shippingCountry) {
      addToast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to place order',
          variant: 'destructive',
        });
        return;
      }

      setOrderSuccess(true);
      addToast({
        title: 'Order Placed!',
        description: 'Your order has been successfully placed',
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] flex items-center justify-center font-display">
        <div className="text-white flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[rgba(191,255,0,0.3)] border-t-transparent rounded-full animate-spin" />
          Loading checkout...
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] flex items-center justify-center font-display">
        <div className="fixed inset-0 bg-grid opacity-30" />
        <div className="fixed inset-0 radial-gradient" />
        
        <div className="relative bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#BFFF00] to-[#BFFF00] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Order Placed Successfully!</h1>
          <p className="text-[#8888aa] mb-8">
            Thank you for your order. The seller has been notified and will process your order shortly.
          </p>
          <div className="space-y-3">
            <Link
              href="/shop/orders"
              className="block w-full py-3 bg-[#BFFF00] text-black font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              View My Orders
            </Link>
            <Link
              href="/shop"
              className="block w-full py-3 bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#f0f0f5] font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) return null;

  const shippingCost = Array.from(new Set(cart.items.map(item => item.product.shop.id))).length * 5;
  const grandTotal = cart.total + shippingCost;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Breadcrumb */}
        <Link href="/shop/cart" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#BFFF00]" />
                  Shipping Address
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.shippingName}
                      onChange={(e) => setFormData({ ...formData, shippingName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.shippingEmail}
                      onChange={(e) => setFormData({ ...formData, shippingEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                      placeholder="123 Main Street, Apt 4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.shippingCity}
                      onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                      placeholder="Berlin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.shippingZip}
                      onChange={(e) => setFormData({ ...formData, shippingZip: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                      placeholder="10115"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Country *</label>
                    <input
                      type="text"
                      required
                      value={formData.shippingCountry}
                      onChange={(e) => setFormData({ ...formData, shippingCountry: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                      placeholder="Germany"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={formData.shippingPhone}
                      onChange={(e) => setFormData({ ...formData, shippingPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Order Notes (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white placeholder-gray-500 border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none resize-none"
                      placeholder="Any special instructions..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#BFFF00]" />
                  Payment
                </h2>
                <p className="text-[#8888aa]">
                  Payment will be arranged directly with the seller after order confirmation.
                  You will receive payment instructions via email.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

                {/* Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#12123a] flex-shrink-0">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Store className="w-3 h-3" /> {item.product.shop.name}
                        </p>
                        <p className="text-sm text-[#8888aa]">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm text-white font-semibold">
                        €{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 border-t border-[rgba(255,255,255,0.06)] pt-4 mb-6">
                  <div className="flex justify-between text-[#8888aa]">
                    <span>Subtotal</span>
                    <span className="text-white">€{cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#8888aa]">
                    <span>Shipping</span>
                    <span className="text-white">€{shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-[rgba(255,255,255,0.06)] pt-3">
                    <span className="text-white">Total</span>
                    <span className="text-[#BFFF00]">€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#BFFF00] text-black font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
