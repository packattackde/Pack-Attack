'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Package, Truck, CheckCircle, Clock, XCircle, 
  ChevronDown, ChevronUp, MapPin, Mail, User, 
  Euro, ExternalLink, MessageSquare, Send,
  AlertCircle, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  cardName: string;
  cardImage: string | null;
  cardValue: number;
  cardRarity: string | null;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  shippingPhone: string | null;
  shippingMethod: 'COINS' | 'EUROS';
  shippingCost: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  shopNotes: string | null;
  sourceOrderId: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  box: { id: string; name: string; imageUrl: string } | null;
  shop: { id: string; name: string };
};

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', icon: Clock, label: 'Pending' },
  CONFIRMED: { color: 'text-[#C84FFF]', bgColor: 'bg-[rgba(200,79,255,0.1)]', icon: Check, label: 'Confirmed' },
  PROCESSING: { color: 'text-purple-400', bgColor: 'bg-purple-400/10', icon: Package, label: 'Processing' },
  SHIPPED: { color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'text-[#E879F9]', bgColor: 'bg-[#C84FFF]/10', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'text-red-400', bgColor: 'bg-red-400/10', icon: XCircle, label: 'Cancelled' },
};

export function ShopOrdersClient({ orders: initialOrders, isAdmin }: { orders: Order[]; isAdmin: boolean }) {
  const t = useTranslations('shopDashboard.orderMgmt');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState({ number: '', url: '' });
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [shopNotes, setShopNotes] = useState('');

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/shop-dashboard/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setOrders(orders.map(o => o.id === orderId ? data.order : o));
      addToast({
        title: tc('success'),
        description: t('orderStatusUpdated', { status: newStatus }),
      });
    } catch (error: any) {
      addToast({
        title: tc('error'),
        description: error.message || t('failedUpdateOrder'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleTrackingUpdate = async (orderId: string) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/shop-dashboard/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trackingNumber: trackingData.number,
          trackingUrl: trackingData.url,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update tracking');
      }

      setOrders(orders.map(o => o.id === orderId ? data.order : o));
      setEditingTracking(null);
      setTrackingData({ number: '', url: '' });
      addToast({
        title: tc('success'),
        description: t('trackingUpdated'),
      });
    } catch (error: any) {
      addToast({
        title: tc('error'),
        description: error.message || t('failedUpdateTracking'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleNotesUpdate = async (orderId: string) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/shop-dashboard/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopNotes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update notes');
      }

      setOrders(orders.map(o => o.id === orderId ? data.order : o));
      setEditingNotes(null);
      setShopNotes('');
      addToast({
        title: tc('success'),
        description: t('notesUpdated'),
      });
    } catch (error: any) {
      addToast({
        title: tc('error'),
        description: error.message || t('failedUpdateNotes'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const filteredOrders = filterStatus === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  if (orders.length === 0) {
    return (
      <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
        <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">{t('noOrders')}</h3>
        <p className="text-[#8888aa] max-w-md mx-auto">
          {t('noOrdersDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-gradient-to-r from-[#9333EA] to-[#7c3aed] text-white shadow-lg'
                : 'bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white hover:bg-[#12123a]'
            }`}
          >
            {status === 'ALL' ? t('allOrders') : statusConfig[status]?.label || status}
            {status !== 'ALL' && (
              <span className="ml-2 text-xs opacity-70">
                ({orders.filter(o => o.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-[#8888aa]">{t('noOrdersStatus')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl overflow-hidden">
                {/* Order Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Card Image */}
                      <div className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-700 bg-[#12123a]">
                        {order.cardImage ? (
                          <Image
                            src={order.cardImage}
                            alt={order.cardName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-mono">#{order.orderNumber.slice(-8).toUpperCase()}</span>
                          {isAdmin && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                              {order.shop.name}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-white truncate max-w-[200px]">{order.cardName}</p>
                        <p className="text-sm text-[#8888aa] truncate">
                          {order.user.name || order.user.email}{order.box ? ` • ${order.box.name}` : order.sourceOrderId ? ' • Admin Assigned' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-amber-400">{(order.cardValue / 5).toFixed(2)} €</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      
                      <div className={`px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 ${status.color} ${status.bgColor}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{status.label}</span>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#8888aa]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#8888aa]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] p-5 space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-[#E879F9]" />
                          {t('customer')}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-[#f0f0f5]">{order.user.name || t('noName')}</p>
                          <p className="text-[#8888aa] flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {order.user.email}
                          </p>
                        </div>
                      </div>

                      {/* Shipping Info */}
                      <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#E879F9]" />
                          {t('shippingAddress')}
                        </h4>
                        <div className="space-y-1 text-sm text-[#8888aa]">
                          <p className="text-[#f0f0f5]">{order.shippingName}</p>
                          <p>{order.shippingAddress}</p>
                          <p>{order.shippingZip} {order.shippingCity}</p>
                          <p>{order.shippingCountry}</p>
                          {order.shippingPhone && (
                            <p className="mt-2">📞 {order.shippingPhone}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700 text-amber-400">
                            <Euro className="w-4 h-4" />
                            <span className="font-medium">Versand: {order.shippingMethod === 'COINS' ? `${(order.shippingCost / 5).toFixed(2)} €` : `${order.shippingCost.toFixed(2)} €`}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#E879F9]" />
                        {t('orderItem')}
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-28 rounded-lg overflow-hidden ring-1 ring-gray-700 flex-shrink-0">
                          {order.cardImage ? (
                            <Image
                              src={order.cardImage}
                              alt={order.cardName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#12123a] flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{order.cardName}</p>
                          {order.cardRarity && (
                            <p className="text-sm text-[#8888aa]">Rarity: {order.cardRarity}</p>
                          )}
                          <p className="text-sm text-amber-400 mt-1">{(order.cardValue / 5).toFixed(2)} €</p>
                          <p className="text-xs text-gray-500 mt-1">From: {order.box?.name || 'Admin Assigned Order'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Notes */}
                    {order.notes && (
                      <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-2">{t('customerNotes')}</h4>
                        <p className="text-sm text-[#8888aa]">{order.notes}</p>
                      </div>
                    )}

                    {/* Tracking Info */}
                    <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#E879F9]" />
                        {t('trackingInfo')}
                      </h4>
                      
                      {editingTracking === order.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder={t('trackingNumber')}
                            value={trackingData.number}
                            onChange={(e) => setTrackingData({ ...trackingData, number: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white text-sm focus:border-[#C84FFF] focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder={t('trackingUrlOptional')}
                            value={trackingData.url}
                            onChange={(e) => setTrackingData({ ...trackingData, url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white text-sm focus:border-[#C84FFF] focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleTrackingUpdate(order.id)}
                              disabled={updatingOrder === order.id}
                              className="bg-[#C84FFF] hover:bg-[#9333EA]"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTracking(null);
                                setTrackingData({ number: '', url: '' });
                              }}
                              className="border-[rgba(255,255,255,0.06)]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : order.trackingNumber ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-mono">{order.trackingNumber}</p>
                            {order.trackingUrl && (
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#E879F9] hover:text-[#f0abfc] flex items-center gap-1 mt-1"
                              >
                                {t('trackPackage')} <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTracking(order.id);
                              setTrackingData({
                                number: order.trackingNumber || '',
                                url: order.trackingUrl || '',
                              });
                            }}
                            className="border-[rgba(255,255,255,0.06)] text-[#8888aa]"
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTracking(order.id)}
                          className="border-[#C84FFF]/50 text-[#E879F9] hover:bg-[#C84FFF]/10"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          {t('addTracking')}
                        </Button>
                      )}
                    </div>

                    {/* Shop Notes */}
                    <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#E879F9]" />
                        {t('internalNotes')}
                      </h4>
                      
                      {editingNotes === order.id ? (
                        <div className="space-y-3">
                          <textarea
                            placeholder={t('addNotesPlaceholder')}
                            value={shopNotes}
                            onChange={(e) => setShopNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white text-sm focus:border-[#C84FFF] focus:outline-none resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleNotesUpdate(order.id)}
                              disabled={updatingOrder === order.id}
                              className="bg-[#C84FFF] hover:bg-[#9333EA]"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingNotes(null);
                                setShopNotes('');
                              }}
                              className="border-[rgba(255,255,255,0.06)]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : order.shopNotes ? (
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-[#8888aa]">{order.shopNotes}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNotes(order.id);
                              setShopNotes(order.shopNotes || '');
                            }}
                            className="border-[rgba(255,255,255,0.06)] text-[#8888aa] ml-4 flex-shrink-0"
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingNotes(order.id)}
                          className="border-[rgba(255,255,255,0.06)] text-[#8888aa]"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {t('addNotes')}
                        </Button>
                      )}
                    </div>

                    {/* Status Update */}
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <p className="text-sm text-[#8888aa] mb-3">{t('updateOrderStatus')}</p>
                      <div className="flex gap-2 flex-wrap">
                        {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => {
                          const cfg = statusConfig[s];
                          const StatusIcon = cfg.icon;
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusUpdate(order.id, s)}
                              disabled={order.status === s || updatingOrder === order.id}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2 ${
                                order.status === s
                                  ? `${cfg.bgColor} ${cfg.color} ring-2 ring-offset-2 ring-offset-gray-900 ring-current`
                                  : 'bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md hover:bg-white/10 text-[#8888aa]'
                              }`}
                            >
                              <StatusIcon className="w-4 h-4" />
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
