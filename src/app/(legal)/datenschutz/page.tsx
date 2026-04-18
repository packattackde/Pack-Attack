import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { LEGAL_ENTITY, HOSTING_PROVIDER } from '@/lib/legal-entity';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description:
    'Informationen zur Verarbeitung personenbezogener Daten nach Art. 13 DSGVO sowie § 25 TTDSG.',
  alternates: { canonical: '/datenschutz' },
};

export default async function DatenschutzPage() {
  const locale = await getLocale();
  return locale === 'en' ? <EN /> : <DE />;
}

function DE() {
  return (
    <>
      <h1>Datenschutzerklärung</h1>
      <p className="text-[#8888aa] text-sm">
        Diese Erklärung informiert Sie gemäß Art. 13 und 14 der
        Datenschutz-Grundverordnung (DSGVO) sowie § 25 Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz
        (TDDDG / vormals TTDSG) über Art, Umfang und Zwecke der Verarbeitung
        personenbezogener Daten im Rahmen der Nutzung von{' '}
        <a href={LEGAL_ENTITY.websiteUrl}>{LEGAL_ENTITY.websiteHost}</a>.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlicher im Sinne der DSGVO ist:
        <br />
        <strong>{LEGAL_ENTITY.companyName}</strong>
        <br />
        {LEGAL_ENTITY.street}
        <br />
        {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city}
        <br />
        {LEGAL_ENTITY.country}
        <br />
        E-Mail:{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
        <br />
        Telefon: {LEGAL_ENTITY.phone}
      </p>

      <h2>2. Datenschutzbeauftragter</h2>
      <p>
        Ein Datenschutzbeauftragter ist derzeit nicht bestellt, da die gesetzlichen
        Voraussetzungen nach § 38 BDSG (in der Regel: weniger als 20 Personen, die ständig
        personenbezogene Daten automatisiert verarbeiten) nicht vorliegen. Bei Fragen zum
        Datenschutz wenden Sie sich bitte an die oben angegebene E-Mail-Adresse.
      </p>

      <h2>3. Grundsätze und Rechtsgrundlagen</h2>
      <p>Wir verarbeiten personenbezogene Daten ausschließlich auf Grundlage der DSGVO, insbesondere:</p>
      <ul>
        <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — auf Grundlage Ihrer Einwilligung;</li>
        <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — zur Erfüllung eines Vertrages / vorvertragliche Maßnahmen;</li>
        <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — zur Erfüllung rechtlicher Verpflichtungen (z. B. handels-/steuerrechtliche Aufbewahrungspflichten);</li>
        <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — zur Wahrung unserer berechtigten Interessen (Stabilität und Sicherheit der Plattform, Missbrauchsprävention, Verbesserung der Dienste).</li>
      </ul>

      <h2>4. Verarbeitungstätigkeiten im Überblick</h2>

      <h3>4.1 Server-Logs / Bereitstellung der Website</h3>
      <p>
        Beim Aufruf der Website werden automatisch technische Informationen vom Browser
        übermittelt (IP-Adresse, Datum/Uhrzeit, User-Agent, Referrer, aufgerufene Ressource,
        HTTP-Statuscode). Die Logs werden aus Sicherheitsgründen (Abwehr von Angriffen,
        Fehleranalyse) maximal <strong>14 Tage</strong> aufbewahrt und danach automatisch
        gelöscht.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Stabilität und Sicherheit).
      </p>

      <h3>4.2 Registrierung &amp; Nutzerkonto</h3>
      <p>
        Zur Nutzung kostenpflichtiger Funktionen ist eine Registrierung erforderlich.
        Verarbeitet werden: E-Mail-Adresse, selbstgewählter Benutzername/Anzeigename,
        gesetztes Passwort (nur als Hash, bcrypt), optional Profilbild-URL, Spracheinstellung.
      </p>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
      <p>
        Speicherdauer: bis zur Löschung des Nutzerkontos zuzüglich gesetzlicher
        Aufbewahrungsfristen (i. d. R. 6–10 Jahre für transaktionsbezogene Daten, § 147 AO,
        § 257 HGB).
      </p>

      <h3>4.3 Login via Twitch / Discord (OAuth 2.0)</h3>
      <p>
        Optional können Sie sich über Ihren Twitch- oder Discord-Account anmelden. Bei
        Wahl dieses Verfahrens übermittelt der jeweilige Anbieter uns die technisch
        erforderlichen Profilinformationen (Anbieter-Benutzer-ID, Anzeigename,
        E-Mail-Adresse, ggf. Avatar-URL).
      </p>
      <ul>
        <li>
          <strong>Twitch Interactive, Inc.</strong>, 350 Bush Street, 2nd Floor, San Francisco,
          CA 94104, USA —{' '}
          <a href="https://www.twitch.tv/p/en/legal/privacy-notice/" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung
          </a>
        </li>
        <li>
          <strong>Discord Inc.</strong>, 444 De Haro Street #200, San Francisco, CA 94107,
          USA —{' '}
          <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung
          </a>
        </li>
      </ul>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Durchführung des
        von Ihnen gewählten Login-Verfahrens).
      </p>

      <h3>4.4 Zahlungsabwicklung (Stripe, PayPal)</h3>
      <p>
        Für die Zahlungsabwicklung setzen wir spezialisierte Zahlungsdienstleister ein. Dabei
        verarbeiten wir selbst nur die für die Zuordnung der Zahlung zum jeweiligen
        Nutzerkonto erforderlichen Meta-Daten (Betrag, Datum, Transaktions-ID, Status).
        Konkrete Zahlungsmittel (z. B. Kreditkartennummern) werden von uns nicht gespeichert
        — diese werden ausschließlich beim Zahlungsdienstleister verarbeitet.
      </p>
      <ul>
        <li>
          <strong>Stripe Payments Europe, Ltd.</strong>, 1 Grand Canal Street Lower, Grand
          Canal Dock, Dublin, Irland —{' '}
          <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung
          </a>
          . Übermittlung in die USA erfolgt auf Grundlage des EU-U.S. Data Privacy Framework
          (DPF) sowie Standardvertragsklauseln (Art. 46 DSGVO).
        </li>
        <li>
          <strong>PayPal (Europe) S.à r.l. et Cie, S.C.A.</strong>, 22-24 Boulevard Royal, L-2449
          Luxembourg —{' '}
          <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung
          </a>
          .
        </li>
      </ul>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>

      <h3>4.5 Transaktions-E-Mails (Resend)</h3>
      <p>
        Bestellbestätigungen, Widerrufsbestätigungen, Passwort-Reset-Mails und ähnliche
        transaktionale Nachrichten versenden wir über den Anbieter{' '}
        <strong>Resend Inc.</strong>, 2261 Market Street #5039, San Francisco, CA 94114,
        USA. Verarbeitet werden: E-Mail-Adresse, Inhalt der Nachricht, Zustellungsstatus.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1
        lit. f DSGVO (berechtigtes Interesse an zuverlässiger Zustellung).
        Drittlandübermittlung auf Grundlage des DPF und Standardvertragsklauseln.
      </p>

      <h3>4.6 Versand physischer Karten über Partnerhändler</h3>
      <p>
        Fordern Sie den Versand gezogener Karten an, übermitteln wir die hierfür notwendigen
        Daten (Name, Anschrift, Bestelldetails) an den jeweiligen Partnerhändler, der den
        Versand als eigenverantwortliche Stelle im Sinne des Art. 4 Nr. 7 DSGVO
        durchführt. Der Partnerhändler informiert Sie separat über seine Verarbeitung.
      </p>
      <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>

      <h3>4.7 Chat-Funktion</h3>
      <p>
        Die Plattform bietet eine Chat-Funktion. Hierbei werden Nachrichten, Zeitstempel
        und Nutzerbezug gespeichert. Die Moderation erfolgt automatisiert (Wortfilter) und
        manuell durch geschulte Mitarbeiter.
      </p>
      <p>
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Bereitstellung der
        Chat-Funktion) sowie Art. 6 Abs. 1 lit. f DSGVO (Missbrauchs- und Jugendschutz).
      </p>
      <p>Speicherdauer: bis zu 90 Tage, im Missbrauchsfall bis zum Abschluss der Prüfung.</p>

      <h3>4.8 Technisch notwendige Cookies / Session-Daten</h3>
      <p>
        Wir setzen ausschließlich technisch notwendige Cookies und vergleichbare Techniken
        (z. B. <code>next-auth.session-token</code>, <code>locale</code>, CSRF-Token,{' '}
        <code>pa_consent</code>). Diese sind für die Funktion der Plattform erforderlich und
        bedürfen keiner gesonderten Einwilligung (§ 25 Abs. 2 Nr. 2 TDDDG). Eine Übersicht
        finden Sie unter <Link href="/cookies">Cookie-Einstellungen</Link>.
      </p>

      <h2>5. Drittlandübermittlung</h2>
      <p>
        Einige der eingesetzten Dienste (insbesondere Stripe und Resend) haben ihren
        (Mutter-)Sitz in den USA. Übermittlungen in die USA erfolgen ausschließlich auf
        Grundlage:
      </p>
      <ul>
        <li>
          des <strong>EU-U.S. Data Privacy Framework</strong> (angemessener Schutz nach
          Art. 45 DSGVO, für zertifizierte Anbieter);
        </li>
        <li>
          der <strong>Standardvertragsklauseln</strong> der EU-Kommission (Art. 46 Abs. 2
          lit. c DSGVO), wo erforderlich.
        </li>
      </ul>

      <h2>6. Hosting</h2>
      <p>
        Diese Website wird gehostet bei <strong>{HOSTING_PROVIDER.name}</strong>,{' '}
        {HOSTING_PROVIDER.street}, {HOSTING_PROVIDER.zip} {HOSTING_PROVIDER.city},{' '}
        {HOSTING_PROVIDER.country}. Der Datenbankbetrieb erfolgt auf einem von uns
        angemieteten Server innerhalb der EU. Mit dem Hoster wurde ein Auftragsverarbeitungsvertrag
        gemäß Art. 28 DSGVO geschlossen.
      </p>

      <h2>7. Ihre Rechte als Betroffene(r)</h2>
      <p>Sie haben insbesondere folgende Rechte:</p>
      <ul>
        <li>
          <strong>Art. 15 DSGVO</strong> — Recht auf Auskunft über die verarbeiteten Daten;
        </li>
        <li><strong>Art. 16 DSGVO</strong> — Recht auf Berichtigung unrichtiger Daten;</li>
        <li>
          <strong>Art. 17 DSGVO</strong> — Recht auf Löschung („Recht auf Vergessenwerden");
        </li>
        <li>
          <strong>Art. 18 DSGVO</strong> — Recht auf Einschränkung der Verarbeitung;
        </li>
        <li>
          <strong>Art. 20 DSGVO</strong> — Recht auf Datenübertragbarkeit;
        </li>
        <li>
          <strong>Art. 21 DSGVO</strong> — Recht auf Widerspruch gegen Verarbeitungen, die
          auf Art. 6 Abs. 1 lit. f DSGVO gestützt werden;
        </li>
        <li>
          <strong>Art. 7 Abs. 3 DSGVO</strong> — Recht auf jederzeitigen Widerruf einer
          erteilten Einwilligung mit Wirkung für die Zukunft;
        </li>
        <li>
          <strong>Art. 77 DSGVO</strong> — Beschwerderecht bei einer Aufsichtsbehörde.
          Zuständig ist insbesondere die Aufsichtsbehörde des Bundeslands, in dem Sie Ihren
          gewöhnlichen Aufenthalt haben, oder die des Bundeslands unseres Firmensitzes.
        </li>
      </ul>
      <p>
        Zur Wahrnehmung Ihrer Rechte reicht eine formlose Nachricht an{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>. Wir bearbeiten
        Anfragen innerhalb der gesetzlichen Frist von einem Monat (Art. 12 Abs. 3 DSGVO).
      </p>

      <h2>8. Automatisierte Entscheidungen / Profiling</h2>
      <p>
        Automatisierte Einzelentscheidungen einschließlich Profiling im Sinne des Art. 22
        DSGVO mit rechtlicher Wirkung finden nicht statt.
      </p>

      <h2>9. Datensicherheit</h2>
      <p>
        Wir setzen technische und organisatorische Maßnahmen (TOM) zum Schutz Ihrer Daten
        ein. Die Website wird ausschließlich über TLS/HTTPS ausgeliefert; Passwörter werden
        mit einem starken Hash-Verfahren (bcrypt) gespeichert; die Datenbank ist über
        Firewall-Regeln geschützt.
      </p>

      <h2>10. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den
        aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Dienste
        umzusetzen. Maßgeblich ist die bei Ihrem Besuch abrufbare Fassung.
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
      <h1>Privacy Policy</h1>
      <p className="text-[#8888aa] text-sm italic">
        This English version is provided for convenience. The legally binding text is the
        German Datenschutzerklärung at <Link href="/datenschutz">/datenschutz</Link>.
      </p>

      <h2>1. Controller</h2>
      <p>
        <strong>{LEGAL_ENTITY.companyName}</strong>, {LEGAL_ENTITY.street},{' '}
        {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city}, {LEGAL_ENTITY.country}. Email:{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>.
      </p>

      <h2>2. Data Protection Officer</h2>
      <p>
        No DPO has been appointed as the legal threshold under § 38 BDSG is not met. Privacy
        inquiries should be directed to the email above.
      </p>

      <h2>3. Legal Bases</h2>
      <p>
        We process personal data based on Art. 6(1)(a) consent, (b) contract performance,
        (c) legal obligation, and (f) legitimate interest of the GDPR.
      </p>

      <h2>4. Processing Activities</h2>
      <p>
        <strong>Server logs</strong> (Art. 6(1)(f), stored max. 14 days) — security and
        error analysis.
      </p>
      <p>
        <strong>Account</strong> (Art. 6(1)(b)) — email, display name, hashed password.
        Stored until deletion plus legal retention periods.
      </p>
      <p>
        <strong>OAuth login via Twitch / Discord</strong> (Art. 6(1)(b)) — user ID,
        display name, email provided by the OAuth provider.
      </p>
      <p>
        <strong>Payment processing</strong> via Stripe Payments Europe Ltd. (Ireland) and
        PayPal (Europe) S.à r.l. et Cie, S.C.A. (Luxembourg). Payment credentials are never
        stored by us.
      </p>
      <p>
        <strong>Transactional emails</strong> sent through Resend Inc. (USA, transfers based
        on DPF and SCC).
      </p>
      <p>
        <strong>Card shipping</strong> — necessary data (name, address) are transferred to
        the partner retailer, who acts as an independent controller.
      </p>
      <p>
        <strong>Chat function</strong> (Art. 6(1)(b) + (f)) — messages stored up to 90 days,
        longer if moderation action is required.
      </p>
      <p>
        <strong>Necessary cookies</strong> only (session token, locale, CSRF, consent state).
        See <Link href="/cookies">Cookie Settings</Link>.
      </p>

      <h2>5. International Transfers</h2>
      <p>
        Transfers to the USA are based on the EU-U.S. Data Privacy Framework and, where
        required, EU Standard Contractual Clauses (Art. 46 GDPR).
      </p>

      <h2>6. Hosting</h2>
      <p>
        The website is hosted by <strong>{HOSTING_PROVIDER.name}</strong>,{' '}
        {HOSTING_PROVIDER.city}, {HOSTING_PROVIDER.country}. A data-processing agreement
        under Art. 28 GDPR is in place.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        You have the rights to access (Art. 15), rectification (16), erasure (17),
        restriction (18), data portability (20), objection (21) and to withdraw consent
        (Art. 7(3)) at any time. You may lodge a complaint with a supervisory authority
        (Art. 77).
      </p>

      <h2>8. Automated Decision-Making</h2>
      <p>
        No automated individual decisions or profiling with legal effect under Art. 22 GDPR
        take place.
      </p>

      <h2>9. Data Security</h2>
      <p>
        The site is delivered exclusively over TLS/HTTPS. Passwords are stored using bcrypt.
        The database is protected by firewall rules.
      </p>

      <hr />

      <p className="text-xs text-[#666680]">
        Last updated: {new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString('en-US')}
      </p>
    </>
  );
}
