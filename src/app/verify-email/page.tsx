'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Mail, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'already-verified';

function VerifyEmailContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerificationStatus>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          if (data.message === 'Email already verified') {
            setStatus('already-verified');
          } else {
            setStatus('success');
          }
        } else {
          if (data.error?.includes('expired')) {
            setStatus('expired');
          } else {
            setStatus('error');
          }
        }
      } catch {
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-[rgba(200,79,255,0.1)] to-purple-500/20">
            <Loader2 className="w-10 h-10 text-[#C84FFF] animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('verify.verifying')}</h2>
          <p className="text-[#8888aa]">{t('verify.verifyingDesc')}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-[#C84FFF]/20 to-[#9333EA]/20">
            <CheckCircle2 className="w-10 h-10 text-[#E879F9]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('verify.verified')}</h2>
          <p className="text-[#8888aa] mb-6">{t('verify.verifiedSuccess')}</p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full py-4 bg-[#C84FFF] hover:bg-[#E879F9] text-white font-semibold rounded-xl transition-all hover:scale-[1.02]"
            >
              {t('verify.signInToAccount')}
            </Link>
            <Link
              href="/boxes"
              className="block w-full py-4 text-[#8888aa] hover:text-white transition-colors"
            >
              {t('verify.browseBoxes')}
            </Link>
          </div>
        </>
      )}

      {status === 'already-verified' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-[rgba(200,79,255,0.1)] to-purple-500/20">
            <CheckCircle2 className="w-10 h-10 text-[#C84FFF]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('verify.alreadyVerified')}</h2>
          <p className="text-[#8888aa] mb-6">{t('verify.alreadyVerifiedMsg')}</p>
          <Link
            href="/login"
            className="block w-full py-4 bg-[#C84FFF] hover:bg-[#E879F9] text-white font-semibold rounded-xl transition-all hover:scale-[1.02]"
          >
            {t('verify.signInToAccount')}
          </Link>
        </>
      )}

      {status === 'expired' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Mail className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('verify.linkExpired')}</h2>
          <p className="text-[#8888aa] mb-6">{t('verify.linkExpiredMsg')}</p>
          <p className="text-sm text-gray-500 mb-4">
            {t('verify.requestNewLink')}
          </p>
          <Link
            href="/login"
            className="block w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02]"
          >
            {t('goToLogin')}
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('verify.failed')}</h2>
          <p className="text-[#8888aa] mb-6">{!token ? t('verify.noToken') : t('verify.failedMsg')}</p>
          <Link
            href="/login"
            className="block w-full py-4 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02]"
          >
            {t('verify.signInToAccount')}
          </Link>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  const t = useTranslations('auth');

  return (
    <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-[rgba(200,79,255,0.1)] to-purple-500/20">
        <Loader2 className="w-10 h-10 text-[#C84FFF] animate-spin" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{t('verify.verifying')}</h2>
      <p className="text-[#8888aa]">{t('verify.pleaseWait')}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations('auth');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] font-display p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 radial-gradient" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold">
              <span className="text-white">PACK </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84FFF] to-[#E879F9]">ATTACK</span>
            </h1>
          </Link>
        </div>

        {/* Card wrapped in Suspense */}
        <Suspense fallback={<LoadingState />}>
          <VerifyEmailContent />
        </Suspense>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#f0f0f5] transition-colors text-sm">
            <Sparkles className="w-4 h-4" />
            {t('layout.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
