'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Users, Coins, Trash2, ChevronRight, Crown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MODE_LABELS: Record<string, string> = {
  LOWEST_CARD: 'Niedrigste Karte',
  HIGHEST_CARD: 'Höchste Karte',
  ALL_CARDS: 'Alle Karten',
};

type Battle = {
  id: string;
  status: string;
  rounds: number;
  battleMode: string;
  maxParticipants: number;
  entryFee: number;
  winnerId: string | null;
  box: { name: string; price: number; imageUrl: string };
  participants: Array<{
    id: string;
    userId: string;
    totalValue: number;
    user: { id: string; name: string | null; email: string; isBot?: boolean };
  }>;
  winner: { id: string; name: string | null; email: string } | null;
};

export function CompletedBattleCard({ battle, isAdmin, visibleParticipants }: {
  battle: Battle;
  isAdmin: boolean;
  visibleParticipants: Battle['participants'];
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const modeLabel = MODE_LABELS[battle.battleMode] || battle.battleMode;
  const isDraw = battle.status === 'FINISHED_DRAW';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        addToast({ title: 'Fehler', description: data.error || 'Löschen fehlgeschlagen', variant: 'destructive' });
        return;
      }
      addToast({ title: 'Gelöscht', description: 'Battle wurde gelöscht' });
      router.refresh();
    } catch {
      addToast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Link
        href={`/battles/${battle.id}`}
        className="group relative bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-lg rounded-2xl p-7 hover:-translate-y-1.5 hover:border-[rgba(191,255,0,0.3)] hover:shadow-[0_8px_30px_rgba(191,255,0,0.1)] transition-all duration-300"
      >
        {isAdmin && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteModal(true); }}
            className="absolute top-4 right-4 p-2 text-[#8888aa] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-[#f0f0f5]">{modeLabel}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isDraw ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {isDraw ? 'Unentschieden' : 'Abgeschlossen'}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#BFFF00] transition-colors line-clamp-1">
          {battle.box.name}
        </h3>

        {isDraw ? (
          <p className="text-sm text-blue-400 mb-4">Unentschieden — Alle behalten ihre Karten</p>
        ) : battle.winner ? (
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-[#BFFF00]" />
            <span className="text-sm text-[#BFFF00] font-medium">{battle.winner.name || 'Gewinner'}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-2 mb-4">
          {visibleParticipants.slice(0, 4).map((p: any, i: number) => (
            <div
              key={p.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BFFF00] to-[#a0d600] flex items-center justify-center text-xs font-bold text-white"
              style={{ marginLeft: i > 0 ? '-6px' : '0' }}
            >
              {p.user.name?.[0] || '?'}
            </div>
          ))}
          <span className="text-sm text-[#8888aa] ml-1">{battle.participants.length} Spieler</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.1)]">
          <span className="text-sm text-[#8888aa]">{battle.rounds} Runden</span>
          <span className="text-[#BFFF00] text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Ergebnisse <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Battle löschen?</h3>
            <p className="text-sm text-[#8888aa] mb-6">
              Du bist dabei, Battle #{battle.id.slice(-6)} zu löschen. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-[#8888aa] hover:text-white transition-colors rounded-lg"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleting ? 'Lösche...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
