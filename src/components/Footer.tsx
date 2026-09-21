import Link from 'next/link';
import { Package, ExternalLink } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LEGAL_ENTITY } from '@/lib/legal-entity';

/**
 * Site-wide footer with legal navigation.
 * Rendered inside the root layout beneath <main>.
 */
export async function Footer() {
  const t = await getTranslations('footer');
  const tLegal = await getTranslations('legal.common');
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="relative border-t border-[rgba(139,92,246,0.25)] bg-[#040310] mt-20"
    >
      <div className="container max-w-6xl py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand — Neon District */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#ff2ea6] to-[#b01c72] flex items-center justify-center shadow-[0_0_16px_rgba(255,46,166,0.7)] font-jp font-black text-base text-white">
                引
              </div>
              <div className="leading-tight">
                <span className="text-lg font-black font-orbitron tracking-wider text-[#eeecf7]">
                  PULL<span className="text-[#ff2ea6] drop-shadow-[0_0_14px_rgba(255,46,166,0.7)]">FORGE</span>
                </span>
                <span className="block text-[0.5rem] font-jp font-normal tracking-[5px] text-[#23e6ff] drop-shadow-[0_0_8px_rgba(35,230,255,0.7)]">
                  プルフォージ
                </span>
              </div>
            </div>
            <p className="text-[#8888aa] text-sm leading-relaxed mb-4 max-w-xs">
              {t('tagline')}
            </p>
            <p className="text-[#666680] text-xs">
              © {year} {LEGAL_ENTITY.companyName}
              <br />
              {LEGAL_ENTITY.street}, {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city}
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[#23e6ff] font-orbitron font-bold text-xs uppercase tracking-[3px] mb-4">
              {t('colLegal')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/impressum"
                  className="text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {tLegal('imprint')}
                </Link>
              </li>
              <li>
                <Link
                  href="/agb"
                  className="text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {tLegal('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/widerruf"
                  className="text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {tLegal('withdrawal')}
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {tLegal('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Service */}
          <div>
            <h3 className="text-[#23e6ff] font-orbitron font-bold text-xs uppercase tracking-[3px] mb-4">
              {t('colService')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/versand-zahlung"
                  className="text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {tLegal('shippingPayment')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {tLegal('cookies')}
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${LEGAL_ENTITY.email}`}
                  className="text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {t('contact')}
                </a>
              </li>
              <li>
                <a
                  href={LEGAL_ENTITY.odrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#c8c8d8] hover:text-[#ff2ea6] transition-colors"
                >
                  {t('odr')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-10 pt-6 border-t border-[rgba(139,92,246,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#666680]">
          <span>{t('disclaimer')}</span>
          <span>
            {t('odrNotice')}{' '}
            <a
              href={LEGAL_ENTITY.odrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#ff2ea6] transition-colors"
            >
              {LEGAL_ENTITY.odrUrl}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
