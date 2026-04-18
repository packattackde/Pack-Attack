import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { LEGAL_ENTITY } from '@/lib/legal-entity';

/**
 * Shared layout for all legal pages (Impressum, AGB, Widerruf, Datenschutz,
 * Versand & Zahlung, Cookies). Provides consistent typography, a "last updated"
 * banner and a "back to home" link — matches PullForge dark theme.
 */
export default async function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const t = await getTranslations('legal.common');

  const formattedDate = new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="min-h-screen font-display relative">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container max-w-3xl py-10 sm:py-14">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#8888aa] hover:text-[#C84FFF] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>

        {/* Last updated banner */}
        <div className="mb-8 px-4 py-2.5 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)] text-xs text-[#8888aa]">
          <span className="font-semibold text-[#f0f0f5]">{t('lastUpdated')}:</span>{' '}
          {formattedDate}
        </div>

        {/* Legal content with prose-style typography */}
        <article
          className="
            legal-prose
            text-[#e0e0ec] leading-relaxed
            [&_h1]:text-3xl sm:[&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:text-white [&_h1]:tracking-tight [&_h1]:mb-3
            [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4 [&_p]:text-[#c8c8d8]
            [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_ul>li]:mb-1.5 [&_ul>li]:text-[#c8c8d8]
            [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol>li]:mb-1.5 [&_ol>li]:text-[#c8c8d8]
            [&_a]:text-[#C84FFF] [&_a:hover]:text-[#E879F9] [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:text-white [&_strong]:font-semibold
            [&_code]:bg-[#1a1a4a] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:text-[#E879F9]
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#C84FFF] [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-[#a0a0b8] [&_blockquote]:my-4
            [&_hr]:border-[rgba(255,255,255,0.08)] [&_hr]:my-8
            [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:my-4
            [&_th]:text-left [&_th]:font-semibold [&_th]:text-white [&_th]:bg-[#1a1a4a] [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-[rgba(255,255,255,0.08)]
            [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-[rgba(255,255,255,0.08)] [&_td]:text-[#c8c8d8] [&_td]:align-top
          "
        >
          {children}
        </article>

        {/* Footer note within legal section */}
        <p className="mt-12 pt-6 border-t border-[rgba(255,255,255,0.08)] text-xs text-[#666680]">
          © {new Date().getFullYear()} {LEGAL_ENTITY.companyName} ·{' '}
          <Link href="/impressum" className="hover:text-[#C84FFF] transition-colors">
            {t('imprint')}
          </Link>
        </p>
      </div>
    </div>
  );
}
