'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import deMessages from '../../messages/de.json';
import enMessages from '../../messages/en.json';

const allMessages: Record<string, Record<string, unknown>> = {
  de: deMessages,
  en: enMessages,
};

function getClientLocale(): string {
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === 'de' || htmlLang === 'en') return htmlLang;
  }
  return 'en';
}

function GlobalErrorContent({ onReset }: { onReset: () => void }) {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center border border-[rgba(255,255,255,0.06)]">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-3">{t('somethingWentWrong')}</h1>
        <p className="text-gray-400 mb-6">
          {t('criticalError')}
        </p>
        
        <button
          onClick={onReset}
          className="w-full px-4 py-3 bg-[#C84FFF] hover:bg-[#E879F9] text-white font-semibold rounded-xl transition-all"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    console.error('Global error:', error);
    setLocale(getClientLocale());
  }, [error]);

  const messages = allMessages[locale] || allMessages.en;

  return (
    <html lang={locale}>
      <body className="antialiased bg-[#06061a] text-white">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GlobalErrorContent onReset={() => reset()} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
