'use client';

import { SessionProvider } from 'next-auth/react';
import { Component, ReactNode } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';

function ErrorFallbackContent({ onReset }: { onReset: () => void }) {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center border border-[rgba(255,255,255,0.06)]">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{t('somethingWentWrong')}</h1>
        <p className="text-gray-400 mb-6">
          {t('errorOccurred')}
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

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}

class ClientErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Client error caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <NextIntlClientProvider locale={this.props.locale} messages={this.props.messages}>
          <ErrorFallbackContent onReset={this.handleReset} />
        </NextIntlClientProvider>
      );
    }

    return this.props.children;
  }
}

export function Providers({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}) {
  return (
    <ClientErrorBoundary messages={messages} locale={locale}>
      <SessionProvider
        refetchInterval={5 * 60}
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        {children}
      </SessionProvider>
    </ClientErrorBoundary>
  );
}
