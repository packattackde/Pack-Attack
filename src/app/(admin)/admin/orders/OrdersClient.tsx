'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  User,
  Coins,
  Euro,
  Store,
  Link2,
  Save,
  ShoppingCart,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

type OrderItem = {
  id: string;
  cardName: string;
  cardImage: string | null;
  coinValue: number;
};

type Shop = {
  id: string;
  name: string;
  owner: {
    id: string;
    email: string;
    name: string | null;
  };
};

type Order = {
  id: string;
  status: string;
  totalCoins: number;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  shippingMethod: 'COINS' | 'EUROS';
  shippingCost: number;
  notes: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shopNotes: string | null;
  assignedShopId: string | null;
  assignedAt: string | null;
  assignedShop: Shop | null;
  fulfillmentChannel: 'SHOP' | 'CARDMARKET' | null;
  cardmarketQueuedAt: string | null;
  cardmarketPreparedAt: string | null;
  cardmarketLastError: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  items: OrderItem[];
};

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: 'text-yellow-400 bg-yellow-400/10', icon: Clock, label: 'Pending' },
  PROCESSING: { color: 'text-[#ff2ea6] bg-[rgba(255,46,166,0.1)]', icon: Package, label: 'Processing' },
  SHIPPED: { color: 'text-purple-400 bg-purple-400/10', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'text-[#E879F9] bg-[#ff2ea6]/10', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'text-red-400 bg-red-400/10', icon: XCircle, label: 'Cancelled' },
};

export function OrdersClient({ orders: initialOrders, shops }: { orders: Order[]; shops: Shop[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [cardmarketSending, setCardmarketSending] = useState<string | null>(null);
  const [cardmarketReady, setCardmarketReady] = useState<boolean | null>(null);
  const [localBridgeOnline, setLocalBridgeOnline] = useState<boolean | null>(null);

  const CARDMARKET_CART_URL = 'https://www.cardmarket.com/en/Magic/ShoppingCart';
  const LOCAL_BRIDGE = 'http://127.0.0.1:3847';

  useEffect(() => {
    fetch('/api/admin/cardmarket/status')
      .then((r) => r.json())
      .then((d) => setCardmarketReady(Boolean(d.ready)))
      .catch(() => setCardmarketReady(false));
    fetch(`${LOCAL_BRIDGE}/health`)
      .then((r) => setLocalBridgeOnline(r.ok))
      .catch(() => setLocalBridgeOnline(false));
  }, []);

  const cardmarketQueueCount = orders.filter(
    (o) => o.fulfillmentChannel === 'CARDMARKET' && o.status === 'PROCESSING'
  ).length;
  const cardmarketPendingCount = orders.filter(
    (o) => o.status === 'PENDING' && !o.assignedShopId
  ).length;
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { number: string; url: string }>>({});

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to update order',
          variant: 'destructive',
        });
        return;
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, ...data.order } : o));
      addToast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
      });
      router.refresh();
    } catch (error) {
      console.error('Error updating order:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleSendToCardmarket = (orderId: string) => {
    const fillUrl = `${LOCAL_BRIDGE}/fill/${encodeURIComponent(orderId)}`;
    const tab = window.open(fillUrl, '_blank', 'noopener,noreferrer');
    if (!tab) {
      addToast({
        title: 'Pop-up blocked',
        description: `Allow pop-ups, or open: ${fillUrl}`,
        variant: 'destructive',
      });
      return;
    }
    addToast({
      title: 'Filling cart on this PC',
      description:
        'Watch the new localhost tab and Chrome window. First time? Run npm run cardmarket:login in Pack-Attack.',
    });
    setCardmarketSending(orderId);
    window.setTimeout(() => setCardmarketSending(null), 90_000);
  };

  const handleShopAssignment = async (orderId: string, shopId: string | null) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedShopId: shopId }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to assign order',
          variant: 'destructive',
        });
        return;
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, ...data.order } : o));
      addToast({
        title: 'Success',
        description: shopId ? 'Order assigned to shop' : 'Order unassigned from shop',
      });
      router.refresh();
    } catch (error) {
      console.error('Error assigning order:', error);
      addToast({
        title: 'Error',
        description: 'Failed to assign order',
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleTrackingUpdate = async (orderId: string) => {
    const tracking = trackingInputs[orderId];
    if (!tracking) return;

    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trackingNumber: tracking.number || null,
          trackingUrl: tracking.url || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to update tracking',
          variant: 'destructive',
        });
        return;
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, ...data.order } : o));
      addToast({
        title: 'Success',
        description: 'Tracking information updated',
      });
      router.refresh();
    } catch (error) {
      console.error('Error updating tracking:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update tracking',
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const filteredOrders =
    filterStatus === 'ALL'
      ? orders
      : filterStatus === 'CARDMARKET'
        ? orders.filter(
            (o) => o.fulfillmentChannel === 'CARDMARKET' && o.status === 'PROCESSING'
          )
        : orders.filter((o) => o.status === filterStatus);

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  return (
    <div className="space-y-6">
      {/* Cardmarket — visible workflow (not buried in expand) */}
      <div className="rounded-2xl border-2 border-sky-500/40 bg-gradient-to-br from-sky-950/80 to-[#100d22] p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-sky-400" />
              Cardmarket warehouse
            </h2>
            <p className="mt-2 text-sm text-[#c4c4e0]">
              Cardmarket blocks the <strong className="text-white">server</strong> (bot check). Cart fill runs on{' '}
              <strong className="text-sky-300">your PC</strong>: real Chrome, customer address, DE seller ≥100 sales.
            </p>
            <ol className="mt-2 text-xs text-[#c4c4e0] list-decimal list-inside space-y-1">
              <li>
                Once: <code className="text-sky-200">npm run cardmarket:login</code> (sign in, pass bot check)
              </li>
              <li>
                Keep running: <code className="text-sky-200">npm run cardmarket:local-bridge</code>
              </li>
              <li>Click <strong className="text-sky-300">Add to cart on this PC</strong> on a pending order</li>
            </ol>
            {localBridgeOnline === true && (
              <p className="mt-2 text-xs text-emerald-400/90">Local bridge connected — ready to fill carts.</p>
            )}
            {localBridgeOnline === false && (
              <p className="mt-2 text-xs text-amber-300/90">
                Local bridge offline — start npm run cardmarket:local-bridge in C:\PA\Pack-Attack
              </p>
            )}
            {cardmarketReady === false && (
              <p className="mt-2 text-xs text-[#8888aa]">
                Server: set FULFILLMENT_SCRIPT_KEY in .env (same value in your PC .env.local as the bridge).
              </p>
            )}
            <p className="mt-3 text-xs text-[#8888aa]">
              {cardmarketPendingCount} pending (unassigned) · {cardmarketQueueCount} in Cardmarket queue
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href={CARDMARKET_CART_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              Open MKM cart
            </a>
            <button
              type="button"
              onClick={() => setFilterStatus('CARDMARKET')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e1e55] border border-sky-500/30 text-sky-200 text-sm font-medium hover:bg-white/5"
            >
              Show queue ({cardmarketQueueCount})
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
          <p className="text-sm text-[#8888aa]">Total Orders</p>
          <p className="text-2xl font-bold text-white">{orderStats.total}</p>
        </div>
        <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
          <p className="text-sm text-yellow-400">Pending</p>
          <p className="text-2xl font-bold text-white">{orderStats.pending}</p>
        </div>
        <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
          <p className="text-sm text-[#ff2ea6]">Processing</p>
          <p className="text-2xl font-bold text-white">{orderStats.processing}</p>
        </div>
        <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
          <p className="text-sm text-purple-400">Shipped</p>
          <p className="text-2xl font-bold text-white">{orderStats.shipped}</p>
        </div>
        <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
          <p className="text-sm text-[#E879F9]">Delivered</p>
          <p className="text-2xl font-bold text-white">{orderStats.delivered}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'PROCESSING', 'CARDMARKET', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-[#ff2ea6] text-white'
                : 'bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white'
            }`}
          >
            {status === 'ALL'
              ? 'All Orders'
              : status === 'CARDMARKET'
                ? 'Cardmarket'
                : statusConfig[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-[#8888aa]">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl overflow-hidden">
                {/* Order Header */}
                <div className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer hover:opacity-90"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className={`p-2 rounded-lg ${status.color}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Order #{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-sm text-[#8888aa]">
                          {new Date(order.createdAt).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-[#8888aa]">{order.items.length} items</p>
                        <p className="font-semibold text-white">{order.shippingName}</p>
                      </div>
                      {order.assignedShop && (
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {order.assignedShop.name}
                        </div>
                      )}
                      {order.fulfillmentChannel === 'CARDMARKET' && (
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-sky-500/20 text-sky-300 flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          Cardmarket
                        </div>
                      )}
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.label}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#8888aa]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#8888aa]" />
                      )}
                    </div>

                    {/* Cardmarket actions — always visible on row */}
                    <div
                      className="flex flex-wrap items-center gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3 lg:border-t-0 lg:pt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.fulfillmentChannel === 'CARDMARKET' &&
                      order.status === 'PROCESSING' &&
                      order.cardmarketPreparedAt ? (
                        <a
                          href={CARDMARKET_CART_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Checkout on MKM
                        </a>
                      ) : !order.assignedShopId &&
                        (order.status === 'PENDING' ||
                          (order.status === 'PROCESSING' &&
                            order.fulfillmentChannel === 'CARDMARKET' &&
                            !order.cardmarketPreparedAt)) ? (
                        <button
                          type="button"
                          disabled={cardmarketSending === order.id || order.items.length === 0}
                          title="Runs on your PC via local bridge (passes Cardmarket bot check)"
                          onClick={() => handleSendToCardmarket(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {cardmarketSending === order.id
                            ? 'Filling cart on this PC…'
                            : 'Add to cart on this PC'}
                        </button>
                      ) : order.assignedShopId ? (
                        <span className="text-xs text-[#8888aa] px-2">Shop assigned — unassign for MKM</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] p-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-[#ff2ea6]" />
                          Customer
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-[#8888aa]">
                            <span className="text-gray-500">Account:</span> {order.user.email}
                          </p>
                          {order.user.name && (
                            <p className="text-[#8888aa]">
                              <span className="text-gray-500">Name:</span> {order.user.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Shipping Info */}
                      <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#ff2ea6]" />
                          Shipping Address
                        </h4>
                        <div className="space-y-1 text-sm text-[#8888aa]">
                          <p>{order.shippingName}</p>
                          <p>{order.shippingAddress}</p>
                          <p>{order.shippingZip} {order.shippingCity}</p>
                          <p>{order.shippingCountry}</p>
                          <p className="flex items-center gap-1 mt-2">
                            <Mail className="w-3 h-3" />
                            {order.shippingEmail}
                          </p>
                          {/* Shipping Payment */}
                          <div className={`flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] ${
                            order.shippingMethod === 'COINS' ? 'text-amber-400' : 'text-[#E879F9]'
                          }`}>
                            {order.shippingMethod === 'COINS' ? (
                              <>
                                <Coins className="w-4 h-4" />
                                <span className="font-medium">Paid: {order.shippingCost?.toFixed(2) || '5.00'} coins</span>
                              </>
                            ) : (
                              <>
                                <Euro className="w-4 h-4" />
                                <span className="font-medium">Paid: {order.shippingCost?.toFixed(2) || '5.00'} €</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {order.fulfillmentChannel === 'CARDMARKET' && (
                      <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3 text-sm text-[#8888aa]">
                        Cardmarket queue
                        {order.cardmarketQueuedAt && (
                          <span> · since {new Date(order.cardmarketQueuedAt).toLocaleString('de-DE')}</span>
                        )}
                        {order.cardmarketLastError && (
                          <p className="text-red-400 mt-1">{order.cardmarketLastError}</p>
                        )}
                      </div>
                    )}

                    {/* Shop Assignment */}
                    <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Store className="w-4 h-4 text-purple-400" />
                        Shop Assignment
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <select
                          value={order.assignedShopId || ''}
                          onChange={(e) => handleShopAssignment(order.id, e.target.value || null)}
                          disabled={updatingOrder === order.id}
                          className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-auto"
                        >
                          <option value="">-- Not Assigned --</option>
                          {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                              {shop.name} ({shop.owner.email})
                            </option>
                          ))}
                        </select>
                        {order.assignedShop && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-[#8888aa]">Assigned to:</span>
                            <span className="text-purple-400 font-medium">{order.assignedShop.name}</span>
                            {order.assignedAt && (
                              <span className="text-gray-500 text-xs">
                                on {new Date(order.assignedAt).toLocaleDateString('de-DE')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tracking Information */}
                    <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-[#E879F9]" />
                        Tracking Information
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#8888aa] mb-1 block">Tracking Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 1Z999AA10123456784"
                            value={trackingInputs[order.id]?.number ?? order.trackingNumber ?? ''}
                            onChange={(e) => setTrackingInputs(prev => ({
                              ...prev,
                              [order.id]: { 
                                number: e.target.value, 
                                url: prev[order.id]?.url ?? order.trackingUrl ?? '' 
                              }
                            }))}
                            className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-[#ff2ea6] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#8888aa] mb-1 block">Tracking URL</label>
                          <input
                            type="url"
                            placeholder="e.g. https://tracking.dhl.de/..."
                            value={trackingInputs[order.id]?.url ?? order.trackingUrl ?? ''}
                            onChange={(e) => setTrackingInputs(prev => ({
                              ...prev,
                              [order.id]: { 
                                number: prev[order.id]?.number ?? order.trackingNumber ?? '', 
                                url: e.target.value 
                              }
                            }))}
                            className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-[#ff2ea6] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleTrackingUpdate(order.id)}
                        disabled={updatingOrder === order.id}
                        className="mt-3 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save Tracking Info
                      </button>
                      {order.trackingUrl && (
                        <a 
                          href={order.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 text-sm text-[#E879F9] hover:text-[#f0abfc] inline-flex items-center gap-1"
                        >
                          <Link2 className="w-3 h-3" />
                          View Tracking
                        </a>
                      )}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-2">Customer Notes</h4>
                        <p className="text-sm text-[#8888aa]">{order.notes}</p>
                      </div>
                    )}

                    {/* Shop Notes */}
                    {order.shopNotes && (
                      <div className="bg-[#100d22] shadow-md rounded-xl p-4 border border-purple-500/30">
                        <h4 className="font-semibold text-purple-400 mb-2">Shop Notes</h4>
                        <p className="text-sm text-[#8888aa]">{order.shopNotes}</p>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3">Order Items ({order.items.length})</h4>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="relative group">
                            <div className="relative aspect-[63/88] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)]">
                              {item.cardImage ? (
                                <Image
                                  src={item.cardImage}
                                  alt={item.cardName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#12123a] flex items-center justify-center">
                                  <span className="text-[8px] text-gray-600">?</span>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-[#8888aa] truncate mt-1" title={item.cardName}>
                              {item.cardName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <p className="text-sm text-[#8888aa]">Update Status:</p>
                      <div className="flex gap-2 flex-wrap">
                        {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => {
                          const cfg = statusConfig[s];
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusUpdate(order.id, s)}
                              disabled={order.status === s || updatingOrder === order.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                                order.status === s
                                  ? cfg.color + ' ring-2 ring-offset-2 ring-offset-gray-900'
                                  : 'bg-[#100d22] border border-[rgba(255,255,255,0.12)] shadow-md hover:bg-white/10 text-[#8888aa]'
                              }`}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}











