'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store, Search, Package, ShoppingCart, Coins,
  Eye, EyeOff, Trash2, ChevronRight, Loader2,
  AlertCircle, Database
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Shop = {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  taxId: string | null;
  createdAt: string;
  owner: { id: string; email: string; name: string | null };
  productCount: number;
  orderCount: number;
  boxCount: number;
  pendingOrders: number;
  totalStock: number;
  totalRevenue: number;
};

type Totals = {
  shops: number;
  orders: number;
  pendingOrders: number;
  revenue: number;
};

export function ShopsClient() {
  const { addToast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [totals, setTotals] = useState<Totals>({ shops: 0, orders: 0, pendingOrders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/admin/shops');
      const data = await res.json();
      if (data.success) {
        setShops(data.shops);
        setTotals(data.totals);
      }
    } catch {
      addToast({ title: 'Error', description: 'Failed to load shops', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (shop: Shop) => {
    setToggling(shop.id);
    try {
      const res = await fetch(`/api/admin/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !shop.isActive }),
      });
      if (!res.ok) throw new Error();
      setShops((prev) => prev.map((s) => s.id === shop.id ? { ...s, isActive: !s.isActive } : s));
      addToast({ title: shop.isActive ? 'Shop Deactivated' : 'Shop Activated', description: `${shop.name} is now ${shop.isActive ? 'hidden' : 'active'}` });
    } catch {
      addToast({ title: 'Error', description: 'Failed to update shop', variant: 'destructive' });
    } finally {
      setToggling(null);
    }
  };

  const deleteShop = async (shop: Shop) => {
    if (!confirm(`Delete "${shop.name}"? This will remove all products and data for this shop.`)) return;
    try {
      const res = await fetch(`/api/admin/shops/${shop.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
      addToast({ title: 'Deleted', description: `${shop.name} has been removed` });
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete shop', variant: 'destructive' });
    }
  };

  const filtered = shops.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.owner.email.toLowerCase().includes(q) || (s.owner.name || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-3" />
        <span className="text-white">Loading shops...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <Store className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{totals.shops}</div>
          <div className="text-xs text-gray-400">Total Shops</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <ShoppingCart className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{totals.orders.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Orders</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <AlertCircle className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{totals.pendingOrders.toLocaleString()}</div>
          <div className="text-xs text-yellow-400">Pending Orders</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Coins className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-gray-400">Total Revenue</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search shops by name or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl glass-strong text-white placeholder-gray-500 border border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Shops Table */}
      {filtered.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No Shops Found' : 'No Shops Yet'}
          </h2>
          <p className="text-gray-400">
            {searchQuery ? 'Try a different search term' : 'No shops have been created'}
          </p>
        </div>
      ) : (
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Shop</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-400">Owner</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-400">Products</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-400">Stock</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-400">Orders</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-400">Pending</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-400">Revenue</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.map((shop) => (
                  <tr key={shop.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/admin/shops/${shop.id}`} className="flex items-center gap-3 group-hover:text-orange-400 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-orange-400 transition-colors">{shop.name}</p>
                          {shop.taxId && <p className="text-xs text-gray-500">Tax: {shop.taxId}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-300">{shop.owner.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500">{shop.owner.email}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm text-gray-300">{shop.productCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Database className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm text-gray-300">{shop.totalStock.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-gray-300">{shop.orderCount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {shop.pendingOrders > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                          {shop.pendingOrders}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-emerald-400">
                        {shop.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        shop.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {shop.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActive(shop)}
                          disabled={toggling === shop.id}
                          className={`p-2 rounded-lg transition-colors ${shop.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-400 hover:bg-gray-700/50'}`}
                          title={shop.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {shop.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteShop(shop)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete shop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/admin/shops/${shop.id}`}
                          className="p-2 rounded-lg text-orange-400 hover:bg-orange-500/20 transition-colors"
                          title="View details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
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
  );
}
