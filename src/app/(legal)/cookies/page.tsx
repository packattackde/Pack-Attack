import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { LEGAL_ENTITY } from '@/lib/legal-entity';
import { CookieResetButton } from './CookieResetButton';

export const metadata: Metadata = {
  title: 'Cookie-Einstellungen',
  description:
    'Übersicht über die auf Pack-Attack eingesetzten Cookies und vergleichbaren Techniken, ihre Zwecke, Speicherdauer und Widerrufsmöglichkeit.',
  alternates: { canonical: '/cookies' },
};

type CookieRow = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: 'necessary' | 'functional' | 'analytics' | 'marketing';
};

const COOKIES_DE: CookieRow[] = [
  {
    name: 'next-auth.session-token',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Sitzungs-Cookie für Login / Authentifizierung.',
    duration: '30 Tage',
    type: 'necessary',
  },
  {
    name: 'next-auth.csrf-token',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Schutz gegen Cross-Site-Request-Forgery bei Login-Formularen.',
    duration: 'Sitzung',
    type: 'necessary',
  },
  {
    name: 'next-auth.callback-url',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Merkt die nach Login anzuzeigende Seite.',
    duration: 'Sitzung',
    type: 'necessary',
  },
  {
    name: 'locale',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Speichert die gewählte Sprache (Deutsch / Englisch).',
    duration: '1 Jahr',
    type: 'functional',
  },
  {
    name: 'pa_consent',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Speichert Ihre Cookie-Einwilligungen.',
    duration: '1 Jahr',
    type: 'necessary',
  },
];

const COOKIES_EN: CookieRow[] = [
  {
    name: 'next-auth.session-token',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Session cookie for authentication.',
    duration: '30 days',
    type: 'necessary',
  },
  {
    name: 'next-auth.csrf-token',
    provider: 'Pack-Attack (1st party)',
    purpose: 'CSRF protection for login forms.',
    duration: 'Session',
    type: 'necessary',
  },
  {
    name: 'next-auth.callback-url',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Remembers the page to show after login.',
    duration: 'Session',
    type: 'necessary',
  },
  {
    name: 'locale',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Stores the chosen language (German / English).',
    duration: '1 year',
    type: 'functional',
  },
  {
    name: 'pa_consent',
    provider: 'Pack-Attack (1st party)',
    purpose: 'Stores your cookie consent choices.',
    duration: '1 year',
    type: 'necessary',
  },
];

export default async function CookiesPage() {
  const locale = await getLocale();
  return locale === 'en' ? <EN /> : <DE />;
}

const TYPE_LABELS_DE: Record<CookieRow['type'], string> = {
  necessary: 'Notwendig',
  functional: 'Funktional',
  analytics: 'Statistik',
  marketing: 'Marketing',
};

const TYPE_LABELS_EN: Record<CookieRow['type'], string> = {
  necessary: 'Necessary',
  functional: 'Functional',
  analytics: 'Analytics',
  marketing: 'Marketing',
};

function DE() {
  return (
    <>
      <h1>Cookie-Einstellungen</h1>
      <p className="text-[#8888aa] text-sm">
        Diese Seite zeigt Ihnen, welche Cookies und vergleichbaren Techniken wir auf{' '}
        {LEGAL_ENTITY.websiteHost} einsetzen, zu welchem Zweck und wie lange sie gespeichert
        werden. Weitere Informationen finden Sie in unserer{' '}
        <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>

      <h2>Rechtsgrundlage</h2>
      <p>
        Rechtsgrundlage für den Einsatz <strong>technisch notwendiger Cookies</strong> ist
        § 25 Abs. 2 Nr. 2 TDDDG i.&nbsp;V.&nbsp;m. Art. 6 Abs. 1 lit. b / f DSGVO.
        Für alle nicht notwendigen Cookies (aktuell: keine) holen wir Ihre Einwilligung nach{' '}
        § 25 Abs. 1 TDDDG i.&nbsp;V.&nbsp;m. Art. 6 Abs. 1 lit. a DSGVO ein.
      </p>

      <h2>Aktuell genutzte Cookies</h2>
      <p>
        Pack-Attack setzt aktuell <strong>ausschließlich technisch notwendige und
        funktionale Cookies</strong> ein. Es werden keine Tracking-, Analyse- oder
        Marketing-Cookies geladen.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Anbieter</th>
              <th>Zweck</th>
              <th>Dauer</th>
              <th>Typ</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES_DE.map((c) => (
              <tr key={c.name}>
                <td><code>{c.name}</code></td>
                <td>{c.provider}</td>
                <td>{c.purpose}</td>
                <td>{c.duration}</td>
                <td>{TYPE_LABELS_DE[c.type]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Einwilligung widerrufen / ändern</h2>
      <p>
        Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen oder
        ändern. Dafür können Sie Ihre Cookies in Ihrem Browser löschen oder den folgenden
        Button verwenden, der Ihre aktuellen Einstellungen zurücksetzt.
      </p>
      <CookieResetButton label="Cookie-Einstellungen zurücksetzen" />

      <h2>Browser-Einstellungen</h2>
      <p>
        Sie können in den Einstellungen Ihres Browsers steuern, ob und welche Cookies
        akzeptiert werden. Bitte beachten Sie, dass das Ablehnen <strong>technisch
        notwendiger Cookies</strong> dazu führen kann, dass wesentliche Funktionen der
        Plattform (z. B. Login, Warenkorb) nicht mehr nutzbar sind.
      </p>

      <hr />

      <p className="text-xs text-[#666680]">
        Stand: {new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString('de-DE')}
      </p>
    </>
  );
}

function EN() {
  return (
    <>
      <h1>Cookie Settings</h1>
      <p className="text-[#8888aa] text-sm italic">
        English version for convenience. German at <Link href="/cookies">/cookies</Link>.
      </p>

      <h2>Legal basis</h2>
      <p>
        Strictly necessary cookies are based on § 25(2)(2) TDDDG together with Art. 6(1)(b)/(f)
        GDPR. For any non-essential cookies (currently: none) we obtain your consent under
        § 25(1) TDDDG and Art. 6(1)(a) GDPR.
      </p>

      <h2>Currently used cookies</h2>
      <p>
        Pack-Attack currently uses <strong>only strictly necessary and functional
        cookies</strong>. No tracking, analytics or marketing cookies are loaded.
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Duration</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES_EN.map((c) => (
              <tr key={c.name}>
                <td><code>{c.name}</code></td>
                <td>{c.provider}</td>
                <td>{c.purpose}</td>
                <td>{c.duration}</td>
                <td>{TYPE_LABELS_EN[c.type]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Withdraw / change consent</h2>
      <p>
        You may withdraw or change your consent at any time with effect for the future.
        Clearing your browser cookies or using the button below resets your current settings.
      </p>
      <CookieResetButton label="Reset cookie settings" />

      <h2>Browser settings</h2>
      <p>
        Your browser lets you control which cookies are accepted. Blocking strictly
        necessary cookies may prevent core platform features (login, cart) from working.
      </p>

      <hr />

      <p className="text-xs text-[#666680]">
        Last updated: {new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString('en-US')}
      </p>
    </>
  );
}
