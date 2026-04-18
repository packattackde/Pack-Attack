import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { LEGAL_ENTITY } from '@/lib/legal-entity';

export const metadata: Metadata = {
  title: 'Versand & Zahlung',
  description:
    'Informationen zu Versandgebieten, Versandkosten, Lieferzeiten und akzeptierten Zahlungsmitteln bei PullForge.',
  alternates: { canonical: '/versand-zahlung' },
};

export default async function VersandZahlungPage() {
  const locale = await getLocale();
  return locale === 'en' ? <EN /> : <DE />;
}

function DE() {
  return (
    <>
      <h1>Versand &amp; Zahlung</h1>
      <p className="text-[#8888aa] text-sm">
        Alle Informationen rund um Bezahlung, Coin-Guthaben und den Versand physischer Karten
        durch unsere Partnerhändler.
      </p>

      <h2>Zahlungsmittel</h2>
      <p>Wir bieten folgende Zahlungsarten an:</p>
      <ul>
        <li>
          <strong>Kredit- und Debitkarten</strong> (Visa, Mastercard, American Express) über
          den Zahlungsdienstleister Stripe;
        </li>
        <li>
          <strong>PayPal</strong> — schnell und sicher über Ihr PayPal-Konto oder als Gast;
        </li>
        <li>
          ggf. weitere im Bezahlvorgang angezeigte lokale Verfahren (SEPA, Apple Pay,
          Google Pay — abhängig vom Endgerät).
        </li>
      </ul>
      <p>
        Die Abrechnung erfolgt in <strong>Euro (EUR)</strong> inklusive der gesetzlichen
        Umsatzsteuer. Der Gesamtbetrag wird Ihnen vor Abschluss des Kaufes transparent
        angezeigt.
      </p>

      <h2>Fälligkeit</h2>
      <p>
        Alle Entgelte sind <strong>sofort mit Vertragsschluss</strong> fällig. Die
        Gutschrift der Coins bzw. die Freischaltung der Pack-Produkte erfolgt nach
        vollständigem Zahlungseingang — in der Regel innerhalb weniger Sekunden.
      </p>

      <h2>Coin-Guthaben</h2>
      <p>
        Coins sind ein <strong>rein digitales Guthaben</strong>, das ausschließlich
        innerhalb der Plattform zum Erwerb von Packs und weiteren Leistungen verwendet werden
        kann. Coins sind <strong>nicht in Euro oder eine andere Währung rücktauschbar</strong>{' '}
        und nicht auf Dritte übertragbar. Details hierzu finden Sie in § 5 unserer{' '}
        <Link href="/agb">AGB</Link>.
      </p>

      <h2>Versand physischer Karten</h2>
      <p>
        PullForge ist Plattformbetreiber; der Versand der tatsächlichen Karten wird von
        einem an die Plattform angeschlossenen <strong>Partnerhändler</strong> im eigenen
        Namen und auf eigene Rechnung durchgeführt.
      </p>

      <h3>Versandgebiete</h3>
      <p>
        Wir bzw. unsere Partnerhändler versenden aktuell innerhalb{' '}
        <strong>Deutschlands</strong> sowie in ausgewählte Länder der{' '}
        <strong>Europäischen Union</strong>. Die verfügbaren Versandgebiete werden im
        Versand-Anforderungs-Dialog angezeigt.
      </p>

      <h3>Versandkosten</h3>
      <p>
        Versandkosten hängen vom Bestellwert, der Anzahl der versendeten Karten und dem
        Zielland ab. Sie werden <strong>vor Abschluss der Versandanforderung</strong>{' '}
        transparent angezeigt. Ab einem bestimmten, im Bestellvorgang genannten Warenwert
        kann der Versand innerhalb Deutschlands versandkostenfrei sein.
      </p>

      <h3>Lieferzeiten</h3>
      <ul>
        <li>
          <strong>Deutschland:</strong> in der Regel 3–5 Werktage ab Versandanforderung;
        </li>
        <li>
          <strong>EU:</strong> in der Regel 5–10 Werktage ab Versandanforderung.
        </li>
      </ul>
      <p>
        Die Lieferzeit beginnt mit der Bestätigung der Versandanforderung durch den
        jeweiligen Partnerhändler. Die Versandfrist verlängert sich um den Zeitraum, den der
        Partnerhändler zur Kommissionierung benötigt (üblich: 1–3 Werktage).
      </p>

      <h3>Verpackung und Transport</h3>
      <p>
        Karten werden in geeigneten, Karten-schonenden Schutzhüllen (z. B. Toploader,
        Card-Saver) verschickt. Ein Versand als versichertes Paket oder als (Groß-)Brief
        wird abhängig vom Warenwert gewählt.
      </p>

      <h3>Gefahrübergang</h3>
      <p>
        Bei Verbraucherkäufen geht die Gefahr des zufälligen Untergangs oder der
        Verschlechterung mit der Übergabe der Sache an den Verbraucher auf diesen über
        (§ 474 Abs. 4 BGB).
      </p>

      <h2>Widerrufsrecht</h2>
      <p>
        Verbraucher haben ein gesetzliches <strong>14-tägiges Widerrufsrecht</strong> für
        versendete physische Karten. Ausnahmen gelten insbesondere für versiegelte Waren
        nach Siegelbruch und für bereits geöffnete Packs (digitale Inhalte, § 356 Abs. 5
        BGB). Details in unserer <Link href="/widerruf">Widerrufsbelehrung</Link>.
      </p>

      <h2>Zahlungssicherheit</h2>
      <p>
        Alle Zahlungsvorgänge werden über TLS/HTTPS verschlüsselt übertragen. Zahlungsdaten
        werden <strong>nie von uns selbst gespeichert</strong>, sondern ausschließlich vom
        jeweiligen Zahlungsdienstleister (Stripe, PayPal) verarbeitet. Weitere Informationen
        zur Verarbeitung Ihrer Zahlungsdaten finden Sie in unserer{' '}
        <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>

      <h2>Kontakt bei Versand- oder Zahlungsfragen</h2>
      <p>
        Bei Fragen oder Problemen zu einer Bestellung wenden Sie sich bitte an unseren
        Support:{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>.
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
      <h1>Shipping &amp; Payment</h1>
      <p className="text-[#8888aa] text-sm italic">
        This English version is provided for convenience. The legally binding text is the
        German version at <Link href="/versand-zahlung">/versand-zahlung</Link>.
      </p>

      <h2>Payment Methods</h2>
      <ul>
        <li>Credit / debit cards (Visa, Mastercard, American Express) via Stripe;</li>
        <li>PayPal — account or guest checkout;</li>
        <li>Additional local methods (SEPA, Apple Pay, Google Pay) as shown at checkout.</li>
      </ul>
      <p>
        All prices are in <strong>Euro (EUR)</strong> and include statutory VAT. Payment is
        due immediately upon conclusion of the contract.
      </p>

      <h2>Coin Balance</h2>
      <p>
        Coins are a <strong>purely digital balance</strong> usable only within the platform.
        Coins cannot be exchanged back into Euro or any other currency and cannot be
        transferred to third parties. See § 5 of our <Link href="/agb">Terms</Link>.
      </p>

      <h2>Shipping of Physical Cards</h2>
      <p>
        PullForge is the platform operator. The physical cards are shipped by a connected{' '}
        <strong>partner retailer</strong> in its own name and on its own account.
      </p>

      <h3>Shipping Regions</h3>
      <p>
        We currently ship within <strong>Germany</strong> and selected countries of the{' '}
        <strong>European Union</strong>. Available regions are shown at checkout.
      </p>

      <h3>Shipping Costs</h3>
      <p>
        Shipping costs depend on order value, number of cards and destination. They are
        shown transparently before the shipping request is confirmed.
      </p>

      <h3>Delivery Times</h3>
      <ul>
        <li><strong>Germany:</strong> typically 3–5 business days;</li>
        <li><strong>EU:</strong> typically 5–10 business days.</li>
      </ul>

      <h3>Packaging</h3>
      <p>
        Cards are shipped in card-safe protective sleeves (toploaders, card savers). Value
        determines whether insured parcel or large letter shipping is used.
      </p>

      <h3>Risk of Loss</h3>
      <p>
        For consumer sales, the risk passes upon hand-over to the consumer (§ 474(4) BGB).
      </p>

      <h2>Right of Withdrawal</h2>
      <p>
        Consumers have a statutory 14-day right of withdrawal for physical goods. Exceptions
        apply to sealed goods after the seal is broken and to opened packs (digital content,
        § 356(5) BGB). See our <Link href="/widerruf">Withdrawal Policy</Link>.
      </p>

      <h2>Payment Security</h2>
      <p>
        All payment transactions are encrypted via TLS/HTTPS. Payment details are never
        stored by us — they are processed exclusively by Stripe / PayPal.
      </p>

      <h2>Contact</h2>
      <p>
        For shipping or payment questions please reach out to{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>.
      </p>

      <hr />

      <p className="text-xs text-[#666680]">
        Last updated: {new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString('en-US')}
      </p>
    </>
  );
}
