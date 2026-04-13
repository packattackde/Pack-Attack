'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { 
  ShoppingBag, 
  ArrowLeft,
  Package,
  User,
  Mail,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ChevronDown
} from 'lucide-react';

type OrderItem = {
  id: string;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  shippingPhone: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: OrderItem[];
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  PAID: 'bg-[rgba(200,79,255,0.1)] text-[#C84FFF]',
  PROCESSING: 'bg-purple-500/20 text-purple-400',
  SHIPPED: 'bg-cyan-500/20 text-cyan-400',
  DELIVERED: 'bg-[#C84FFF]/20 text-[#E879F9]',
  CANCELLED: 'bg-red-500/20 text-red-400',
  REFUNDED: 'bg-gray-500/20 text-[#8888aa]',
};

const statusKeys = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const;

export default function ManageOrdersPage() {
  const t = useTranslations('shop.manageOrders');
  const router = useRouter();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/shop/owner/orders');
        const data = await res.json();
        
        if (res.status === 403) {
          router.push('/shop');
          return;
        }

        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/shop/owner/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || t('failedToUpdate'),
          variant: 'destructive',
        });
        return;
      }

      setOrders((prev) => prev.map((order) => 
        order.id === orderId ? { ...order, status } : order
      ));

      addToast({
        title: t('updated'),
        description: t('updatedDesc'),
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: t('failedToUpdate'),
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
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
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-8 h-8 text-[#C84FFF]" />
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <span className="px-3 py-1 rounded-full bg-[#12123a] text-[#f0f0f5] text-sm">
            {t('totalCount', { count: orders.length })}
          </span>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">{t('noOrders')}</h2>
            <p className="text-[#8888aa]">{t('noOrdersDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl overflow-hidden">
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="font-semibold text-white">#{order.orderNumber.slice(0, 8)}</p>
                      <p className="text-sm text-[#8888aa] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[order.status] || 'bg-gray-500/20 text-[#8888aa]'}`}>
                      {t(`statusLabels.${order.status}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-[#C84FFF]">€{order.total.toFixed(2)}</p>
                      <p className="text-sm text-[#8888aa]">{order.items.length} {t('items')}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[#8888aa] transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedOrder === order.id && (
                  <div className="px-6 pb-6 border-t border-[rgba(255,255,255,0.06)]/50 pt-4">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Items */}
                      <div className="lg:col-span-2">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#C84FFF]" />
                          {t('items')}
                        </h3>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#12123a]">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#12123a] flex-shrink-0">
                                {item.productImage ? (
                                  <Image
                                    src={item.productImage}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white">{item.productName}</p>
                                <p className="text-sm text-[#8888aa]">{t('qty')}: {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-white">€{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-4 p-4 rounded-xl bg-[#12123a] space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#8888aa]">{t('subtotal')}</span>
                            <span className="text-white">€{order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#8888aa]">{t('shipping')}</span>
                            <span className="text-white">€{order.shippingCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-[rgba(255,255,255,0.06)] pt-2">
                            <span className="text-white">{t('total')}</span>
                            <span className="text-[#C84FFF]">€{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer & Shipping */}
                      <div className="space-y-4">
                        {/* Customer */}
                        <div>
                          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-[#C84FFF]" />
                            {t('customer')}
                          </h3>
                          <div className="p-4 rounded-xl bg-[#12123a] space-y-2">
                            <p className="text-white">{order.user.name || t('anonymous')}</p>
                            <p className="text-sm text-[#8888aa] flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {order.user.email}
                            </p>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-cyan-400" />
                            {t('shipTo')}
                          </h3>
                          <div className="p-4 rounded-xl bg-[#12123a] space-y-1 text-sm">
                            <p className="text-white">{order.shippingName}</p>
                            <p className="text-[#8888aa]">{order.shippingAddress}</p>
                            <p className="text-[#8888aa]">{order.shippingZip} {order.shippingCity}</p>
                            <p className="text-[#8888aa]">{order.shippingCountry}</p>
                            {order.shippingPhone && (
                              <p className="text-[#8888aa]">{order.shippingPhone}</p>
                            )}
                            <p className="text-[#8888aa] pt-2">{order.shippingEmail}</p>
                          </div>
                        </div>

                        {/* Status Update */}
                        <div>
                          <h3 className="font-semibold text-white mb-3">{t('updateStatus')}</h3>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            disabled={updating === order.id}
                            className="w-full px-4 py-3 rounded-xl bg-[#1a1a4a] shadow-md text-white border border-[rgba(255,255,255,0.06)] focus:border-[rgba(200,79,255,0.3)] focus:outline-none disabled:opacity-50"
                          >
                            {statusKeys.map((status) => (
                              <option key={status} value={status} className="bg-[#0B0B2B]">
                                {t(`statusLabels.${status}`)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div>
                            <h3 className="font-semibold text-white mb-3">{t('customerNotes')}</h3>
                            <div className="p-4 rounded-xl bg-[#12123a]">
                              <p className="text-sm text-[#f0f0f5]">{order.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
