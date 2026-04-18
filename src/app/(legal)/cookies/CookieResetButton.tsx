'use client';

import { useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { resetConsent } from '@/lib/cookie-consent';

/**
 * Lets the user wipe their stored consent choices so the banner
 * re-appears and they can re-decide.
 */
export function CookieResetButton({ label }: { label: string }) {
  const [done, setDone] = useState(false);

  const handleClick = () => {
    resetConsent();
    setDone(true);
    // Reload so the banner re-appears
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <button
      onClick={handleClick}
      disabled={done}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#C84FFF] to-[#9333EA] text-white text-sm font-bold shadow-[0_4px_16px_rgba(200,79,255,0.3)] hover:shadow-[0_6px_22px_rgba(200,79,255,0.5)] hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {done ? (
        <>
          <Check className="w-4 h-4" />
          OK
        </>
      ) : (
        <>
          <RotateCcw className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}
