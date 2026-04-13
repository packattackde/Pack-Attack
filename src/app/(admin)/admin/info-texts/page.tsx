'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Save, Loader2, Pencil, X, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

type InfoTextEntry = {
  id: string;
  key: string;
  contentDe: string;
  contentEn: string;
  updatedAt: string;
  editor: { name: string | null; email: string } | null;
};

export default function AdminInfoTextsPage() {
  const t = useTranslations('admin.infoTextsMgmt');
  const { addToast } = useToast();
  const [infoTexts, setInfoTexts] = useState<InfoTextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDe, setEditDe] = useState('');
  const [editEn, setEditEn] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/info-texts')
      .then(res => res.json())
      .then(data => {
        if (data.infoTexts) setInfoTexts(data.infoTexts);
      })
      .catch(() => addToast({ title: 'Error', description: 'Failed to load info texts', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = infoTexts.filter(t =>
    t.key.toLowerCase().includes(search.toLowerCase()) ||
    t.contentDe.toLowerCase().includes(search.toLowerCase()) ||
    t.contentEn.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (entry: InfoTextEntry) => {
    setEditingKey(entry.key);
    setEditDe(entry.contentDe);
    setEditEn(entry.contentEn);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditDe('');
    setEditEn('');
  };

  const handleSave = async () => {
    if (!editingKey) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/info-texts/${encodeURIComponent(editingKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentDe: editDe, contentEn: editEn }),
      });
      if (res.ok) {
        const data = await res.json();
        setInfoTexts(prev => prev.map(t =>
          t.key === editingKey ? { ...t, contentDe: editDe, contentEn: editEn, updatedAt: data.infoText.updatedAt } : t
        ));
        addToast({ title: 'Saved', description: `Info text "${editingKey}" updated` });
        cancelEdit();
      } else {
        addToast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
      }
    } catch {
      addToast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-10 max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Info className="w-6 h-6 text-[#C84FFF]" />
              Info Texts
            </h1>
            <p className="text-sm text-[#8888aa] mt-1">{infoTexts.length} entries · Edit help texts shown across the app</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666688]" />
          <input
            type="text"
            placeholder="Search by key or content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#666688] focus:border-[#C84FFF]/40 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#C84FFF] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#666688]">
            {search ? 'No matching info texts found' : 'No info texts yet'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(entry => (
              <div key={entry.key} className="bg-[#12123a] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#0e0e2a]">
                  <code className="text-xs text-[#C84FFF] font-mono">{entry.key}</code>
                  <div className="flex items-center gap-3">
                    {entry.updatedAt && (
                      <span className="text-[10px] text-[#444466]">
                        {new Date(entry.updatedAt).toLocaleDateString()} · {entry.editor?.name || entry.editor?.email || '—'}
                      </span>
                    )}
                    <button
                      onClick={() => editingKey === entry.key ? cancelEdit() : startEdit(entry)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#8888aa] hover:text-[#C84FFF] hover:bg-[rgba(200,79,255,0.1)] transition-all"
                    >
                      {editingKey === entry.key ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                      {editingKey === entry.key ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>

                {editingKey === entry.key ? (
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs text-[#8888aa] mb-1">🇩🇪 Deutsch (Markdown)</label>
                      <textarea
                        value={editDe}
                        onChange={e => setEditDe(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 text-xs text-white bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)] rounded-lg focus:border-[#C84FFF]/40 focus:outline-none resize-y font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8888aa] mb-1">🇬🇧 English (Markdown)</label>
                      <textarea
                        value={editEn}
                        onChange={e => setEditEn(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 text-xs text-white bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)] rounded-lg focus:border-[#C84FFF]/40 focus:outline-none resize-y font-mono"
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C84FFF] hover:bg-[#E879F9] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-[#444466] uppercase tracking-wider">DE</span>
                      <p className="text-xs text-[#8888aa] mt-1 line-clamp-3">{entry.contentDe || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#444466] uppercase tracking-wider">EN</span>
                      <p className="text-xs text-[#8888aa] mt-1 line-clamp-3">{entry.contentEn || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
