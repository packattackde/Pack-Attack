'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function AddBotsControl({ battleId, maxSlots }: { battleId: string; maxSlots: number }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [count, setCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const maxAddable = Math.min(maxSlots, 3);

  if (maxSlots <= 0) {
    return (
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-sm text-purple-400">
        Alle Plätze belegt
      </div>
    );
  }

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/battles/${battleId}/bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: 'Fehler', description: data.error, variant: 'destructive' });
        return;
      }
      addToast({ title: 'Bots hinzugefügt', description: `${data.added} Bot(s) beigetreten` });
      router.refresh();
    } catch {
      addToast({ title: 'Fehler', description: 'Bots konnten nicht hinzugefügt werden', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold text-purple-400">Nur Admin — Test-Bots</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#8888aa]">Anzahl:</label>
          <input
            type="number"
            min={1}
            max={maxAddable}
            value={count}
            onChange={(e) => setCount(Math.min(maxAddable, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-16 px-2 py-1 bg-[#12123a] border border-[rgba(255,255,255,0.12)] rounded text-white text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={submitting}
          className="px-4 py-1.5 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center gap-1"
        >
          {submitting ? 'Füge hinzu...' : <><Plus className="w-3 h-3" /> {count} Bot(s) hinzufügen</>}
        </button>
        <span className="text-xs text-[#8888aa]">{maxSlots} Platz/Plätze frei</span>
      </div>
    </div>
  );
}
