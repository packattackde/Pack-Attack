'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { useTranslations } from 'next-intl';

type AgeGateModalProps = {
  open: boolean;
  /** Called when the visitor confirms they are 18 or older. */
  onConfirm: () => void;
  /** Where visitors who are under 18 are sent. */
  exitHref?: string;
};

const subscribeNoop = () => () => {};

const PRIMARY_ACTION =
  'flex h-11 w-full items-center justify-center rounded-xl bg-[#ff2ea6] text-sm font-semibold text-white transition-all duration-200 hover:bg-[#E879F9] hover:shadow-[0_0_24px_rgba(255,46,166,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E879F9]';

/**
 * Blocking 18+ confirmation shown before registration.
 * It cannot be dismissed: the visitor has to answer. The overlay stays below
 * the cookie banner (z-[100]) so that banner remains usable.
 */
export function AgeGateModal({ open, onConfirm, exitHref = '/' }: AgeGateModalProps) {
  const t = useTranslations('auth.ageGate');
  const [declined, setDeclined] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Focus the dialog itself rather than a button, so Enter does not answer by accident.
  useEffect(() => {
    if (open && isClient) dialogRef.current?.focus();
  }, [open, isClient, declined]);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 font-display">
      <div className="absolute inset-0 bg-[#05040c]/85 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative max-h-full w-full max-w-[400px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0a1c] p-6 text-center shadow-[0_0_80px_rgba(255,46,166,0.14)] outline-none sm:p-8"
      >
        {declined ? (
          <>
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
              <ShieldX className="h-8 w-8 text-gray-400" />
            </div>
            <h2 id={titleId} className="mb-2 text-xl font-bold text-white">
              {t('deniedTitle')}
            </h2>
            <p id={descriptionId} className="mb-6 text-sm text-gray-400">
              {t('deniedDescription')}
            </p>
            <Link href={exitHref} className={PRIMARY_ACTION}>
              {t('backToHome')}
            </Link>
            <button
              type="button"
              onClick={() => setDeclined(false)}
              className="mt-4 text-xs text-gray-500 underline-offset-2 transition-colors hover:text-gray-300 hover:underline"
            >
              {t('misclick')}
            </button>
          </>
        ) : (
          <>
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff2ea6]/20 bg-[#ff2ea6]/10">
              <span className="text-xl font-black tracking-tight text-[#E879F9]">18+</span>
            </div>
            <h2 id={titleId} className="mb-2 text-xl font-bold text-white">
              {t('title')}
            </h2>
            <p id={descriptionId} className="mb-6 text-sm text-gray-400">
              {t('description')}
            </p>
            <div className="space-y-3">
              <button type="button" onClick={onConfirm} className={PRIMARY_ACTION}>
                {t('confirm')}
              </button>
              <button
                type="button"
                onClick={() => setDeclined(true)}
                className="h-11 w-full rounded-xl border border-white/8 bg-white/4 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E879F9]"
              >
                {t('decline')}
              </button>
            </div>
            <p className="mt-5 text-[11px] leading-relaxed text-gray-500">
              {t.rich('disclaimer', {
                agb: (chunks) => (
                  <Link
                    href="/agb"
                    target="_blank"
                    className="underline underline-offset-2 transition-colors hover:text-gray-300"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
