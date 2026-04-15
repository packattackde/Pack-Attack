'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocale } from '@/i18n/locale';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('language');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    const next = locale === 'de' ? 'en' : 'de';
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-150 text-xs font-medium text-[#8888aa] hover:text-[#f0f0f5] disabled:opacity-50"
      title={t('switchTo')}
      aria-label={t('switchTo')}
    >
      <span className="text-sm">{locale === 'de' ? '🇩🇪' : '🇬🇧'}</span>
      <span className="hidden sm:inline">{locale === 'de' ? t('de') : t('en')}</span>
      <span className="sm:hidden">{locale === 'de' ? 'DE' : 'EN'}</span>
    </button>
  );
}
