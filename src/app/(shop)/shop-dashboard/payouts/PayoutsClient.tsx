'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, ArrowRightLeft, Clock, CheckCircle, XCircle,
  Loader2, Banknote, Coins, AlertCircle, ChevronDown, ChevronUp,
  Package, Filter, RotateCcw, Send, MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type PayoutItem = {
  id: string;
  orderNumber: string;
  cardName: string;
  cardImage: string | null;
  cardValue: number;
  cardRarity: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

type Payout = {
  id: string;
  status: string;
  coinAmount: number;
  euroAmount: number;
  adminNotes: string | null;
  shopMessage: string | null;
  processedAt: string | null;
  resubmittedAt: string | null;
  createdAt: string;
  items: PayoutItem[];
};

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  REQUESTED: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', icon: Clock, label: 'Pending' },
  PROCESSING: { color: 'text-[#BFFF00]', bgColor: 'bg-[rgba(191,255,0,0.1)]', icon: Loader2, label: 'Approved' },
  COMPLETED: { color: 'text-green-400', bgColor: 'bg-green-400/10', icon: CheckCircle, label: 'Paid' },
  REJECTED: { color: 'text-red-400', bgColor: 'bg-red-400/10', icon: XCircle, label: 'Rejected' },
};

export function PayoutsClient({
  initialPayouts,
  coinBalance,
  rate,
  eligibleCount: initEligibleCount,
  eligibleTotal: initEligibleTotal,
  eligibleEuro: initEligibleEuro,
  shopId,
}: {
  initialPayouts: Payout[];
  coinBalance: number;
  rate: number;
  eligibleCount: number;
  eligibleTotal: number;
  eligibleEuro: number;
  shopId: string;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [balance, setBalance] = useState(coinBalance);
  const [eligibleCount, setEligibleCount] = useState(initEligibleCount);
  const [eligibleTotal, setEligibleTotal] = useState(initEligibleTotal);
  const [eligibleEuro, setEligibleEuro] = useState(initEligibleEuro);
  const [requesting, setRequesting] = useState(false);
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [resubmitId, setResubmitId] = useState<string | null>(null);
  const [resubmitMessage, setResubmitMessage] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  const hasPending = payouts.some(p => p.status === 'REQUESTED' || p.status === 'PROCESSING');
  const totalPaidCoins = payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.coinAmount, 0);
  const totalPaidEuro = payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.euroAmount, 0);

  const filteredPayouts = filterStatus === 'ALL' ? payouts : payouts.filter(p => p.status === filterStatus);

  const handleRequestPayout = async () => {
    if (eligibleCount <= 0 || hasPending) return;
    setRequesting(true);
    try {
      const res = await fetch('/api/shop-dashboard/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request payout');

      setPayouts([data.payout, ...payouts]);
      setBalance(prev => prev - data.payout.coinAmount);
      setEligibleCount(0);
      setEligibleTotal(0);
      setEligibleEuro(0);
      addToast({
        title: 'Payout Requested',
        description: `${data.payout.coinAmount.toFixed(2)} coins (${data.payout.euroAmount.toFixed(2)} EUR) — ${data.payout.items.length} items`,
      });
      router.refresh();
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRequesting(false);
    }
  };

  const handleResubmit = async (payoutId: string) => {
    if (!resubmitMessage.trim()) {
      addToast({ title: 'Error', description: 'Please enter a message for the admin', variant: 'destructive' });
      return;
    }
    setResubmitting(true);
    try {
      const res = await fetch(`/api/shop-dashboard/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resubmit', shopMessage: resubmitMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resubmit payout');

      setPayouts(payouts.map(p => p.id === payoutId ? data.payout : p));
      setResubmitId(null);
      setResubmitMessage('');
      addToast({ title: 'Payout Resubmitted', description: 'Your payout has been resubmitted for review' });
      router.refresh();
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Wallet Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <div className="relative">
            <Coins className="w-8 h-8 text-amber-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">{balance.toFixed(2)}</div>
            <div className="text-sm text-[#8888aa]">Coin Balance</div>
          </div>
        </div>

        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <div className="relative">
            <Package className="w-8 h-8 text-emerald-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">{eligibleCount}</div>
            <div className="text-sm text-[#8888aa]">
              Delivered Items ({eligibleTotal.toFixed(2)} coins / {eligibleEuro.toFixed(2)} EUR)
            </div>
          </div>
        </div>

        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <div className="relative">
            <Banknote className="w-8 h-8 text-green-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">{totalPaidEuro.toFixed(2)} EUR</div>
            <div className="text-sm text-[#8888aa]">Total Paid Out ({totalPaidCoins.toFixed(2)} coins)</div>
          </div>
        </div>

        <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-6 flex flex-col justify-center">
          {hasPending ? (
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-400 font-medium text-sm">Payout request pending</p>
              <p className="text-gray-500 text-xs mt-1">Wait for admin to process your current request</p>
            </div>
          ) : eligibleCount <= 0 ? (
            <div className="text-center">
              <Wallet className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 font-medium text-sm">No delivered items</p>
              <p className="text-gray-600 text-xs mt-1">Items must be delivered before requesting payout</p>
            </div>
          ) : (
            <button
              onClick={handleRequestPayout}
              disabled={requesting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {requesting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-5 h-5" />
              )}
              Request Payout ({eligibleCount} items)
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {['ALL', 'REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === s
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white'
            }`}
          >
            {s === 'ALL' ? 'All' : statusConfig[s]?.label || s}
            {s !== 'ALL' && ` (${payouts.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Payout History */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Payout History</h2>
        {filteredPayouts.length === 0 ? (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
            <Wallet className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-[#8888aa]">No payouts yet</p>
            <p className="text-gray-600 text-sm mt-1">Request a payout when you have delivered items</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayouts.map((payout) => {
              const config = statusConfig[payout.status] || statusConfig.REQUESTED;
              const StatusIcon = config.icon;
              const isExpanded = expandedPayout === payout.id;

              return (
                <div key={payout.id} className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl overflow-hidden">
                  <div
                    className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedPayout(isExpanded ? null : payout.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
                          <StatusIcon className={`w-5 h-5 ${config.color} ${payout.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-amber-400">{payout.coinAmount.toFixed(2)} coins</span>
                            <span className="text-gray-600">→</span>
                            <span className="font-semibold text-green-400">{payout.euroAmount.toFixed(2)} EUR</span>
                            <span className="text-xs text-gray-500">({payout.items.length} items)</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested {new Date(payout.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {payout.processedAt && ` • Processed ${new Date(payout.processedAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-xl text-xs font-medium ${config.color} ${config.bgColor}`}>
                          {config.label}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8888aa]" /> : <ChevronDown className="w-4 h-4 text-[#8888aa]" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[rgba(255,255,255,0.06)] p-5 space-y-3">
                      {payout.adminNotes && (
                        <div className="p-3 rounded-lg bg-[#12123a] text-sm text-[#8888aa]">
                          <span className="text-gray-500 font-medium">Admin: </span>{payout.adminNotes}
                        </div>
                      )}

                      {payout.shopMessage && (
                        <div className="p-3 rounded-lg bg-[rgba(191,255,0,0.05)] border border-[rgba(191,255,0,0.15)] text-sm text-[#BFFF00]/80">
                          <span className="text-[#BFFF00] font-medium flex items-center gap-1.5 mb-1">
                            <MessageSquare className="w-3.5 h-3.5" /> Your message:
                          </span>
                          {payout.shopMessage}
                        </div>
                      )}

                      {payout.status === 'REJECTED' && !payout.resubmittedAt && (
                        <div className="p-4 rounded-xl bg-red-900/10 border border-red-800/30">
                          {resubmitId === payout.id ? (
                            <div className="space-y-3">
                              <p className="text-sm text-red-300 font-medium">Resubmit with a message for the admin:</p>
                              <textarea
                                value={resubmitMessage}
                                onChange={(e) => setResubmitMessage(e.target.value)}
                                placeholder="Explain what was resolved or provide additional info..."
                                rows={3}
                                maxLength={2000}
                                className="w-full px-3 py-2 rounded-lg bg-[#12123a] border border-[rgba(255,255,255,0.06)] text-white text-sm focus:border-emerald-500 focus:outline-none resize-none placeholder:text-gray-600"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleResubmit(payout.id)}
                                  disabled={resubmitting || !resubmitMessage.trim()}
                                  className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                  {resubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                  Send Resubmission
                                </button>
                                <button
                                  onClick={() => { setResubmitId(null); setResubmitMessage(''); }}
                                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-[#8888aa] hover:text-white transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-red-300">This payout was rejected. You can resubmit it once with a message.</p>
                              <button
                                onClick={() => setResubmitId(payout.id)}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Resubmit
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {payout.status === 'REJECTED' && payout.resubmittedAt && (
                        <div className="p-3 rounded-lg bg-[#12123a] text-sm text-gray-500 italic">
                          This payout was already resubmitted on {new Date(payout.resubmittedAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })} and rejected again. No further resubmissions are possible.
                        </div>
                      )}

                      <div className="text-sm font-medium text-[#8888aa] mb-2">Included Items</div>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {payout.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-lg p-3">
                            {item.cardImage && (
                              <img
                                src={item.cardImage}
                                alt={item.cardName}
                                className="w-10 h-14 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{item.cardName}</div>
                              <div className="text-xs text-gray-500">
                                #{item.orderNumber.slice(-8)} • {item.user.name || item.user.email}
                                {item.cardRarity && ` • ${item.cardRarity}`}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-amber-400 whitespace-nowrap">
                              {item.cardValue.toFixed(2)} coins
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-[rgba(255,255,255,0.06)]">
                        <span className="text-sm text-[#8888aa]">{payout.items.length} items total</span>
                        <span className="text-sm font-bold text-amber-400">{payout.coinAmount.toFixed(2)} coins = {payout.euroAmount.toFixed(2)} EUR</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
