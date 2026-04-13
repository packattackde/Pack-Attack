'use client';

/*
 * InfoTooltip — admin-editable info popover
 *
 * Key naming convention:
 *   battle.create.winCondition   — Battle creation: win condition field
 *   battle.create.rewardMode     — Battle creation: reward mode field
 *   battle.create.rounds         — Battle creation: rounds section
 *   battle.create.entryFee       — Battle creation: entry fee
 *   battle.create.players        — Battle creation: player count
 *   battle.create.visibility     — Battle creation: public/private
 *   pack.open.dropRates          — Pack opening: drop rate column
 *   pack.open.cost               — Pack opening: cost display
 *   pack.open.autoOpen           — Pack opening: auto-open feature
 *   dashboard.stats              — Dashboard: stats widget
 *   dashboard.coinBalance        — Dashboard: coin balance widget
 *   dashboard.achievements       — Dashboard: achievements widget
 *   leaderboard.rankings         — Leaderboard: rankings
 *   collection.overview          — Collection: overview
 *   collection.sellForCoins      — Collection: sell for coins
 *   card.detail.coinValue        — Card detail: coin value
 *   shop.overview                — Shop: overview
 *   boxes.overview               — Boxes: overview
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Info, Pencil, X, Save, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';

type InfoTooltipProps = {
  infoKey: string;
  placement?: 'inline' | 'corner';
  fallback?: string;
  className?: string;
};

export function InfoTooltip({ infoKey, placement = 'inline', fallback, className = '' }: InfoTooltipProps) {
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations('common');
  const isAdmin = session?.user?.role === 'ADMIN';

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [contentDe, setContentDe] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const displayContent = locale === 'de' ? contentDe : contentEn;
  const displayFallback = fallback || '';

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/info-texts/${encodeURIComponent(infoKey)}`);
      if (res.ok) {
        const data = await res.json();
        setContentDe(data.contentDe || '');
        setContentEn(data.contentEn || '');
        setUpdatedAt(data.updatedAt);
      }
    } catch {
      // silent fail, use fallback
    } finally {
      setLoaded(true);
    }
  }, [infoKey]);

  useEffect(() => {
    if (open && !loaded) {
      fetchContent();
    }
  }, [open, loaded, fetchContent]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setEditing(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/info-texts/${encodeURIComponent(infoKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentDe, contentEn }),
      });
      if (res.ok) {
        const data = await res.json();
        setUpdatedAt(data.infoText?.updatedAt || new Date().toISOString());
        setEditing(false);
      }
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  const wrapperClass = placement === 'corner'
    ? `absolute top-2 right-2 z-10 ${className}`
    : `inline-flex items-center ${className}`;

  return (
    <span className={wrapperClass}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-[18px] h-[18px] rounded-full text-[#666688] hover:text-[#8888aa] hover:bg-[rgba(255,255,255,0.06)] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C84FFF]"
        aria-label="More information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl shadow-black/30 overflow-hidden"
          style={{
            top: placement === 'corner' ? '100%' : undefined,
            left: placement === 'corner' ? 'auto' : '50%',
            right: placement === 'corner' ? 0 : undefined,
            transform: placement === 'inline' ? 'translateX(-50%)' : undefined,
          }}
          role="dialog"
          aria-label="Information"
        >
          {editing ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider">{t('editInfo')}</span>
                <button onClick={() => setEditing(false)} className="text-[#666688] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs text-[#8888aa] mb-1">🇩🇪 Deutsch</label>
                <textarea
                  value={contentDe}
                  onChange={e => setContentDe(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-xs text-white bg-[#12123a] border border-[rgba(255,255,255,0.08)] rounded-lg focus:border-[#C84FFF]/40 focus:outline-none resize-y"
                  placeholder="Markdown supported..."
                />
              </div>
              <div>
                <label className="block text-xs text-[#8888aa] mb-1">🇬🇧 English</label>
                <textarea
                  value={contentEn}
                  onChange={e => setContentEn(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-xs text-white bg-[#12123a] border border-[rgba(255,255,255,0.08)] rounded-lg focus:border-[#C84FFF]/40 focus:outline-none resize-y"
                  placeholder="Markdown supported..."
                />
              </div>
              {updatedAt && (
                <p className="text-[10px] text-[#444466]">
                  {t('lastUpdated')} {new Date(updatedAt).toLocaleString()}
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#C84FFF] hover:bg-[#E879F9] rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 text-xs text-[#b0b0cc] leading-relaxed prose-invert prose-xs [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-white [&_ul]:mt-1 [&_ul]:pl-4 [&_li]:mt-0.5 [&_a]:text-[#C84FFF] [&_a]:underline">
                  {!loaded ? (
                    <div className="flex items-center gap-2 text-[#666688]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{t('loading')}</span>
                    </div>
                  ) : displayContent ? (
                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                  ) : displayFallback ? (
                    <p>{displayFallback}</p>
                  ) : (
                    <p className="text-[#444466] italic">{t('noHelpText')}</p>
                  )}
                </div>
                {isAdmin && loaded && (
                  <button
                    onClick={() => setEditing(true)}
                    className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-[#666688] hover:text-[#C84FFF] hover:bg-[rgba(200,79,255,0.1)] transition-all"
                    title="Edit info text"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                <span className="text-[10px] text-[#444466] font-mono">{infoKey}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
