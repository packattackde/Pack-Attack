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
      className="relative border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a2a]/80 mt-20"
    >
      <div className="container max-w-6xl py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C84FFF] to-[#9333EA] flex items-center justify-center shadow-[0_4px_12px_rgba(200,79,255,0.3)]">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">
                {LEGAL_ENTITY.brandName}
              </span>
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
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              {t('colLegal')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/impressum"
                  className="text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {tLegal('imprint')}
                </Link>
              </li>
              <li>
                <Link
                  href="/agb"
                  className="text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {tLegal('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/widerruf"
                  className="text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {tLegal('withdrawal')}
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {tLegal('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Service */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              {t('colService')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/versand-zahlung"
                  className="text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {tLegal('shippingPayment')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {tLegal('cookies')}
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${LEGAL_ENTITY.email}`}
                  className="text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {t('contact')}
                </a>
              </li>
              <li>
                <a
                  href={LEGAL_ENTITY.odrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#c8c8d8] hover:text-[#C84FFF] transition-colors"
                >
                  {t('odr')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-10 pt-6 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#666680]">
          <span>{t('disclaimer')}</span>
          <span>
            {t('odrNotice')}{' '}
            <a
              href={LEGAL_ENTITY.odrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#C84FFF] transition-colors"
            >
              {LEGAL_ENTITY.odrUrl}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
