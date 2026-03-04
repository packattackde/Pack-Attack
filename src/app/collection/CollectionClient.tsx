'use client';

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Coins, ShoppingCart, Package, Crown, Gem, Star, Sparkles, Search, X, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { emitCoinBalanceUpdate } from '@/lib/coin-events';

type Pull = {
    id: string;
    card: {
        id: string;
        name: string;
        rarity: string;
        coinValue: number;
        imageUrlGatherer: string;
        sourceGame: string;
    } | null;
    box: { name: string };
    cartItem: { id: string } | null;
};

type GroupedCard = {
    card: NonNullable<Pull['card']>;
    box: Pull['box'];
    count: number;
    availablePullIds: string[];
    cartCount: number;
};

interface CollectionClientProps {
    pulls: Pull[];
}

const getRarityConfig = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
        case 'mythic':
            return { color: 'text-orange-400', bg: 'bg-gradient-to-r from-orange-500/20 to-red-500/20', border: 'border-orange-500/40', icon: Crown };
        case 'legendary':
            return { color: 'text-amber-400', bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40', icon: Gem };
        case 'rare':
            return { color: 'text-purple-400', bg: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40', icon: Star };
        case 'uncommon':
            return { color: 'text-blue-400', bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/40', icon: Sparkles };
        default:
            return { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40', icon: Package };
    }
};

const RARITY_RANK: Record<string, number> = {
    legendary: 6,
    mythic: 5,
    rare: 4,
    uncommon: 3,
    common: 2,
};

const getGameConfig = (game: string) => {
    switch (game) {
        case 'MAGIC_THE_GATHERING':
            return { label: 'MTG', bg: 'bg-gradient-to-r from-red-600 to-red-700', text: 'text-white' };
        case 'POKEMON':
            return { label: 'Pokemon', bg: 'bg-gradient-to-r from-yellow-500 to-amber-500', text: 'text-black' };
        case 'ONE_PIECE':
            return { label: 'One Piece', bg: 'bg-gradient-to-r from-red-500 to-rose-600', text: 'text-white' };
        case 'LORCANA':
            return { label: 'Lorcana', bg: 'bg-gradient-to-r from-violet-600 to-purple-700', text: 'text-white' };
        case 'YUGIOH':
            return { label: 'Yu-Gi-Oh', bg: 'bg-gradient-to-r from-indigo-600 to-blue-700', text: 'text-white' };
        default:
            return { label: game, bg: 'bg-gray-600', text: 'text-white' };
    }
};

export const CollectionClient = memo(function CollectionClient({ pulls: initialPulls }: CollectionClientProps) {
    const { addToast } = useToast();
    const [pulls, setPulls] = useState<Pull[]>(initialPulls);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Filters & sort
    const [searchQuery, setSearchQuery] = useState('');
    const [rarityFilter, setRarityFilter] = useState('');
    const [gameFilter, setGameFilter] = useState('');
    const [sortBy, setSortBy] = useState('rarity-desc');

    // Card zoom
    const [zoomedCardId, setZoomedCardId] = useState<string | null>(null);
    const [sellAmount, setSellAmount] = useState('1');
    const [confirmSell, setConfirmSell] = useState<{
        pullIds: string[];
        cardName: string;
        quantity: number;
        totalCoins: number;
    } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredPulls = useMemo(() => {
        return pulls.filter(pull => {
            if (!pull.card) return false;
            const matchesSearch = searchQuery === '' ||
                pull.card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pull.box.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRarity = rarityFilter === '' ||
                pull.card.rarity.toLowerCase() === rarityFilter.toLowerCase();
            const matchesGame = gameFilter === '' || pull.card.sourceGame === gameFilter;
            return matchesSearch && matchesRarity && matchesGame;
        });
    }, [pulls, searchQuery, rarityFilter, gameFilter]);

    const groupedCards = useMemo(() => {
        const map = new Map<string, GroupedCard>();
        for (const pull of filteredPulls) {
            if (!pull.card) continue;
            const key = pull.card.id;
            if (map.has(key)) {
                const existing = map.get(key)!;
                existing.count++;
                if (pull.cartItem) {
                    existing.cartCount++;
                } else {
                    existing.availablePullIds.push(pull.id);
                }
            } else {
                map.set(key, {
                    card: pull.card,
                    box: pull.box,
                    count: 1,
                    availablePullIds: pull.cartItem ? [] : [pull.id],
                    cartCount: pull.cartItem ? 1 : 0,
                });
            }
        }
        return Array.from(map.values());
    }, [filteredPulls]);

    const zoomedCard = zoomedCardId
        ? groupedCards.find(g => g.card.id === zoomedCardId) ?? null
        : null;

    const availableRarities = useMemo(() => {
        const set = new Set<string>();
        pulls.forEach(p => { if (p.card) set.add(p.card.rarity); });
        return Array.from(set).sort((a, b) =>
            (RARITY_RANK[b.toLowerCase()] ?? 0) - (RARITY_RANK[a.toLowerCase()] ?? 0)
        );
    }, [pulls]);

    const availableGames = useMemo(() => {
        const set = new Set<string>();
        pulls.forEach(p => { if (p.card?.sourceGame) set.add(p.card.sourceGame); });
        return Array.from(set).sort();
    }, [pulls]);

    // Sellable pull IDs grouped by rarity (excludes cart items)
    const sellByRarity = useMemo(() => {
        const map = new Map<string, { pullIds: string[]; totalCoins: number }>();
        for (const p of pulls) {
            if (!p.card || p.cartItem) continue;
            const r = p.card.rarity;
            if (!map.has(r)) map.set(r, { pullIds: [], totalCoins: 0 });
            const entry = map.get(r)!;
            entry.pullIds.push(p.id);
            entry.totalCoins += p.card.coinValue;
        }
        // Sort entries by rarity rank descending
        return Array.from(map.entries()).sort(
            ([a], [b]) => (RARITY_RANK[b.toLowerCase()] ?? 0) - (RARITY_RANK[a.toLowerCase()] ?? 0)
        );
    }, [pulls]);

    const sortedGroupedCards = useMemo(() => {
        return [...groupedCards].sort((a, b) => {
            switch (sortBy) {
                case 'rarity-desc':
                    return (RARITY_RANK[b.card.rarity.toLowerCase()] ?? 0) - (RARITY_RANK[a.card.rarity.toLowerCase()] ?? 0);
                case 'rarity-asc':
                    return (RARITY_RANK[a.card.rarity.toLowerCase()] ?? 0) - (RARITY_RANK[b.card.rarity.toLowerCase()] ?? 0);
                case 'value-desc':
                    return b.card.coinValue - a.card.coinValue;
                case 'value-asc':
                    return a.card.coinValue - b.card.coinValue;
                case 'name-asc':
                    return a.card.name.localeCompare(b.card.name);
                case 'name-desc':
                    return b.card.name.localeCompare(a.card.name);
                default:
                    return 0;
            }
        });
    }, [groupedCards, sortBy]);

    const handleSellMultiple = useCallback(async (pullIds: string[], cardName: string) => {
        if (pullIds.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch('/api/cards/sell-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pullIds }),
            });
            const data = await res.json();
            if (!res.ok) {
                addToast({ title: 'Error', description: data.error || 'Failed to sell cards', variant: 'destructive' });
                return;
            }
            addToast({ title: 'Sold!', description: `Sold ${data.cardsSold} ${cardName} for ${data.coinsReceived} coins!` });
            if (data.newBalance !== undefined) {
                emitCoinBalanceUpdate({ balance: data.newBalance });
            }
            const soldSet = new Set(pullIds);
            setPulls(prev => prev.filter(p => !soldSet.has(p.id)));
            setSellAmount('1');
        } catch {
            addToast({ title: 'Error', description: 'Failed to sell cards', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const handleAddToCart = useCallback(async (pullId: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pullId }),
            });
            const data = await res.json();
            if (!res.ok) {
                addToast({ title: 'Error', description: data.error || 'Failed to add to cart', variant: 'destructive' });
                return;
            }
            addToast({ title: 'Success', description: 'Card added to cart!' });
            setPulls(prev => prev.map(p => p.id === pullId ? { ...p, cartItem: { id: 'temp' } } : p));
        } catch {
            addToast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    return (
        <>
            {/* Sell by Rarity */}
            {sellByRarity.length > 0 && (
                <div className="glass-strong rounded-2xl p-5 mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        Sell all by rarity
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {sellByRarity.map(([rarity, { pullIds, totalCoins }]) => {
                            const cfg = getRarityConfig(rarity);
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={rarity}
                                    onClick={() => setConfirmSell({
                                        pullIds,
                                        cardName: `all ${rarity} cards`,
                                        quantity: pullIds.length,
                                        totalCoins,
                                    })}
                                    disabled={loading}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:scale-[1.03] disabled:opacity-50 ${cfg.bg} ${cfg.color} ${cfg.border}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{rarity}</span>
                                    <span className="opacity-60">×{pullIds.length}</span>
                                    <span className="ml-1 flex items-center gap-1 text-amber-400 font-bold">
                                        <Coins className="w-3 h-3" />
                                        {totalCoins.toLocaleString()}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Search & Filters */}
            <div className="glass-strong rounded-2xl p-5 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search your collection..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                    </div>
                    <select
                        value={rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value)}
                        className="px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-purple-500/50 min-w-[140px]"
                    >
                        <option value="">All Rarities</option>
                        {availableRarities.map(rarity => (
                            <option key={rarity} value={rarity}>{rarity}</option>
                        ))}
                    </select>
                    <select
                        value={gameFilter}
                        onChange={(e) => setGameFilter(e.target.value)}
                        className="px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-purple-500/50 min-w-[180px]"
                    >
                        <option value="">All Games</option>
                        {availableGames.map(game => (
                            <option key={game} value={game}>{getGameConfig(game).label}</option>
                        ))}
                    </select>
                    <div className="relative">
                        <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-purple-500/50 min-w-[180px]"
                        >
                            <option value="rarity-desc">Rarity (High → Low)</option>
                            <option value="rarity-asc">Rarity (Low → High)</option>
                            <option value="value-desc">Value (High → Low)</option>
                            <option value="value-asc">Value (Low → High)</option>
                            <option value="name-asc">Name (A → Z)</option>
                            <option value="name-desc">Name (Z → A)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Collection Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Unique Cards', value: groupedCards.length, color: 'text-white', icon: undefined as typeof Coins | undefined },
                    { label: 'Total Value', value: filteredPulls.reduce((sum, p) => sum + (p.card?.coinValue || 0), 0).toLocaleString(), color: 'text-amber-400', icon: Coins },
                    { label: 'Rare+', value: filteredPulls.filter(p => ['rare', 'mythic', 'legendary'].includes(p.card?.rarity.toLowerCase() || '')).length, color: 'text-purple-400', icon: Gem },
                    { label: 'In Cart', value: filteredPulls.filter(p => p.cartItem).length, color: 'text-emerald-400', icon: ShoppingCart },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                {Icon && <Icon className={`w-4 h-4 ${stat.color}`} />}
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Card Grid */}
            {filteredPulls.length > 0 ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {sortedGroupedCards.map((group, index) => {
                        const rarityConfig = getRarityConfig(group.card.rarity);
                        const gameConfig = getGameConfig(group.card.sourceGame);
                        const RarityIcon = rarityConfig.icon;
                        const stackShadow = group.count >= 3
                            ? '4px 4px 0 1px rgba(148,163,184,0.12), 8px 8px 0 1px rgba(148,163,184,0.07)'
                            : group.count === 2
                                ? '4px 4px 0 1px rgba(148,163,184,0.12)'
                                : undefined;

                        return (
                            <div
                                key={group.card.id}
                                className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
                                onClick={() => { setZoomedCardId(group.card.id); setSellAmount('1'); }}
                                style={{
                                    boxShadow: stackShadow,
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                                    transition: `opacity 0.3s ease ${Math.min(index * 30, 300)}ms, transform 0.3s ease ${Math.min(index * 30, 300)}ms`,
                                }}
                            >
                                <div className={`absolute inset-0 ${rarityConfig.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className={`relative glass border ${rarityConfig.border} rounded-2xl overflow-hidden`}>
                                    <div className="relative aspect-[63/88] w-full">
                                        <Image
                                            src={group.card.imageUrlGatherer}
                                            alt={group.card.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-110"
                                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, (max-width: 1280px) 16vw, 12vw"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                        {/* Top-right badges: count + cart */}
                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                            {group.count > 1 && (
                                                <div className="rounded-full bg-blue-600/90 px-2 py-0.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                                                    ×{group.count}
                                                </div>
                                            )}
                                            {group.cartCount > 0 && (
                                                <div className="rounded-full bg-emerald-500/80 px-1.5 py-0.5 text-xs font-bold text-white flex items-center gap-0.5 backdrop-blur-sm">
                                                    <ShoppingCart className="w-2.5 h-2.5" />
                                                    {group.count === 1 ? 'Cart' : group.cartCount}
                                                </div>
                                            )}
                                        </div>

                                        {/* Rarity badge */}
                                        <div className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${rarityConfig.bg} ${rarityConfig.color} border ${rarityConfig.border}`}>
                                            <RarityIcon className="w-3 h-3" />
                                            {group.card.rarity}
                                        </div>

                                        {/* Game badge */}
                                        <div className={`absolute bottom-12 left-2 rounded-full px-2 py-0.5 text-xs font-bold ${gameConfig.bg} ${gameConfig.text}`}>
                                            {gameConfig.label}
                                        </div>

                                        {/* Card Info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h3 className="font-bold text-white text-sm truncate mb-0.5">{group.card.name}</h3>
                                            <div className="flex items-center gap-1">
                                                <Coins className="h-3.5 w-3.5 text-amber-400" />
                                                <span className="text-sm font-bold text-amber-400">{group.card.coinValue}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-strong rounded-2xl p-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
                        <Package className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No cards found</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        {searchQuery || rarityFilter || gameFilter
                            ? 'Try adjusting your filters to see more cards'
                            : 'Start opening packs to build your collection!'}
                    </p>
                    <Link
                        href="/boxes"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
                    >
                        <Package className="w-5 h-5" />
                        Browse Boxes
                    </Link>
                </div>
            )}

            {/* Card Zoom Modal */}
            {zoomedCard && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setZoomedCardId(null); }}
                >
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                    <div className="relative max-w-lg w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setZoomedCardId(null)}
                            className="absolute -top-14 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
                            aria-label="Close"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="relative w-full max-w-xs aspect-[63/88] mb-6 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                            <Image
                                src={zoomedCard.card.imageUrlGatherer}
                                alt={zoomedCard.card.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 90vw, 420px"
                                unoptimized
                            />
                            {zoomedCard.count > 1 && (
                                <div className="absolute top-3 right-3 rounded-full bg-blue-600/90 px-3 py-1 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
                                    ×{zoomedCard.count} owned
                                </div>
                            )}
                        </div>

                        <div className="glass-strong rounded-2xl p-6 w-full text-center border border-white/10">
                            {(() => {
                                const config = getRarityConfig(zoomedCard.card.rarity);
                                const Icon = config.icon;
                                return (
                                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-4 ${config.bg} ${config.color} border ${config.border}`}>
                                        <Icon className="w-4 h-4" />
                                        {zoomedCard.card.rarity}
                                    </div>
                                );
                            })()}

                            <h2 className="text-2xl font-bold text-white mb-2">{zoomedCard.card.name}</h2>
                            <p className="text-gray-400 mb-4">{zoomedCard.box.name}</p>

                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                                <Coins className="h-5 w-5 text-amber-400" />
                                <span className="text-xl font-bold text-amber-400">{zoomedCard.card.coinValue}</span>
                                <span className="text-amber-400/70">coins each</span>
                                {zoomedCard.count > 1 && (
                                    <span className="text-amber-400/50 text-sm">
                                        · {zoomedCard.card.coinValue * zoomedCard.availablePullIds.length} sellable
                                    </span>
                                )}
                            </div>

                            {zoomedCard.availablePullIds.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold border border-emerald-500/30">
                                    <ShoppingCart className="h-5 w-5" />
                                    {zoomedCard.count > 1 ? `All ${zoomedCard.count} in Cart` : 'Already in Cart'}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleAddToCart(zoomedCard.availablePullIds[0])}
                                        disabled={loading}
                                        className="w-full px-6 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        Add to Cart
                                        {zoomedCard.cartCount > 0 && (
                                            <span className="text-xs font-normal text-gray-400">({zoomedCard.cartCount} already in cart)</span>
                                        )}
                                    </button>

                                    <div className="border-t border-white/10 pt-3">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Sell for coins</p>

                                        {zoomedCard.availablePullIds.length >= 5 && (
                                            <div className="flex gap-2 mb-3">
                                                <button
                                                    onClick={() => setConfirmSell({ pullIds: zoomedCard.availablePullIds.slice(0, 5), cardName: zoomedCard.card.name, quantity: 5, totalCoins: zoomedCard.card.coinValue * 5 })}
                                                    disabled={loading}
                                                    className="flex-1 px-3 py-2.5 rounded-xl font-bold text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all text-sm flex flex-col items-center gap-0.5 disabled:opacity-50"
                                                >
                                                    <span>Sell 5 Cards</span>
                                                    <span className="text-amber-400 text-xs font-normal">{zoomedCard.card.coinValue * 5} coins</span>
                                                </button>
                                                {zoomedCard.availablePullIds.length >= 10 && (
                                                    <button
                                                        onClick={() => setConfirmSell({ pullIds: zoomedCard.availablePullIds.slice(0, 10), cardName: zoomedCard.card.name, quantity: 10, totalCoins: zoomedCard.card.coinValue * 10 })}
                                                        disabled={loading}
                                                        className="flex-1 px-3 py-2.5 rounded-xl font-bold text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all text-sm flex flex-col items-center gap-0.5 disabled:opacity-50"
                                                    >
                                                        <span>Sell 10 Cards</span>
                                                        <span className="text-amber-400 text-xs font-normal">{zoomedCard.card.coinValue * 10} coins</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {(() => {
                                            const parsed = Math.min(Math.max(1, parseInt(sellAmount) || 1), zoomedCard.availablePullIds.length);
                                            return (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={zoomedCard.availablePullIds.length}
                                                        value={sellAmount}
                                                        onChange={(e) => setSellAmount(e.target.value)}
                                                        className="w-20 px-3 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-center focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                    />
                                                    <button
                                                        onClick={() => setConfirmSell({ pullIds: zoomedCard.availablePullIds.slice(0, parsed), cardName: zoomedCard.card.name, quantity: parsed, totalCoins: parsed * zoomedCard.card.coinValue })}
                                                        disabled={loading}
                                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50"
                                                    >
                                                        <Coins className="h-4 w-4" />
                                                        Sell {parsed} · {parsed * zoomedCard.card.coinValue} coins
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sell Confirmation Dialog */}
            {confirmSell && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setConfirmSell(null); }}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                    <div className="relative glass-strong rounded-2xl p-8 w-full max-w-sm border border-white/10 animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
                            <Coins className="w-7 h-7 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Confirm Sale</h3>
                        <p className="text-gray-400 mb-1">
                            Do you really want to sell{' '}
                            <span className="text-white font-semibold">
                                {confirmSell.quantity === 1
                                    ? confirmSell.cardName
                                    : `${confirmSell.quantity}× ${confirmSell.cardName}`}
                            </span>?
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-3 mb-7">
                            <Coins className="h-4 w-4 text-amber-400" />
                            <span className="text-lg font-bold text-amber-400">{confirmSell.totalCoins.toLocaleString()} coins</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmSell(null)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const pending = confirmSell;
                                    setConfirmSell(null);
                                    handleSellMultiple(pending.pullIds, pending.cardName);
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/25 disabled:opacity-50"
                            >
                                Sell Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});
