'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Package, Filter, ChevronLeft, ChevronRight,
  Edit3, Check, X, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, Loader2, RefreshCw, SlidersHorizontal
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  category: string;
  game: string | null;
  condition: string;
  sku: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

const GAME_LABELS: Record<string, string> = {
  POKEMON: 'Pokémon',
  MAGIC_THE_GATHERING: 'Magic',
  YUGIOH: 'Yu-Gi-Oh!',
  ONE_PIECE: 'One Piece',
  LORCANA: 'Lorcana',
  FLESH_AND_BLOOD: 'FaB',
};

const CATEGORY_LABELS: Record<string, string> = {
  SINGLE_CARD: 'Single',
  BOOSTER_BOX: 'Booster Box',
  BOOSTER_PACK: 'Booster Pack',
  STARTER_DECK: 'Starter Deck',
  STRUCTURE_DECK: 'Structure Deck',
  ACCESSORIES: 'Accessories',
  SLEEVES: 'Sleeves',
  PLAYMAT: 'Playmat',
  BINDER: 'Binder',
  DECK_BOX: 'Deck Box',
  OTHER: 'Other',
};

const CONDITION_LABELS: Record<string, string> = {
  MINT: 'Mint',
  NEAR_MINT: 'NM',
  EXCELLENT: 'EX',
  GOOD: 'Good',
  LIGHT_PLAYED: 'LP',
  PLAYED: 'PL',
  POOR: 'Poor',
};

export function StockManagerClient({ shopId }: { shopId: string }) {
  const t = useTranslations('shopDashboard.stock');
  const tc = useTranslations('common');
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ stock?: number; price?: number; name?: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      params.set('shopId', shopId);
      if (searchDebounced) params.set('search', searchDebounced);
      if (filterGame) params.set('game', filterGame);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/shop-dashboard/stock/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      addToast({ title: tc('error'), description: t('failedToLoad'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, filterGame, filterStatus, shopId, addToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleUpdate = async (id: string, data: Record<string, any>) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/shop-dashboard/stock/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setProducts(prev => prev.map(p => p.id === id ? result.product : p));
      setEditingId(null);
      setEditValues({});
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteProduct'))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/shop-dashboard/stock/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      addToast({ title: t('deleted'), description: t('productRemoved') });
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues({ stock: product.stock, price: product.price, name: product.name });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('searchProducts')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800/80 border border-[rgba(255,255,255,0.06)] text-white text-sm focus:ring-2 focus:ring-[#C84FFF] focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            showFilters || filterGame || filterStatus
              ? 'bg-[#C84FFF]/20 text-[#E879F9] ring-1 ring-[#C84FFF]/30'
              : 'bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('filters')}
          {(filterGame || filterStatus) && (
            <span className="w-2 h-2 rounded-full bg-[#C84FFF]" />
          )}
        </button>
        <button
          onClick={() => fetchProducts()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4 flex flex-wrap gap-3">
          <select
            value={filterGame}
            onChange={(e) => { setFilterGame(e.target.value); setPage(1); }}
            className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t('allGames')}</option>
            {Object.entries(GAME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t('allStatus')}</option>
            <option value="active">{t('activeFilter')}</option>
            <option value="inactive">{t('inactiveFilter')}</option>
            <option value="out_of_stock">{t('outOfStockFilter')}</option>
          </select>
          {(filterGame || filterStatus) && (
            <button
              onClick={() => { setFilterGame(''); setFilterStatus(''); setPage(1); }}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-500">
        {t('productsFound', { count: total })}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#E879F9] animate-spin mx-auto mb-3" />
          <p className="text-[#8888aa]">{t('loadingStock')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-[#8888aa]">{t('noProducts')}</p>
          <p className="text-gray-600 text-sm mt-1">{t('importHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">{t('headerProduct')}</div>
            <div className="col-span-1 text-center">{t('headerGame')}</div>
            <div className="col-span-1 text-center">{t('headerCondition')}</div>
            <div className="col-span-1 text-right">{t('headerPrice')}</div>
            <div className="col-span-1 text-center">{t('headerStock')}</div>
            <div className="col-span-1 text-center">{t('headerStatus')}</div>
            <div className="col-span-1 text-center">{t('headerSKU')}</div>
            <div className="col-span-2 text-right">{t('headerActions')}</div>
          </div>

          {products.map((product) => {
            const isEditing = editingId === product.id;
            const isUpdating = updatingId === product.id;

            return (
              <div
                key={product.id}
                className={`bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-4 transition-all ${
                  isEditing ? 'ring-1 ring-[#C84FFF]/50' : ''
                } ${!product.isActive ? 'opacity-60' : ''}`}
              >
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Name */}
                  <div className="col-span-12 md:col-span-4">
                    {isEditing ? (
                      <input
                        value={editValues.name ?? product.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="w-full bg-[#12123a] border border-gray-600 text-white rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#C84FFF]"
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-white text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {product.game ? GAME_LABELS[product.game] || product.game : ''} · {CATEGORY_LABELS[product.category] || product.category}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Game */}
                  <div className="hidden md:block col-span-1 text-center">
                    <span className="text-xs text-[#8888aa]">{product.game ? GAME_LABELS[product.game] || product.game : '—'}</span>
                  </div>

                  {/* Condition */}
                  <div className="hidden md:block col-span-1 text-center">
                    <span className="text-xs text-[#8888aa]">{CONDITION_LABELS[product.condition] || product.condition}</span>
                  </div>

                  {/* Price */}
                  <div className="col-span-3 md:col-span-1 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editValues.price ?? product.price}
                        onChange={(e) => setEditValues({ ...editValues, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#12123a] border border-gray-600 text-white rounded-lg px-2 py-1.5 text-sm text-right focus:ring-1 focus:ring-[#C84FFF]"
                      />
                    ) : (
                      <span className="text-sm text-amber-400 font-medium">{product.price.toFixed(2)}€</span>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="col-span-3 md:col-span-1 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.stock ?? product.stock}
                        onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) || 0 })}
                        className="w-20 mx-auto bg-[#12123a] border border-gray-600 text-white rounded-lg px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-[#C84FFF]"
                      />
                    ) : (
                      <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-400' : product.stock < 5 ? 'text-yellow-400' : 'text-[#E879F9]'}`}>
                        {product.stock}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 md:col-span-1 text-center">
                    <button
                      onClick={() => handleUpdate(product.id, { isActive: !product.isActive })}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1 transition-colors"
                      title={product.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {product.isActive ? (
                        <ToggleRight className="w-6 h-6 text-[#E879F9]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* SKU */}
                  <div className="hidden md:block col-span-1 text-center">
                    <span className="text-xs text-gray-500 truncate block">{product.sku || '—'}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleUpdate(product.id, editValues)}
                          disabled={isUpdating}
                          className="p-2 rounded-lg bg-[#C84FFF]/20 text-[#E879F9] hover:bg-[#C84FFF]/30 transition-colors"
                          title="Save"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(product)}
                          className="p-2 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-[#E879F9] transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="p-2 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            {t('pageOf', { page, total: totalPages })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
