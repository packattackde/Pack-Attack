'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Coins, Package, Truck, CheckCircle, ArrowLeft, MapPin, Euro, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

type CartItem = {
  id: string;
  pull: {
    id: string;
    card: {
      id: string;
      name: string;
      imageUrlGatherer: string;
      coinValue: number;
    } | null;
  };
};

type UpsellCartItem = {
  id: string;
  quantity: number;
  payWithCoins: boolean;
  upsellItem: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    coinPrice: number;
  };
};

type CheckoutClientProps = {
  items: CartItem[];
  total: number;
  userEmail: string;
  userName: string;
  upsellCartItems: UpsellCartItem[];
};

const SHIPPING_COST_EUROS = 5.00;
const SHIPPING_COST_COINS = 5.00;

export function CheckoutClient({ items, total, userEmail, userName, upsellCartItems }: CheckoutClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState<'COINS' | 'EUROS'>('COINS');
  const [userCoins, setUserCoins] = useState<number | null>(null);

  // Fetch user's coin balance
  useEffect(() => {
    async function fetchCoins() {
      try {
        const res = await fetch('/api/user/coins');
        const data = await res.json();
        if (data.coins !== undefined) {
          setUserCoins(Number(data.coins));
        }
      } catch (error) {
        console.error('Failed to fetch coins:', error);
      }
    }
    fetchCoins();
  }, []);

  const [formData, setFormData] = useState({
    shippingName: userName || '',
    shippingEmail: userEmail || '',
    shippingAddress: '',
    shippingCity: '',
    shippingZip: '',
    shippingCountry: '',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user has enough coins for shipping with coins
    if (shippingMethod === 'COINS' && userCoins !== null && userCoins < SHIPPING_COST_COINS) {
      addToast({
        title: 'Insufficient Coins',
        description: `You need ${SHIPPING_COST_COINS.toFixed(2)} coins for shipping but only have ${userCoins.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shippingMethod,
          shippingCost: shippingMethod === 'COINS' ? SHIPPING_COST_COINS : SHIPPING_COST_EUROS,
        }),
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

      // If paying with Euros, redirect to payment
      if (shippingMethod === 'EUROS' && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      setOrderId(data.order.id);
      setOrderComplete(true);
      addToast({
        title: 'Order Placed!',
        description: shippingMethod === 'COINS' 
          ? `Your order has been submitted. ${SHIPPING_COST_COINS.toFixed(2)} coins deducted for shipping.`
          : 'Your order has been submitted successfully.',
      });
    } catch (error) {
      console.error('Checkout error:', error);
      addToast({
        title: 'Error',
        description: 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-[#C84FFF]/20">
            <CheckCircle className="w-10 h-10 text-[#E879F9]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Order Placed!</h1>
          <p className="text-[#8888aa] mb-2">Thank you for your order.</p>
          <p className="text-sm text-[#8888aa] mb-6">Order ID: {orderId}</p>
          
          <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-[#C84FFF]" />
              <span className="font-semibold text-white">Shipping Information</span>
            </div>
            <div className="text-sm text-[#8888aa] space-y-1">
              <p>{formData.shippingName}</p>
              <p>{formData.shippingAddress}</p>
              <p>{formData.shippingCity}, {formData.shippingZip}</p>
              <p>{formData.shippingCountry}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/collection"
              className="px-6 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl transition-all hover:scale-105"
            >
              Back to Collection
            </Link>
            <Link
              href="/boxes"
              className="px-6 py-3 bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-white font-semibold rounded-xl transition-all hover:bg-white/10"
            >
              Open More Boxes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/cart" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-sm ml-4">
          <Package className="w-4 h-4 text-[#C84FFF]" />
          <span className="text-[#f0f0f5]">Checkout</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="text-white">Complete </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84FFF] to-[#C84FFF]">Order</span>
        </h1>
        <p className="text-[#8888aa] text-lg">Enter your shipping details to receive your cards</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#C84FFF]" />
                Shipping Address
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="shippingName"
                    value={formData.shippingName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.3)] transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Email *</label>
                  <input
                    type="email"
                    name="shippingEmail"
                    value={formData.shippingEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.3)] transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Street Address *</label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.3)] transition-colors"
                    placeholder="123 Main Street, Apt 4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">City *</label>
                  <input
                    type="text"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.3)] transition-colors"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">ZIP / Postal Code *</label>
                  <input
                    type="text"
                    name="shippingZip"
                    value={formData.shippingZip}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.3)] transition-colors"
                    placeholder="10001"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Country *</label>
                  <select
                    name="shippingCountry"
                    value={formData.shippingCountry}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.3)] transition-colors"
                  >
                    <option value="">Select Country</option>
                    <option value="Germany">Germany</option>
                    <option value="Austria">Austria</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="France">France</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#f0f0f5] mb-2">Order Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 focus:border-[rgba(200,79,255,0.3)] focus:ring-1 focus:ring-[rgba(200,79,255,0.3)] transition-colors resize-none"
                    placeholder="Any special instructions for your order..."
                  />
                </div>
              </div>
            </div>

            {/* Shipping Payment Method */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#E879F9]" />
                Shipping Payment
              </h2>
              <p className="text-[#8888aa] text-sm mb-4">Choose how you want to pay for shipping</p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Pay with Coins */}
                <button
                  type="button"
                  onClick={() => setShippingMethod('COINS')}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    shippingMethod === 'COINS'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-[rgba(255,255,255,0.06)] bg-[#12123a]/60 hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  {shippingMethod === 'COINS' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-amber-400" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${shippingMethod === 'COINS' ? 'bg-amber-500/20' : 'bg-[#12123a]'}`}>
                      <Coins className={`w-6 h-6 ${shippingMethod === 'COINS' ? 'text-amber-400' : 'text-[#8888aa]'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Pay with Coins</p>
                      <p className="text-2xl font-bold text-amber-400">{SHIPPING_COST_COINS.toFixed(2)} <span className="text-sm font-normal">coins</span></p>
                    </div>
                  </div>
                  {userCoins !== null && (
                    <p className={`text-sm ${userCoins >= SHIPPING_COST_COINS ? 'text-[#8888aa]' : 'text-red-400'}`}>
                      Your balance: {userCoins.toFixed(2)} coins
                      {userCoins < SHIPPING_COST_COINS && ' (insufficient)'}
                    </p>
                  )}
                </button>

                {/* Pay with Euros */}
                <button
                  type="button"
                  onClick={() => setShippingMethod('EUROS')}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    shippingMethod === 'EUROS'
                      ? 'border-[#C84FFF] bg-[#C84FFF]/10'
                      : 'border-[rgba(255,255,255,0.06)] bg-[#12123a]/60 hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  {shippingMethod === 'EUROS' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-[#E879F9]" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${shippingMethod === 'EUROS' ? 'bg-[#C84FFF]/20' : 'bg-[#12123a]'}`}>
                      <Euro className={`w-6 h-6 ${shippingMethod === 'EUROS' ? 'text-[#E879F9]' : 'text-[#8888aa]'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Pay with Euros</p>
                      <p className="text-2xl font-bold text-[#E879F9]">{SHIPPING_COST_EUROS.toFixed(2)} <span className="text-sm font-normal">€</span></p>
                    </div>
                  </div>
                  <p className="text-sm text-[#8888aa]">Pay via PayPal or Credit Card</p>
                </button>
              </div>
            </div>

            {/* Items Preview */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Order Items ({items.length})</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {items.map((item) => {
                  if (!item.pull.card) return null;
                  return (
                    <div key={item.id} className="relative aspect-[63/88] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)]">
                      <Image
                        src={item.pull.card.imageUrlGatherer}
                        alt={item.pull.card.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 sticky top-4">
              <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                {items.length > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8888aa]">Items</span>
                      <span className="text-white">{items.length} cards</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8888aa]">Card Value</span>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-amber-400" />
                        <span className="text-white">{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
                {upsellCartItems.length > 0 && (
                  <>
                    {upsellCartItems.map(ui => (
                      <div key={ui.id} className="flex items-center justify-between text-sm">
                        <span className="text-[#8888aa]">{ui.upsellItem.name} x{ui.quantity}</span>
                        <span className={ui.payWithCoins ? 'text-yellow-400' : 'text-amber-400'}>
                          {ui.payWithCoins
                            ? `${(ui.upsellItem.coinPrice * ui.quantity).toFixed(2)} coins`
                            : `${(ui.upsellItem.price * ui.quantity).toFixed(2)} €`}
                        </span>
                      </div>
                    ))}
                    {upsellCartItems.filter(ui => !ui.payWithCoins).length > 0 && (
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-[#f0f0f5]">Add-ons (EUR)</span>
                        <span className="text-amber-400">
                          {upsellCartItems.filter(ui => !ui.payWithCoins).reduce((s, ui) => s + ui.upsellItem.price * ui.quantity, 0).toFixed(2)} €
                        </span>
                      </div>
                    )}
                    {upsellCartItems.filter(ui => ui.payWithCoins).length > 0 && (
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-[#f0f0f5]">Add-ons (Coins)</span>
                        <span className="text-yellow-400">
                          {upsellCartItems.filter(ui => ui.payWithCoins).reduce((s, ui) => s + ui.upsellItem.coinPrice * ui.quantity, 0).toFixed(2)} coins
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8888aa]">Shipping</span>
                  <div className="flex items-center gap-1">
                    {shippingMethod === 'COINS' ? (
                      <>
                        <Coins className="h-4 w-4 text-amber-400" />
                        <span className="text-amber-400 font-medium">{SHIPPING_COST_COINS.toFixed(2)} coins</span>
                      </>
                    ) : (
                      <>
                        <Euro className="h-4 w-4 text-[#E879F9]" />
                        <span className="text-[#E879F9] font-medium">{SHIPPING_COST_EUROS.toFixed(2)} €</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-px bg-[rgba(255,255,255,0.06)]" />
                {items.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Total</span>
                    <span className="text-xl font-bold text-white">{items.length} Cards</span>
                  </div>
                )}
                {shippingMethod === 'COINS' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8888aa]">Coins to deduct</span>
                    <span className="text-amber-400 font-semibold">{SHIPPING_COST_COINS.toFixed(2)}</span>
                  </div>
                )}
                {upsellCartItems.filter(ui => ui.payWithCoins).length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8888aa]">Add-ons coins to deduct</span>
                    <span className="text-yellow-400 font-semibold">
                      {upsellCartItems.filter(ui => ui.payWithCoins).reduce((s, ui) => s + ui.upsellItem.coinPrice * ui.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {upsellCartItems.filter(ui => !ui.payWithCoins).length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#8888aa]">EUR Total</span>
                    <span className="text-xl font-bold text-amber-400">
                      {(upsellCartItems.filter(ui => !ui.payWithCoins).reduce((s, ui) => s + ui.upsellItem.price * ui.quantity, 0) + (shippingMethod === 'EUROS' ? SHIPPING_COST_EUROS : 0)).toFixed(2)} €
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (shippingMethod === 'COINS' && userCoins !== null && userCoins < SHIPPING_COST_COINS)}
                className={`w-full py-4 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 ${
                  shippingMethod === 'COINS'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                    : 'bg-gradient-to-r from-[#9333EA] to-[#7c3aed] hover:from-[#C84FFF] hover:to-[#9333EA]'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : shippingMethod === 'COINS' ? (
                  <>
                    <Coins className="h-5 w-5" />
                    Place Order ({SHIPPING_COST_COINS.toFixed(2)} coins)
                  </>
                ) : (
                  <>
                    <Euro className="h-5 w-5" />
                    Pay {SHIPPING_COST_EUROS.toFixed(2)} € & Place Order
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8888aa]">
                <Truck className="h-4 w-4" />
                <span>Real cards shipped to you</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

