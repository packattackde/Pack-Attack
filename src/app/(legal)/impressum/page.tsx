import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { LEGAL_ENTITY, HOSTING_PROVIDER } from '@/lib/legal-entity';

export const metadata: Metadata = {
  title: 'Impressum',
  description:
    'Anbieterkennzeichnung nach § 5 TMG sowie § 18 Medienstaatsvertrag für Pack-Attack.',
  alternates: { canonical: '/impressum' },
};

export default async function ImpressumPage() {
  const locale = await getLocale();
  return locale === 'en' ? <EN /> : <DE />;
}

function DE() {
  return (
    <>
      <h1>Impressum</h1>
      <p className="text-[#8888aa] text-sm">
        Angaben gemäß § 5 Telemediengesetz (TMG) und § 18 Medienstaatsvertrag (MStV).
      </p>

      <h2>Anbieter</h2>
      <p>
        <strong>{LEGAL_ENTITY.companyName}</strong>
        <br />
        {LEGAL_ENTITY.street}
        <br />
        {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city}
        <br />
        {LEGAL_ENTITY.country}
      </p>

      <h2>Vertreten durch</h2>
      <p>
        {LEGAL_ENTITY.legalForm === 'GmbH' ? 'Geschäftsführung' : 'Vertretungsberechtigte(r)'}
        :{' '}
        {LEGAL_ENTITY.managingDirectors.join(', ')}
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail:{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
        <br />
        Telefon: {LEGAL_ENTITY.phone}
        {LEGAL_ENTITY.fax ? (
          <>
            <br />
            Telefax: {LEGAL_ENTITY.fax}
          </>
        ) : null}
      </p>

      <h2>Handelsregister</h2>
      <p>
        Registergericht: {LEGAL_ENTITY.registerCourt}
        <br />
        Registernummer: {LEGAL_ENTITY.registerNumber}
      </p>

      <h2>Umsatzsteuer-Identifikationsnummer</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
        <br />
        {LEGAL_ENTITY.vatId}
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {LEGAL_ENTITY.responsibleForContent.name}
        <br />
        {LEGAL_ENTITY.responsibleForContent.street}
        <br />
        {LEGAL_ENTITY.responsibleForContent.zip}{' '}
        {LEGAL_ENTITY.responsibleForContent.city}
        <br />
        {LEGAL_ENTITY.country}
      </p>

      <h2>EU-Streitbeilegung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
        bereit:{' '}
        <a href={LEGAL_ENTITY.odrUrl} target="_blank" rel="noopener noreferrer">
          {LEGAL_ENTITY.odrUrl}
        </a>
        .
        <br />
        Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>

      <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
      <p>{LEGAL_ENTITY.vsbgStatement}</p>

      <h2>Hosting</h2>
      <p>
        Diese Website wird gehostet bei:
        <br />
        <strong>{HOSTING_PROVIDER.name}</strong>
        <br />
        {HOSTING_PROVIDER.street}, {HOSTING_PROVIDER.zip} {HOSTING_PROVIDER.city},{' '}
        {HOSTING_PROVIDER.country}
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
        Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
        als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
        Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
        rechtswidrige Tätigkeit hinweisen.
      </p>
      <p>
        Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
        allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist
        jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
        Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte
        umgehend entfernen.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
        keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
        Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
        Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum
        Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
        Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
      </p>
      <p>
        Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
        Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
        Rechtsverletzungen werden wir derartige Links umgehend entfernen.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
        unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
        Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
        bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
        Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
        Gebrauch gestattet.
      </p>
      <p>
        Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
        Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
        gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam
        werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
        Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
      </p>

      <h2>Markenrechte und Produktnamen</h2>
      <p>
        Pack-Attack ist eine unabhängige Plattform für den Handel mit Trading-Card-Game-Produkten.
        Genannte Markennamen und Produktbezeichnungen wie <strong>Pokémon</strong>,{' '}
        <strong>Magic: The Gathering</strong>, <strong>Yu-Gi-Oh!</strong>,{' '}
        <strong>One Piece Card Game</strong>, <strong>Disney Lorcana</strong>,{' '}
        <strong>Digimon</strong> und <strong>Flesh &amp; Blood</strong> sind eingetragene
        Marken der jeweiligen Rechteinhaber. Die Nennung dieser Marken dient ausschließlich
        der Produktbeschreibung; eine Partnerschaft oder Sponsoring durch die jeweiligen
        Rechteinhaber besteht nicht.
      </p>
    </>
  );
}

function EN() {
  return (
    <>
      <h1>Legal Notice (Impressum)</h1>
      <p className="text-[#8888aa] text-sm italic">
        This English version is provided for convenience. The legally binding version is the
        German Impressum. For the German original please switch the site language to German.
      </p>

      <h2>Provider</h2>
      <p>
        <strong>{LEGAL_ENTITY.companyName}</strong>
        <br />
        {LEGAL_ENTITY.street}
        <br />
        {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city}
        <br />
        {LEGAL_ENTITY.country}
      </p>

      <h2>Represented by</h2>
      <p>Managing director(s): {LEGAL_ENTITY.managingDirectors.join(', ')}</p>

      <h2>Contact</h2>
      <p>
        Email: <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
        <br />
        Phone: {LEGAL_ENTITY.phone}
      </p>

      <h2>Commercial Register</h2>
      <p>
        Register court: {LEGAL_ENTITY.registerCourt}
        <br />
        Registration number: {LEGAL_ENTITY.registerNumber}
      </p>

      <h2>VAT ID</h2>
      <p>
        VAT identification number according to § 27 a of the German VAT Act:{' '}
        {LEGAL_ENTITY.vatId}
      </p>

      <h2>Responsible for content (§ 18 (2) MStV)</h2>
      <p>
        {LEGAL_ENTITY.responsibleForContent.name}
        <br />
        {LEGAL_ENTITY.responsibleForContent.street}
        <br />
        {LEGAL_ENTITY.responsibleForContent.zip}{' '}
        {LEGAL_ENTITY.responsibleForContent.city}
      </p>

      <h2>EU Dispute Resolution</h2>
      <p>
        The European Commission provides an Online Dispute Resolution (ODR) platform:{' '}
        <a href={LEGAL_ENTITY.odrUrl} target="_blank" rel="noopener noreferrer">
          {LEGAL_ENTITY.odrUrl}
        </a>
        .
      </p>

      <h2>Consumer dispute settlement</h2>
      <p>
        We are neither willing nor obliged to participate in dispute settlement procedures
        before a consumer arbitration board.
      </p>

      <h2>Hosting</h2>
      <p>
        This website is hosted by <strong>{HOSTING_PROVIDER.name}</strong>,{' '}
        {HOSTING_PROVIDER.street}, {HOSTING_PROVIDER.zip} {HOSTING_PROVIDER.city},{' '}
        {HOSTING_PROVIDER.country}.
      </p>

      <h2>Liability disclaimer</h2>
      <p>
        As a service provider, we are responsible for our own content on these pages in
        accordance with general laws. However, we are not obliged to monitor third-party
        information transmitted or stored, nor to investigate circumstances that indicate
        illegal activity. Obligations to remove or block the use of information under general
        laws remain unaffected.
      </p>

      <h2>Trademark notice</h2>
      <p>
        Pack-Attack is an independent platform. Brand names such as{' '}
        <strong>Pokémon</strong>, <strong>Magic: The Gathering</strong>,{' '}
        <strong>Yu-Gi-Oh!</strong>, <strong>One Piece Card Game</strong>,{' '}
        <strong>Disney Lorcana</strong>, <strong>Digimon</strong> and{' '}
        <strong>Flesh &amp; Blood</strong> are registered trademarks of their respective
        owners. Mentioning them serves product description only; no partnership or
        sponsorship is implied.
      </p>
    </>
  );
}
