'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ShoppingCart, Package, Database, Store,
  Clock, Truck, CheckCircle, XCircle, Check,
  ChevronDown, ChevronUp, MapPin, Mail, User,
  Send, MessageSquare, ExternalLink, Eye, EyeOff,
  Star, Coins, Euro, AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  shippingMethod: string;
  shippingCost: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  shopNotes: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  sourceOrderId: string | null;
  box: { id: string; name: string; imageUrl: string } | null;
  shop: { id: string; name: string };
};

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
  sku: string | null;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

type BoxInfo = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  cardCount: number;
};

type ShopInfo = {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  taxId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; email: string; name: string | null; createdAt: string };
};

type Tab = 'orders' | 'stock' | 'boxes' | 'details';

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', icon: Clock, label: 'Pending' },
  CONFIRMED: { color: 'text-[#BFFF00]', bgColor: 'bg-[rgba(191,255,0,0.1)]', icon: Check, label: 'Confirmed' },
  PROCESSING: { color: 'text-purple-400', bgColor: 'bg-purple-400/10', icon: Package, label: 'Processing' },
  SHIPPED: { color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'text-green-400', bgColor: 'bg-green-400/10', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'text-red-400', bgColor: 'bg-red-400/10', icon: XCircle, label: 'Cancelled' },
};

const categoryLabels: Record<string, string> = {
  SINGLE_CARD: 'Single Card', BOOSTER_BOX: 'Booster Box', BOOSTER_PACK: 'Booster Pack',
  STARTER_DECK: 'Starter Deck', STRUCTURE_DECK: 'Structure Deck', ACCESSORIES: 'Accessories',
  SLEEVES: 'Sleeves', PLAYMAT: 'Playmat', BINDER: 'Binder', DECK_BOX: 'Deck Box', OTHER: 'Other',
};

const gameLabels: Record<string, string> = {
  MAGIC_THE_GATHERING: 'MTG', ONE_PIECE: 'One Piece', POKEMON: 'Pokemon',
  LORCANA: 'Lorcana', YUGIOH: 'Yu-Gi-Oh!', FLESH_AND_BLOOD: 'FaB',
};

const conditionLabels: Record<string, string> = {
  MINT: 'Mint', NEAR_MINT: 'NM', EXCELLENT: 'EX', GOOD: 'Good',
  LIGHT_PLAYED: 'LP', PLAYED: 'PL', POOR: 'Poor',
};

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function ShopDetailClient({
  shop,
  products: initialProducts,
  orders: initialOrders,
  boxes,
}: {
  shop: ShopInfo;
  products: Product[];
  orders: Order[];
  boxes: BoxInfo[];
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState(initialOrders);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState({ number: '', url: '' });

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.length },
    { id: 'stock', label: 'Stock / Products', icon: Database, count: initialProducts.length },
    { id: 'boxes', label: 'Boxes', icon: Package, count: boxes.length },
    { id: 'details', label: 'Shop Details', icon: Store },
  ];

  const filteredOrders = filterStatus === 'ALL' ? orders : orders.filter((o) => o.status === filterStatus);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/shop-dashboard/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setOrders(orders.map((o) => o.id === orderId ? { ...o, ...data.order, cardValue: Number(data.order.cardValue), shippingCost: Number(data.order.shippingCost) } : o));
      addToast({ title: 'Status Updated', description: `Order moved to ${newStatus}` });
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleTrackingSave = async (orderId: string) => {
    try {
      const res = await fetch(`/api/shop-dashboard/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingData.number, trackingUrl: trackingData.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save tracking');
      setOrders(orders.map((o) => o.id === orderId ? { ...o, trackingNumber: trackingData.number, trackingUrl: trackingData.url } : o));
      setEditingTracking(null);
      addToast({ title: 'Tracking Saved', description: 'Tracking info updated' });
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                  : 'glass text-[#8888aa] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-[#12123a]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['ALL', ...STATUS_FLOW, 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
                    : 'glass text-[#8888aa] hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'All' : statusConfig[status]?.label || status}
                {status === 'ALL' ? ` (${orders.length})` : ` (${orders.filter((o) => o.status === status).length})`}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="glass-strong rounded-2xl p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-[#8888aa]">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                const isExpanded = expandedOrder === order.id;
                const currentIdx = STATUS_FLOW.indexOf(order.status);
                const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

                return (
                  <div key={order.id} className="glass-strong rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#12123a] overflow-hidden flex-shrink-0 relative">
                        {order.cardImage ? (
                          <Image src={order.cardImage} alt={order.cardName} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{order.cardName}</p>
                        <p className="text-xs text-gray-500">#{order.orderNumber.slice(-8)} &middot; {order.shippingName} &middot; {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${config.bgColor}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">{order.cardValue.toFixed(2)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8888aa]" /> : <ChevronDown className="w-4 h-4 text-[#8888aa]" />}
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-[rgba(255,255,255,0.06)] pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-[#8888aa] flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Shipping</h4>
                            <div className="glass rounded-lg p-3 text-sm space-y-1">
                              <p className="text-white font-medium">{order.shippingName}</p>
                              <p className="text-[#8888aa]">{order.shippingAddress}</p>
                              <p className="text-[#8888aa]">{order.shippingZip} {order.shippingCity}</p>
                              <p className="text-[#8888aa]">{order.shippingCountry}</p>
                              {order.shippingPhone && <p className="text-gray-500">{order.shippingPhone}</p>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-[#8888aa] flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Customer</h4>
                            <div className="glass rounded-lg p-3 text-sm space-y-1">
                              <p className="text-white">{order.user.name || 'Unknown'}</p>
                              <p className="text-[#8888aa]">{order.user.email}</p>
                              <p className="text-[#8888aa]">{order.shippingEmail}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {order.shippingMethod === 'COINS' ? <Coins className="w-3.5 h-3.5 text-amber-400" /> : <Euro className="w-3.5 h-3.5 text-green-400" />}
                                <span className="text-[#8888aa]">Shipping: {order.shippingCost.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tracking */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-[#8888aa] flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Tracking</h4>
                          {editingTracking === order.id ? (
                            <div className="glass rounded-lg p-3 space-y-2">
                              <input
                                value={trackingData.number}
                                onChange={(e) => setTrackingData({ ...trackingData, number: e.target.value })}
                                placeholder="Tracking number"
                                className="w-full px-3 py-2 rounded-lg bg-[#12123a] text-white text-sm border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                              />
                              <input
                                value={trackingData.url}
                                onChange={(e) => setTrackingData({ ...trackingData, url: e.target.value })}
                                placeholder="Tracking URL"
                                className="w-full px-3 py-2 rounded-lg bg-[#12123a] text-white text-sm border border-[rgba(255,255,255,0.06)] focus:border-[rgba(191,255,0,0.3)] focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleTrackingSave(order.id)} className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-500">Save</button>
                                <button onClick={() => setEditingTracking(null)} className="px-3 py-1.5 rounded-lg glass text-[#8888aa] text-xs hover:text-white">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="glass rounded-lg p-3 text-sm flex items-center justify-between">
                              <div>
                                {order.trackingNumber ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-white">{order.trackingNumber}</span>
                                    {order.trackingUrl && (
                                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No tracking info</span>
                                )}
                              </div>
                              <button
                                onClick={() => { setEditingTracking(order.id); setTrackingData({ number: order.trackingNumber || '', url: order.trackingUrl || '' }); }}
                                className="px-3 py-1 rounded-lg glass text-xs text-orange-400 hover:text-white"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {nextStatus && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusUpdate(order.id, nextStatus)}
                              disabled={updatingOrder === order.id}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-medium hover:from-orange-500 hover:to-amber-500 disabled:opacity-50"
                            >
                              {updatingOrder === order.id ? 'Updating...' : `Move to ${statusConfig[nextStatus]?.label}`}
                            </button>
                            {order.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                disabled={updatingOrder === order.id}
                                className="px-4 py-2 rounded-lg glass text-red-400 text-sm font-medium hover:bg-red-500/20"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stock / Products Tab */}
      {activeTab === 'stock' && (
        <div>
          {initialProducts.length === 0 ? (
            <div className="glass-strong rounded-2xl p-12 text-center">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-[#8888aa]">No products in stock</p>
            </div>
          ) : (
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="px-5 py-3 text-left text-sm font-semibold text-[#8888aa]">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#8888aa]">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#8888aa]">Game</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#8888aa]">Condition</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-[#8888aa]">Price</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-[#8888aa]">Stock</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-[#8888aa]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                    {initialProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#12123a] overflow-hidden flex-shrink-0 relative">
                              {product.images[0] ? (
                                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-gray-600" /></div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{product.name}</p>
                              {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#f0f0f5]">{categoryLabels[product.category] || product.category}</td>
                        <td className="px-4 py-3 text-sm text-[#f0f0f5]">{product.game ? gameLabels[product.game] || product.game : '-'}</td>
                        <td className="px-4 py-3 text-sm text-[#f0f0f5]">{conditionLabels[product.condition] || product.condition}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-400">{product.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                            product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-[#8888aa]'
                          }`}>
                            {product.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Boxes Tab */}
      {activeTab === 'boxes' && (
        <div>
          {boxes.length === 0 ? (
            <div className="glass-strong rounded-2xl p-12 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-[#8888aa]">No boxes linked to this shop yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {boxes.map((box) => (
                <div key={box.id} className="glass-strong rounded-xl overflow-hidden">
                  <div className="relative h-36 bg-[#12123a]">
                    {box.imageUrl ? (
                      <Image src={box.imageUrl} alt={box.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                        box.isActive ? 'bg-green-500/80 text-white' : 'bg-gray-700/80 text-[#f0f0f5]'
                      }`}>
                        {box.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{box.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8888aa]">{box.cardCount} cards</span>
                      <span className="font-semibold text-emerald-400">{box.price.toFixed(2)} coins</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Created {new Date(box.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-400" /> Shop Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name</label>
                <p className="text-white">{shop.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <p className="text-[#f0f0f5]">{shop.description || 'No description'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tax ID</label>
                <p className="text-[#f0f0f5]">{shop.taxId || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Status</label>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  shop.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {shop.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Created</label>
                <p className="text-[#f0f0f5]">{new Date(shop.createdAt).toLocaleDateString()} at {new Date(shop.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#BFFF00]" /> Owner Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name</label>
                <p className="text-white">{shop.owner.name || 'Unnamed'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <p className="text-[#f0f0f5]">{shop.owner.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Account Created</label>
                <p className="text-[#f0f0f5]">{new Date(shop.owner.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
