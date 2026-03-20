'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Clock, CheckCircle, XCircle, Loader2,
  Banknote, Coins, Store, FileText, Printer,
  ChevronDown, ChevronUp, MessageSquare, Package
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
  processedById: string | null;
  processedAt: string | null;
  resubmittedAt: string | null;
  createdAt: string;
  items: PayoutItem[];
  shop: {
    id: string;
    name: string;
    taxId: string | null;
    coinBalance: number;
    owner: { id: string; email: string; name: string | null };
  };
};

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  REQUESTED: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', icon: Clock, label: 'Pending' },
  PROCESSING: { color: 'text-blue-400', bgColor: 'bg-blue-400/10', icon: Loader2, label: 'Approved' },
  COMPLETED: { color: 'text-green-400', bgColor: 'bg-green-400/10', icon: CheckCircle, label: 'Paid' },
  REJECTED: { color: 'text-red-400', bgColor: 'bg-red-400/10', icon: XCircle, label: 'Rejected' },
};

export function PayoutsAdminClient({ initialPayouts }: { initialPayouts: Payout[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

  const handleStatusUpdate = async (payoutId: string, newStatus: string) => {
    setUpdating(payoutId);
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes: notesInput[payoutId] || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payout');

      setPayouts(payouts.map(p => p.id === payoutId ? data.payout : p));
      const label = statusConfig[newStatus]?.label || newStatus;
      addToast({ title: 'Payout Updated', description: `Payout marked as ${label}` });
      router.refresh();
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const handlePrint = (payout: Payout) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = payout.items.map(item => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${item.cardName}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${item.cardRarity || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">#${item.orderNumber.slice(-8)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${item.user.name || item.user.email}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${item.cardValue.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html><head><title>Payout Slip - ${payout.shop.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 24px; margin-bottom: 5px; }
        h2 { font-size: 16px; color: #666; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section h3 { font-size: 14px; color: #999; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; }
        .label { color: #666; }
        .value { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        th { text-align: left; padding: 8px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; color: #666; }
        th:last-child { text-align: right; }
        .total { font-size: 20px; margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; }
        .total .coins { color: #d97706; }
        .total .arrow { margin: 0 10px; color: #999; }
        .total .euros { color: #059669; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; font-size: 12px; color: #999; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature div { width: 200px; border-top: 1px solid #333; padding-top: 5px; text-align: center; font-size: 12px; }
      </style></head><body>
      <h1>Pack-Attack Payout Slip</h1>
      <h2>Payout #${payout.id.slice(-8).toUpperCase()}</h2>
      <div class="section">
        <h3>Shop Details</h3>
        <div class="row"><span class="label">Shop Name:</span><span class="value">${payout.shop.name}</span></div>
        <div class="row"><span class="label">Owner:</span><span class="value">${payout.shop.owner.name || payout.shop.owner.email}</span></div>
        <div class="row"><span class="label">Email:</span><span class="value">${payout.shop.owner.email}</span></div>
        ${payout.shop.taxId ? `<div class="row"><span class="label">Tax ID:</span><span class="value">${payout.shop.taxId}</span></div>` : ''}
      </div>
      <div class="section">
        <h3>Payout Details</h3>
        <div class="row"><span class="label">Requested:</span><span class="value">${new Date(payout.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
        ${payout.processedAt ? `<div class="row"><span class="label">Processed:</span><span class="value">${new Date(payout.processedAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>` : ''}
        <div class="row"><span class="label">Status:</span><span class="value">${statusConfig[payout.status]?.label || payout.status}</span></div>
        <div class="row"><span class="label">Items:</span><span class="value">${payout.items.length}</span></div>
      </div>
      <div class="section">
        <h3>Itemized Breakdown</h3>
        <table>
          <thead><tr><th>Card</th><th>Rarity</th><th>Order</th><th>Buyer</th><th style="text-align:right">Coins</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <div class="total">
        <span class="coins">${payout.coinAmount.toFixed(2)} Coins</span>
        <span class="arrow">&rarr;</span>
        <span class="euros">${payout.euroAmount.toFixed(2)} EUR</span>
        <div style="font-size:12px;color:#999;margin-top:5px;">Exchange rate: 5 Coins = 1 EUR &bull; ${payout.items.length} items</div>
      </div>
      ${payout.adminNotes ? `<div class="section" style="margin-top:20px"><h3>Notes</h3><p>${payout.adminNotes}</p></div>` : ''}
      <div class="signature">
        <div>Shop Owner Signature</div>
        <div>Admin Signature</div>
      </div>
      <div class="footer">
        <p>Pack-Attack GmbH &bull; Generated ${new Date().toLocaleDateString('de-DE')} &bull; This is an official payout document</p>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredPayouts = filterStatus === 'ALL' ? payouts : payouts.filter(p => p.status === filterStatus);

  const stats = {
    total: payouts.length,
    requested: payouts.filter(p => p.status === 'REQUESTED').length,
    processing: payouts.filter(p => p.status === 'PROCESSING').length,
    completed: payouts.filter(p => p.status === 'COMPLETED').length,
    totalPaidEur: payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.euroAmount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total Requests</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.requested}</div>
          <div className="text-xs text-yellow-400">Pending</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
          <div className="text-xs text-blue-400">Approved</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-green-400">Paid</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.totalPaidEur.toFixed(2)}</div>
          <div className="text-xs text-gray-400">Total Paid (EUR)</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === s
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {s === 'ALL' ? 'All' : statusConfig[s]?.label || s}
            {s !== 'ALL' && ` (${payouts.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Payouts List */}
      {filteredPayouts.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No payout requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayouts.map((payout) => {
            const config = statusConfig[payout.status] || statusConfig.REQUESTED;
            const StatusIcon = config.icon;
            const isExpanded = expandedPayout === payout.id;

            return (
              <div key={payout.id} className="glass-strong rounded-xl overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedPayout(isExpanded ? null : payout.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-white">{payout.shop.name}</span>
                          <span className="text-xs text-gray-500">({payout.items.length} items)</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {payout.shop.owner.name || payout.shop.owner.email} • {new Date(payout.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-amber-400">{payout.coinAmount.toFixed(2)}</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-semibold text-green-400">{payout.euroAmount.toFixed(2)} EUR</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-medium ${config.color} ${config.bgColor}`}>
                        {config.label}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-800 p-5 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="glass rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                          <Store className="w-4 h-4" /> Shop Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Shop:</span><span className="text-white">{payout.shop.name}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Owner:</span><span className="text-white">{payout.shop.owner.name || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="text-white">{payout.shop.owner.email}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Tax ID:</span><span className="text-white">{payout.shop.taxId || 'Not provided'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Current Balance:</span><span className="text-amber-400 font-medium">{payout.shop.coinBalance.toFixed(2)} coins</span></div>
                        </div>
                      </div>

                      <div className="glass rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                          <Banknote className="w-4 h-4" /> Payout Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Coins:</span><span className="text-amber-400 font-bold">{payout.coinAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Euro Amount:</span><span className="text-green-400 font-bold">{payout.euroAmount.toFixed(2)} EUR</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Items:</span><span className="text-white font-bold">{payout.items.length}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Rate:</span><span className="text-white">5 coins = 1 EUR</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Requested:</span><span className="text-white">{new Date(payout.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                          {payout.processedAt && <div className="flex justify-between"><span className="text-gray-500">Processed:</span><span className="text-white">{new Date(payout.processedAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>}
                        </div>
                      </div>
                    </div>

                    {/* Itemized Breakdown */}
                    <div className="glass rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Itemized Breakdown ({payout.items.length} items)
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {payout.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
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
                    </div>

                    {/* Shop Message (from resubmission) */}
                    {payout.shopMessage && (
                      <div className="glass rounded-xl p-4 border border-amber-800/30 bg-amber-900/10">
                        <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                          <Store className="w-4 h-4" /> Shop Message
                          {payout.resubmittedAt && (
                            <span className="text-xs text-amber-500/70 font-normal ml-1">
                              (Resubmitted {new Date(payout.resubmittedAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-amber-200/80 whitespace-pre-wrap">{payout.shopMessage}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div className="glass rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Admin Notes
                      </h4>
                      <textarea
                        value={notesInput[payout.id] ?? payout.adminNotes ?? ''}
                        onChange={(e) => setNotesInput({ ...notesInput, [payout.id]: e.target.value })}
                        placeholder="Add notes about this payout..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:border-orange-500 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex gap-2 flex-wrap">
                        {payout.status === 'REQUESTED' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(payout.id, 'PROCESSING')}
                              disabled={updating === payout.id}
                              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                            >
                              {updating === payout.id ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(payout.id, 'COMPLETED')}
                              disabled={updating === payout.id}
                              className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
                            >
                              Mark as Paid
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(payout.id, 'REJECTED')}
                              disabled={updating === payout.id}
                              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {payout.status === 'PROCESSING' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(payout.id, 'COMPLETED')}
                              disabled={updating === payout.id}
                              className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
                            >
                              {updating === payout.id ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                              Mark as Paid
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(payout.id, 'REJECTED')}
                              disabled={updating === payout.id}
                              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handlePrint(payout)}
                        className="px-4 py-2 rounded-xl text-sm font-medium glass text-gray-400 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print Slip
                      </button>
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
