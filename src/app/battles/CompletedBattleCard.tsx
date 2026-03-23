'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Users, ChevronRight, Trash2, AlertTriangle, Loader2, Equal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

type Battle = {
  id: string;
  rounds: number;
  battleMode: string;
  shareMode: boolean;
  isDraw?: boolean;
  box: { name: string };
  winner: { id: string; name: string | null; email: string } | null;
  participants: Array<{
    id: string;
    user: { id: string; name: string | null; email: string; isBot?: boolean };
  }>;
};

function getBattleModeLabel(mode: string, shareMode: boolean): string {
  if (shareMode) return 'Share Mode';
  if (mode === 'NORMAL') return 'Normal';
  if (mode === 'UPSIDE_DOWN') return 'Upside-Down';
  if (mode === 'JACKPOT') return 'Jackpot';
  return mode;
}

export function CompletedBattleCard({ 
  battle, 
  isAdmin,
  visibleParticipants 
}: { 
  battle: Battle;
  isAdmin: boolean;
  visibleParticipants: Battle['participants'];
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const modeLabel = getBattleModeLabel(battle.battleMode, battle.shareMode);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to delete battle',
          variant: 'destructive',
        });
        return;
      }

      addToast({
        title: 'Battle Deleted',
        description: 'The battle has been removed successfully.',
      });

      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete battle',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="group glass rounded-2xl p-5 opacity-80 hover:opacity-100 transition-opacity relative">
        {/* Admin Delete Button */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 transition-all z-10"
            title="Delete Battle"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <Link href={`/battles/${battle.id}`} className="block">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#8888aa]">
              {battle.rounds} Round{battle.rounds !== 1 ? 's' : ''}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#12123a]/50 text-[#8888aa]">
              Finished
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#BFFF00] transition-colors line-clamp-1">
            {battle.box.name}
          </h3>
          <p className="text-sm text-gray-500 mb-4">{modeLabel}</p>

          {battle.isDraw ? (
            <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Equal className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">
                Draw — Everyone keeps their cards
              </span>
            </div>
          ) : battle.winner ? (
            <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">
                {battle.winner.name || 'Winner'}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-1 text-[#8888aa]">
              <Users className="w-4 h-4" />
              <span>{visibleParticipants.length} players</span>
            </div>
            <span className="text-[#8888aa] text-sm font-medium group-hover:text-[#BFFF00] group-hover:translate-x-1 transition-all inline-flex items-center gap-1">
              Results <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B2B]/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">Delete Battle?</h2>
            
            <p className="text-[#8888aa] mb-2">
              You are about to delete this battle:
            </p>
            <p className="text-white font-semibold mb-6">
              {battle.box.name} ({battle.rounds} Round{battle.rounds !== 1 ? 's' : ''})
            </p>
            
            <p className="text-red-400 text-sm mb-8">
              ⚠️ This action cannot be undone!
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-6 py-3 rounded-xl font-semibold text-white bg-[#12123a] hover:bg-[#12123a] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Battle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
