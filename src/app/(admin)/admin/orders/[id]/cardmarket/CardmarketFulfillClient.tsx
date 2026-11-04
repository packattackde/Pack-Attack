'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { runCardmarketAutomation } from '@/lib/cardmarket-automation-client';

export function CardmarketFulfillClient({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState('Starting automation…');

  useEffect(() => {
    void runCardmarketAutomation(orderId).then((r) => {
      if (r.success) {
        setStatus('Cart filled — opening Cardmarket…');
        if (r.cartUrl) window.open(r.cartUrl, '_blank', 'noopener,noreferrer');
      } else {
        setStatus(r.error ?? 'Failed');
      }
    });
  }, [orderId]);

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-sky-400 mx-auto" />
      <p className="text-white">{status}</p>
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-[#8888aa] hover:text-white">
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>
    </div>
  );
}
