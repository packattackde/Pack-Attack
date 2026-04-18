'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, Check, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  acceptAll,
  acceptNecessaryOnly,
  getDefaultState,
  hasConsent,
  saveConsent,
  type ConsentCategories,
} from '@/lib/cookie-consent';

/**
 * Cookie consent banner — TDDDG / GDPR compliant.
 * Appears on first visit. Three primary actions + a details view.
 */
export function CookieConsent() {
  const t = useTranslations('cookieBanner');
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cats, setCats] = useState<ConsentCategories>(
    () => getDefaultState().categories
  );

  useEffect(() => {
    // Delay slightly so SSR/hydration settles and we don't flash
    const id = window.setTimeout(() => {
      if (!hasConsent()) setVisible(true);
    }, 400);
    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;

  const close = () => setVisible(false);

  const handleAcceptAll = () => {
    acceptAll();
    close();
  };

  const handleNecessaryOnly = () => {
    acceptNecessaryOnly();
    close();
  };

  const handleSaveSelection = () => {
    saveConsent({
      functional: cats.functional,
      analytics: cats.analytics,
      marketing: cats.marketing,
    });
    close();
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t('ariaLabel')}
      className="fixed inset-x-0 bottom-0 z-[100] safe-area-padding-bottom"
    >
      <div className="mx-auto max-w-3xl m-3 sm:m-4 rounded-2xl overflow-hidden bg-[#15153d]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.12)] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[rgba(200,79,255,0.15)] flex items-center justify-center">
            <Cookie className="w-5 h-5 text-[#C84FFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base sm:text-lg mb-1">
              {t('title')}
            </h2>
            <p className="text-[#c8c8d8] text-sm leading-relaxed">
              {t('body')}{' '}
              <Link
                href="/datenschutz"
                className="underline underline-offset-2 text-[#C84FFF] hover:text-[#E879F9] transition-colors"
              >
                {t('privacyLinkLabel')}
              </Link>{' '}
              ·{' '}
              <Link
                href="/cookies"
                className="underline underline-offset-2 text-[#C84FFF] hover:text-[#E879F9] transition-colors"
              >
                {t('cookiesLinkLabel')}
              </Link>
            </p>
          </div>
        </div>

        {/* Details (toggleable) */}
        {showDetails && (
          <div className="px-5 pb-3 space-y-2">
            <CategoryRow
              locked
              checked
              label={t('catNecessary')}
              description={t('catNecessaryDesc')}
            />
            <CategoryRow
              checked={cats.functional}
              onChange={(v) => setCats((c) => ({ ...c, functional: v }))}
              label={t('catFunctional')}
              description={t('catFunctionalDesc')}
            />
            <CategoryRow
              checked={cats.analytics}
              onChange={(v) => setCats((c) => ({ ...c, analytics: v }))}
              label={t('catAnalytics')}
              description={t('catAnalyticsDesc')}
            />
            <CategoryRow
              checked={cats.marketing}
              onChange={(v) => setCats((c) => ({ ...c, marketing: v }))}
              label={t('catMarketing')}
              description={t('catMarketingDesc')}
            />
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-2 sm:p-5 sm:pt-2 flex flex-col sm:flex-row gap-2 border-t border-[rgba(255,255,255,0.06)]">
          <button
            onClick={handleNecessaryOnly}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#e0e0ec] bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] transition-colors"
          >
            <ShieldCheck className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t('necessaryOnly')}
          </button>
          {showDetails ? (
            <button
              onClick={handleSaveSelection}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#e0e0ec] bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] transition-colors"
            >
              <Check className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {t('saveSelection')}
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#e0e0ec] bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] transition-colors"
            >
              <Settings className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {t('settings')}
            </button>
          )}
          <button
            onClick={handleAcceptAll}
            className="sm:ml-auto px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide text-white bg-gradient-to-br from-[#C84FFF] to-[#9333EA] shadow-[0_4px_16px_rgba(200,79,255,0.35)] hover:shadow-[0_6px_22px_rgba(200,79,255,0.5)] hover:scale-[1.02] transition-all"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  description,
  checked,
  onChange,
  locked,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl bg-[#0f0f2e]/60 border border-[rgba(255,255,255,0.05)] ${
        locked ? '' : 'cursor-pointer hover:border-[rgba(200,79,255,0.3)]'
      } transition-colors`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 w-4 h-4 accent-[#C84FFF] cursor-pointer disabled:cursor-default"
        aria-label={label}
      />
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm">{label}</div>
        <div className="text-[#8888aa] text-xs mt-0.5">{description}</div>
      </div>
    </label>
  );
}
