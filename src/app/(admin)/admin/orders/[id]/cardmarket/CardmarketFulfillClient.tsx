'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, ShoppingCart, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { CardmarketOrderExport } from '@/lib/cardmarket-browser/export-order';
import { formatShippingClipboard } from '@/lib/cardmarket-browser/export-order';

const LOCAL_BRIDGE = 'http://127.0.0.1:3847';

export function CardmarketFulfillClient({
  orderId,
  exportData,
  orderStatus,
}: {
  orderId: string;
  exportData: CardmarketOrderExport;
  orderStatus: string;
}) {
  const { addToast } = useToast();
  const router = useRouter();
  const [autoRunning, setAutoRunning] = useState(false);

  const copyShipping = async () => {
    const text = formatShippingClipboard(exportData);
    await navigator.clipboard.writeText(text);
    addToast({ title: 'Copied', description: 'Shipping address — paste in Cardmarket cart.' });
  };

  const markProcessing = async () => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PROCESSING' }),
    });
    if (!res.ok) {
      addToast({ title: 'Error', description: 'Could not update order', variant: 'destructive' });
      return;
    }
    addToast({ title: 'Order marked Processing' });
    router.refresh();
  };

  const tryAutoFill = () => {
    setAutoRunning(true);
    const url = `${LOCAL_BRIDGE}/fill/${encodeURIComponent(orderId)}`;
    const tab = window.open(url, '_blank', 'noopener,noreferrer');
    if (!tab) {
      addToast({
        title: 'Pop-up blocked',
        description: `Allow pop-ups or open: ${url}`,
        variant: 'destructive',
      });
    } else {
      addToast({
        title: 'Auto-fill started',
        description: 'Uses your Chrome (npm run cardmarket:chrome-debug). Watch that window.',
      });
    }
    window.setTimeout(() => setAutoRunning(false), 120_000);
  };

  const s = exportData.shipping;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-[#8888aa] hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Cardmarket fulfillment</h1>
        <p className="text-[#8888aa] mt-1">
          Order #{orderId.slice(-8).toUpperCase()} · {exportData.game} · {orderStatus}
        </p>
      </div>

      <div className="rounded-xl border border-sky-500/30 bg-sky-950/40 p-5 space-y-3">
        <h2 className="font-semibold text-sky-200">1. Ship to (customer)</h2>
        <div className="text-sm text-[#c4c4e0] font-mono whitespace-pre-wrap bg-black/30 rounded-lg p-4">
          {s.name}
          {'\n'}
          {s.street}
          {'\n'}
          {s.zip} {s.city}
          {'\n'}
          {s.country}
        </div>
        <button
          type="button"
          onClick={() => void copyShipping()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy address
        </button>
      </div>

      <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#100d22] p-5 space-y-4">
        <h2 className="font-semibold text-white">2. Add cards (your normal browser)</h2>
        <p className="text-sm text-[#8888aa]">
          Open each link while logged in on Cardmarket — no bot check. Pick{' '}
          <strong className="text-white">Germany</strong>, ≥100 sales, cheapest. Put in cart.
        </p>
        <ul className="space-y-3">
          {exportData.items.map((item) => (
            <li key={item.cardName} className="flex flex-wrap items-center gap-3">
              <span className="text-white text-sm font-medium">{item.cardName}</span>
              <a
                href={item.cardmarketSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Search on MKM
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#100d22] p-5 space-y-3">
        <h2 className="font-semibold text-white">3. Cart & pay</h2>
        <a
          href={exportData.cardmarketShoppingCartUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff2ea6] hover:opacity-90 text-white text-sm font-semibold"
        >
          <ShoppingCart className="w-4 h-4" />
          Open shopping cart
        </a>
        <p className="text-xs text-[#8888aa]">
          Choose shipping address → paste copied fields → pay. Then mark order Shipped in Pullforge.
        </p>
        {orderStatus === 'PENDING' && (
          <button
            type="button"
            onClick={() => void markProcessing()}
            className="text-sm text-sky-300 underline"
          >
            Mark as Processing on Pullforge
          </button>
        )}
      </div>

      <details className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5">
        <summary className="cursor-pointer font-semibold text-amber-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Optional: auto-add via your Chrome (CDP)
        </summary>
        <p className="mt-3 text-sm text-amber-100/90">
          Only works with <strong>real Chrome</strong> — not Playwright login. In{' '}
          <code className="text-amber-50">C:\PA\Pack-Attack</code>: run{' '}
          <code className="text-amber-50">npm run cardmarket:chrome-debug</code>, sign in on Cardmarket in
          that window, keep <code className="text-amber-50">npm run cardmarket:local-bridge</code> running,
          then:
        </p>
        <button
          type="button"
          disabled={autoRunning}
          onClick={tryAutoFill}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {autoRunning ? 'Running auto-fill…' : 'Try auto-fill in Chrome'}
        </button>
      </details>
    </div>
  );
}
