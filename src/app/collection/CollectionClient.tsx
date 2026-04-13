'use client';

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Coins, ShoppingCart, Package, Crown, Gem, Star, Sparkles, Search, X, ArrowUpDown, BoxIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { emitCoinBalanceUpdate } from '@/lib/coin-events';
import { useTranslations } from 'next-intl';

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

const isSealed = (rarity: string) => rarity?.toLowerCase() === 'none';


const getRarityConfig = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
        case 'none':
            return { color: 'text-[#f0abfc]', bg: 'bg-gradient-to-r from-[#7c3aed]/20 to-[#9333EA]/20', border: 'border-[#C84FFF]/40', icon: BoxIcon };
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
    none: 1,
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
    const t = useTranslations('collection');
    const tCommon = useTranslations('common');
    const { addToast } = useToast();
    const getRarityDisplay = (rarity: string) => isSealed(rarity) ? t('sealed') : rarity;
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
                addToast({ title: t('failedToSell'), description: data.error || t('failedToSell'), variant: 'destructive' });
                return;
            }
            addToast({ title: t('soldTitle'), description: `${data.cardsSold}× ${cardName} → ${data.coinsReceived} ${tCommon('coins')}` });
            if (data.newBalance !== undefined) {
                emitCoinBalanceUpdate({ balance: data.newBalance });
            }
            const soldSet = new Set(pullIds);
            setPulls(prev => prev.filter(p => !soldSet.has(p.id)));
            setSellAmount('1');
        } catch {
            addToast({ title: t('failedToSell'), description: t('failedToSell'), variant: 'destructive' });
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
                addToast({ title: t('failedToAddToCart'), description: data.error || t('failedToAddToCart'), variant: 'destructive' });
                return;
            }
            addToast({ title: t('addedToCart'), description: t('addedToCart') });
            setPulls(prev => prev.map(p => p.id === pullId ? { ...p, cartItem: { id: 'temp' } } : p));
        } catch {
            addToast({ title: t('failedToAddToCart'), description: t('failedToAddToCart'), variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    return (
        <>
            {/* Sell by Rarity */}
            {sellByRarity.length > 0 && (
                <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-5 mb-6">
                    <p className="text-xs text-[#8888aa] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        {t('sellAllByRarity')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {sellByRarity.map(([rarity, { pullIds, totalCoins }]) => {
                            const cfg = getRarityConfig(rarity);
                            const Icon = cfg.icon;
                            const label = getRarityDisplay(rarity);
                            return (
                                <button
                                    key={rarity}
                                    onClick={() => setConfirmSell({
                                        pullIds,
                                        cardName: label,
                                        quantity: pullIds.length,
                                        totalCoins,
                                    })}
                                    disabled={loading}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:scale-[1.03] disabled:opacity-50 ${cfg.bg} ${cfg.color} ${cfg.border}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{label}</span>
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
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-5 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8888aa] group-focus-within:text-[#C84FFF] transition-colors" />
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[#12123a] border border-[rgba(255,255,255,0.06)] rounded-xl text-white placeholder-[#8888aa] focus:border-[#C84FFF]/50 focus:ring-2 focus:ring-[#C84FFF]/20 transition-all"
                            />
                        </div>
                    </div>
                    <select
                        value={rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value)}
                        className="px-4 py-3 bg-[#16164a] border border-[rgba(255,255,255,0.06)] rounded-xl text-white focus:border-[#C84FFF]/50 min-w-[140px]"
                    >
                        <option value="">{t('allRarities')}</option>
                        {availableRarities.map(rarity => (
                            <option key={rarity} value={rarity}>{getRarityDisplay(rarity)}</option>
                        ))}
                    </select>
                    <select
                        value={gameFilter}
                        onChange={(e) => setGameFilter(e.target.value)}
                        className="px-4 py-3 bg-[#16164a] border border-[rgba(255,255,255,0.06)] rounded-xl text-white focus:border-[#C84FFF]/50 min-w-[180px]"
                    >
                        <option value="">{t('allGames')}</option>
                        {availableGames.map(game => (
                            <option key={game} value={game}>{getGameConfig(game).label}</option>
                        ))}
                    </select>
                    <div className="relative">
                        <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888aa] pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-[#16164a] border border-[rgba(255,255,255,0.06)] rounded-xl text-white focus:border-[#C84FFF]/50 min-w-[180px]"
                        >
                            <option value="rarity-desc">{t('sort.rarityHighLow')}</option>
                            <option value="rarity-asc">{t('sort.rarityLowHigh')}</option>
                            <option value="value-desc">{t('sort.valueHighLow')}</option>
                            <option value="value-asc">{t('sort.valueLowHigh')}</option>
                            <option value="name-asc">{t('sort.nameAZ')}</option>
                            <option value="name-desc">{t('sort.nameZA')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Collection Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: t('uniqueCards'), value: groupedCards.length, color: 'text-white', icon: undefined as typeof Coins | undefined },
                    { label: t('totalValue'), value: filteredPulls.reduce((sum, p) => sum + (p.card?.coinValue || 0), 0).toLocaleString(), color: 'text-amber-400', icon: Coins },
                    { label: t('rareplus'), value: filteredPulls.filter(p => ['rare', 'mythic', 'legendary'].includes(p.card?.rarity.toLowerCase() || '')).length, color: 'text-purple-400', icon: Gem },
                    { label: t('inCart'), value: filteredPulls.filter(p => p.cartItem).length, color: 'text-[#C84FFF]', icon: ShoppingCart },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                {Icon && <Icon className={`w-4 h-4 ${stat.color}`} />}
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                            <p className="text-sm text-[#8888aa]">{stat.label}</p>
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
                                <div className={`relative bg-[#1a1a4a] shadow-md border ${rarityConfig.border} rounded-2xl overflow-hidden`}>
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
                                                <div className="rounded-full bg-[#C84FFF]/90 px-2 py-0.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                                                    ×{group.count}
                                                </div>
                                            )}
                                            {group.cartCount > 0 && (
                                                <div className="rounded-full bg-[#C84FFF]/80 px-1.5 py-0.5 text-xs font-bold text-white flex items-center gap-0.5 backdrop-blur-sm">
                                                    <ShoppingCart className="w-2.5 h-2.5" />
                                                    {group.count === 1 ? tCommon('cart') : group.cartCount}
                                                </div>
                                            )}
                                        </div>

                                        {/* Rarity badge — sealed products show neutral "Sealed" label */}
                                        {isSealed(group.card.rarity) ? (
                                            <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-[#C84FFF]/20 text-[#f0abfc] border border-[#C84FFF]/40">
                                                <BoxIcon className="w-3 h-3" />
                                                {t('sealed')}
                                            </div>
                                        ) : (
                                            <div className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${rarityConfig.bg} ${rarityConfig.color} border ${rarityConfig.border}`}>
                                                <RarityIcon className="w-3 h-3" />
                                                {group.card.rarity}
                                            </div>
                                        )}

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
                <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
                        <Package className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{t('noCardsFound')}</h3>
                    <p className="text-[#8888aa] mb-8 max-w-md mx-auto">
                        {searchQuery || rarityFilter || gameFilter
                            ? t('adjustFilters')
                            : t('startOpening')}
                    </p>
                    <Link
                        href="/boxes"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#C84FFF] text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_24px_rgba(200,79,255,0.3)]"
                    >
                        <Package className="w-5 h-5" />
                        {t('browseBoxes')}
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
                            aria-label={tCommon('close')}
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
                                <div className="absolute top-3 right-3 rounded-full bg-[#C84FFF]/90 px-3 py-1 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
                                    {t('owned', { count: zoomedCard.count })}
                                </div>
                            )}
                        </div>

                        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 w-full text-center border border-white/10">
                            {(() => {
                                const config = getRarityConfig(zoomedCard.card.rarity);
                                const Icon = config.icon;
                                const label = getRarityDisplay(zoomedCard.card.rarity);
                                return (
                                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-4 ${config.bg} ${config.color} border ${config.border}`}>
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </div>
                                );
                            })()}

                            <h2 className="text-2xl font-bold text-white mb-2">{zoomedCard.card.name}</h2>
                            <p className="text-[#8888aa] mb-4">{zoomedCard.box.name}</p>

                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                                <Coins className="h-5 w-5 text-amber-400" />
                                <span className="text-xl font-bold text-amber-400">{zoomedCard.card.coinValue}</span>
                                <span className="text-amber-400/70">{t('coinsEach')}</span>
                                {zoomedCard.count > 1 && (
                                    <span className="text-amber-400/50 text-sm">
                                        · {zoomedCard.card.coinValue * zoomedCard.availablePullIds.length} {t('sellable')}
                                    </span>
                                )}
                            </div>

                            {zoomedCard.availablePullIds.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 px-6 py-4 bg-[#C84FFF]/10 text-[#E879F9] rounded-xl font-bold border border-[#C84FFF]/30">
                                    <ShoppingCart className="h-5 w-5" />
                                    {zoomedCard.count > 1 ? t('allInCart', { count: zoomedCard.count }) : t('alreadyInCart')}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleAddToCart(zoomedCard.availablePullIds[0])}
                                        disabled={loading}
                                        className="w-full px-6 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        {t('addToCart')}
                                        {zoomedCard.cartCount > 0 && (
                                            <span className="text-xs font-normal text-[#8888aa]">{t('inCartCount', { count: zoomedCard.cartCount })}</span>
                                        )}
                                    </button>

                                    <div className="border-t border-white/10 pt-3">
                                        <p className="text-xs text-[#8888aa] uppercase tracking-wider mb-3">{t('sellForCoins')}</p>

                                        {zoomedCard.availablePullIds.length >= 5 && (
                                            <div className="flex gap-2 mb-3">
                                                <button
                                                    onClick={() => setConfirmSell({ pullIds: zoomedCard.availablePullIds.slice(0, 5), cardName: zoomedCard.card.name, quantity: 5, totalCoins: zoomedCard.card.coinValue * 5 })}
                                                    disabled={loading}
                                                    className="flex-1 px-3 py-2.5 rounded-xl font-bold text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all text-sm flex flex-col items-center gap-0.5 disabled:opacity-50"
                                                >
                                                    <span>{t('sellCards', { count: 5 })}</span>
                                                    <span className="text-amber-400 text-xs font-normal">{zoomedCard.card.coinValue * 5} {tCommon('coins').toLowerCase()}</span>
                                                </button>
                                                {zoomedCard.availablePullIds.length >= 10 && (
                                                    <button
                                                        onClick={() => setConfirmSell({ pullIds: zoomedCard.availablePullIds.slice(0, 10), cardName: zoomedCard.card.name, quantity: 10, totalCoins: zoomedCard.card.coinValue * 10 })}
                                                        disabled={loading}
                                                        className="flex-1 px-3 py-2.5 rounded-xl font-bold text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all text-sm flex flex-col items-center gap-0.5 disabled:opacity-50"
                                                    >
                                                        <span>{t('sellCards', { count: 10 })}</span>
                                                        <span className="text-amber-400 text-xs font-normal">{zoomedCard.card.coinValue * 10} {tCommon('coins').toLowerCase()}</span>
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
                                                        {t('sellCards', { count: parsed })} · {parsed * zoomedCard.card.coinValue} {tCommon('coins').toLowerCase()}
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
                    <div className="relative bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-8 w-full max-w-sm border border-white/10 animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
                            <Coins className="w-7 h-7 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('confirmSale')}</h3>
                        <p className="text-[#8888aa] mb-1">
                            {t('confirmSaleBody')}{' '}
                            <span className="text-white font-semibold">
                                {confirmSell.quantity === 1
                                    ? confirmSell.cardName
                                    : `${confirmSell.quantity}× ${confirmSell.cardName}`}
                            </span>?
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-3 mb-7">
                            <Coins className="h-4 w-4 text-amber-400" />
                            <span className="text-lg font-bold text-amber-400">{confirmSell.totalCoins.toLocaleString()} {tCommon('coins').toLowerCase()}</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmSell(null)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                            >
                                {tCommon('cancel')}
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
                                {t('sellNow')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});
