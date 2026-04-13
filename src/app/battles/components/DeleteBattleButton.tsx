'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function DeleteBattleButton({ battleId }: { battleId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const t = useTranslations('battles');

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t('deleteBattle.confirmSingle'))) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/battles/${battleId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      }
    } catch {}
    setDeleting(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="shrink-0 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center transition-colors disabled:opacity-40"
      title={t('deleteBattle.deleteSingle')}
    >
      <Trash2 className="w-3.5 h-3.5 text-red-400" />
    </button>
  );
}

export function DeleteAllBattlesButton({ battleIds }: { battleIds: string[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(0);
  const t = useTranslations('battles');

  const handleDeleteAll = async () => {
    if (!confirm(t('deleteBattle.confirmBulk', { count: battleIds.length }))) return;

    setDeleting(true);
    setDeleted(0);
    let count = 0;
    for (const id of battleIds) {
      try {
        const res = await fetch(`/api/battles/${id}`, { method: 'DELETE' });
        if (res.ok) count++;
        setDeleted(count);
      } catch {}
    }
    setDeleting(false);
    router.refresh();
  };

  if (battleIds.length === 0) return null;

  return (
    <button
      onClick={handleDeleteAll}
      disabled={deleting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-3 h-3" />
      {deleting ? t('deleteBattle.progress', { deleted, total: battleIds.length }) : t('deleteBattle.deleteAll', { count: battleIds.length })}
    </button>
  );
}
