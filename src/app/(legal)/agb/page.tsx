import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { LEGAL_ENTITY } from '@/lib/legal-entity';

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen (AGB)',
  description:
    'Allgemeine Geschäftsbedingungen für die Nutzung der Pack-Attack-Plattform und den Erwerb von Coins sowie den Versand von Trading-Card-Game-Produkten.',
  alternates: { canonical: '/agb' },
};

export default async function AgbPage() {
  const locale = await getLocale();
  return locale === 'en' ? <EN /> : <DE />;
}

function DE() {
  return (
    <>
      <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p className="text-[#8888aa] text-sm">
        der {LEGAL_ENTITY.companyName} für die Plattform{' '}
        <a href={LEGAL_ENTITY.websiteUrl}>{LEGAL_ENTITY.websiteHost}</a>
      </p>

      <h2>§ 1 Geltungsbereich, Vertragspartner, maßgebliche Sprache</h2>
      <p>
        (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle
        Rechtsbeziehungen zwischen der <strong>{LEGAL_ENTITY.companyName}</strong>,{' '}
        {LEGAL_ENTITY.street}, {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city} (nachfolgend
        „Pack-Attack" oder „wir") und den Nutzern der Plattform{' '}
        <a href={LEGAL_ENTITY.websiteUrl}>{LEGAL_ENTITY.websiteHost}</a> (nachfolgend
        „Nutzer" oder „Sie").
      </p>
      <p>
        (2) Die AGB gelten in ihrer zum Zeitpunkt der Registrierung bzw. Bestellung gültigen
        Fassung. Verbraucher im Sinne dieser AGB sind natürliche Personen, mit denen in
        Geschäftsbeziehung getreten wird, ohne dass diesen eine gewerbliche oder
        selbständige berufliche Tätigkeit zugerechnet werden kann (§ 13 BGB). Unternehmer
        sind natürliche oder juristische Personen oder rechtsfähige Personengesellschaften,
        mit denen in Geschäftsbeziehung getreten wird, die in Ausübung einer gewerblichen
        oder selbständigen beruflichen Tätigkeit handeln (§ 14 BGB).
      </p>
      <p>
        (3) Abweichende oder ergänzende Geschäftsbedingungen des Nutzers werden nicht
        Vertragsbestandteil, es sei denn, wir stimmen ihrer Geltung ausdrücklich in
        Textform zu.
      </p>
      <p>
        (4) <strong>Vertragssprache ist Deutsch.</strong> Eine englischsprachige Fassung
        dieser AGB wird zur Information bereitgestellt; bei Abweichungen oder Auslegungs­fragen
        ist ausschließlich die deutsche Fassung maßgeblich.
      </p>

      <h2>§ 2 Leistungsgegenstand</h2>
      <p>
        (1) Pack-Attack betreibt eine Online-Plattform, über die Nutzer:
      </p>
      <ul>
        <li>
          <strong>Coins</strong> (ein rein digitales, im geschlossenen System der Plattform
          verwendbares Guthaben) gegen Entgelt erwerben können;
        </li>
        <li>
          mit diesen Coins den Erwerb und die sofortige digitale Öffnung von{' '}
          <strong>Pack-Produkten</strong> (virtueller Einzelzugriff auf reale
          Trading-Card-Game-Karten) vornehmen können;
        </li>
        <li>
          an <strong>Battle-Modi</strong> teilnehmen können (kompetitive Pack-Openings
          zwischen Nutzern);
        </li>
        <li>
          gezogene Karten entweder zum <strong>Versand</strong> durch einen an die
          Plattform angeschlossenen Partnerhändler anfordern oder gegen Gutschrift weiterer
          Coins zurückgeben können.
        </li>
      </ul>
      <p>
        (2) Pack-Attack tritt bei der Vermittlung des physischen Kartenversands als{' '}
        <strong>Plattformbetreiber und Vermittler</strong> auf. Der Kaufvertrag über die zu
        versendenden Karten kommt zwischen dem Nutzer und dem jeweiligen Partnerhändler
        zustande. Die AGB dieses Partnerhändlers werden bei der Versandanforderung
        ergänzend übermittelt.
      </p>
      <p>
        (3) Pack-Attack ist <strong>kein Glücksspielanbieter</strong> im Sinne des
        Glücksspielstaatsvertrages. Der Erwerb von Coins und die Öffnung eines Packs stellen
        keinen Einsatz im Sinne eines Glücksspiels dar, da dem Nutzer stets ein konkreter,
        sofort verfügbarer digitaler Leistungsanspruch (der Inhalt des geöffneten Packs)
        eingeräumt wird und Coins nicht in Geld zurücktauschbar sind (vgl. § 5 dieser AGB).
      </p>

      <h2>§ 3 Registrierung und Nutzerkonto</h2>
      <p>
        (1) Die Nutzung der kostenpflichtigen Leistungen setzt eine Registrierung voraus.
        Der Nutzer versichert mit der Registrierung, dass er <strong>volljährig</strong>{' '}
        (mindestens 18 Jahre alt) und uneingeschränkt geschäftsfähig ist. Minderjährige
        dürfen die kostenpflichtigen Leistungen nicht nutzen.
      </p>
      <p>
        (2) Die vom Nutzer bei der Registrierung angegebenen Daten müssen wahr, vollständig
        und aktuell sein. Bei einer Änderung ist der Nutzer verpflichtet, die Angaben
        unverzüglich zu aktualisieren.
      </p>
      <p>
        (3) Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem
        Zugriff Dritter zu schützen. Bei begründetem Verdacht einer unbefugten Nutzung ist
        Pack-Attack unverzüglich zu informieren.
      </p>
      <p>
        (4) Pro Person ist nur ein Nutzerkonto zulässig. Mehrfachanmeldungen, die Nutzung
        fremder Identitäten sowie jede Form der Automatisierung (Bots, Skripte) sind
        untersagt.
      </p>

      <h2>§ 4 Vertragsschluss</h2>
      <p>
        (1) Die Darstellung von Coin-Paketen, Pack-Produkten und sonstigen Waren auf der
        Plattform stellt kein rechtlich bindendes Angebot, sondern eine unverbindliche
        Aufforderung zur Abgabe eines Angebots dar (<em>invitatio ad offerendum</em>).
      </p>
      <p>
        (2) Durch Anklicken der Schaltfläche „Kaufen", „Zahlungspflichtig bestellen" oder
        einer vergleichbar bezeichneten Schaltfläche gibt der Nutzer ein verbindliches
        Angebot zum Abschluss eines Kaufvertrages ab.
      </p>
      <p>
        (3) Der Vertrag kommt zustande, sobald Pack-Attack die Annahme erklärt. Die Annahme
        kann durch die Bereitstellung der Leistung (Coin-Gutschrift, Pack-Freischaltung) oder
        durch eine separate Bestellbestätigung per E-Mail erfolgen. Die automatisch
        versandte Eingangsbestätigung stellt noch keine Annahmeerklärung dar.
      </p>
      <p>
        (4) Der Vertragstext wird nach Vertragsschluss von uns gespeichert und dem Nutzer
        per E-Mail übermittelt. Die AGB sind jederzeit unter{' '}
        <Link href="/agb">{LEGAL_ENTITY.websiteHost}/agb</Link> abrufbar.
      </p>

      <h2>§ 5 Coin-System</h2>
      <p>
        (1) Coins sind eine rein digitale, im geschlossenen System der Plattform
        verwendbare Rechengröße. <strong>Sie stellen kein gesetzliches Zahlungsmittel,
        kein E-Geld im Sinne des § 1a ZAG und keine Kryptowährung dar.</strong>
      </p>
      <p>
        (2) Coins können ausschließlich innerhalb der Plattform zum Erwerb der in § 2
        genannten Leistungen verwendet werden. <strong>Ein Anspruch auf Rücktausch von
        Coins in Euro oder eine andere Währung besteht nicht.</strong> Ausgenommen hiervon
        sind gesetzliche Rückzahlungspflichten (z. B. nach wirksamem Widerruf oder
        Rückabwicklung).
      </p>
      <p>
        (3) Coins sind nicht übertragbar und nicht handelbar außerhalb der von der Plattform
        bereitgestellten Funktionen.
      </p>
      <p>
        (4) Der Gegenwert eines Coins in Euro ergibt sich aus dem jeweils aktuellen
        Paketpreis zum Zeitpunkt des Erwerbs und wird vor dem Kauf transparent ausgewiesen.
      </p>
      <p>
        (5) Nicht verbrauchte Coins verfallen <strong>frühestens 36 Monate</strong> nach dem
        letzten entgeltlichen Erwerb, sofern keine Aktivität auf dem Nutzerkonto
        stattgefunden hat. Vor dem Verfall wird der Nutzer per E-Mail hierauf hingewiesen.
      </p>

      <h2>§ 6 Preise, Zahlung, Fälligkeit</h2>
      <p>
        (1) Alle Preise verstehen sich als <strong>Endpreise einschließlich der gesetzlichen
        Umsatzsteuer</strong>. Für Bestellungen innerhalb Deutschlands enthalten die Preise
        die deutsche Umsatzsteuer (derzeit 19 %). Versandkosten werden ggf. gesondert
        ausgewiesen.
      </p>
      <p>
        (2) Zahlbar sind die Entgelte <strong>sofort mit Vertragsschluss</strong>. Die
        Leistung (Coin-Gutschrift bzw. Pack-Freischaltung) erfolgt nach vollständigem
        Zahlungseingang.
      </p>
      <p>
        (3) Als Zahlungsarten stehen insbesondere zur Verfügung:
      </p>
      <ul>
        <li>Kredit- und Debitkarten über Stripe Payments Europe, Ltd.;</li>
        <li>PayPal über die PayPal (Europe) S.à r.l. et Cie, S.C.A.;</li>
        <li>weitere gegebenenfalls im Bezahlvorgang angezeigte Verfahren.</li>
      </ul>
      <p>
        (4) Bei Zahlung über einen Zahlungsdienstleister gelten zusätzlich dessen Bedingungen.
        Ein etwaiger Chargeback bei Kreditkartenzahlungen oder Rücklastschriften entbindet
        nicht von der Pflicht zur Zahlung bereits in Anspruch genommener Leistungen.
      </p>

      <h2>
        § 7 Pack-Opening — Ausschluss des Widerrufsrechts bei digitaler Sofortausführung
      </h2>
      <p>
        (1) Das Öffnen eines Packs stellt die Inanspruchnahme einer{' '}
        <strong>digitalen Dienstleistung bzw. digitaler Inhalte</strong> im Sinne des{' '}
        § 356 Abs. 5 BGB dar.
      </p>
      <p>
        (2) Mit dem Start des Pack-Opening-Vorgangs <strong>verlangt der Nutzer
        ausdrücklich die sofortige Ausführung</strong> und bestätigt, dass er{' '}
        <strong>mit dem Beginn der Ausführung sein Widerrufsrecht verliert</strong>. Diese
        Zustimmung wird dokumentiert und die Ausführung erst nach Bestätigung gestartet.
      </p>
      <p>
        (3) Der Nutzer erhält nach Öffnung eine unveränderliche digitale Aufzeichnung des
        Pack-Ergebnisses in seinem Konto. Diese Aufzeichnung bildet die Grundlage einer
        etwaigen späteren Versandanforderung.
      </p>
      <p>
        (4) Die gezogenen Karten werden dem Nutzerkonto als digitaler Bestandsnachweis
        gutgeschrieben. Der Nutzer kann wählen, ob er die Originale zugesendet bekommt
        (physischer Versand, § 8) oder zum aktuellen Sellback-Kurs gegen Coins-Gutschrift
        zurückgibt.
      </p>

      <h2>§ 8 Versand realer Karten durch Partnerhändler</h2>
      <p>
        (1) Fordert der Nutzer den physischen Versand einer im Konto gutgeschriebenen Karte
        an, wird der Versandauftrag an den für das jeweilige Produkt zuständigen{' '}
        <strong>Partnerhändler</strong> weitergeleitet. Der Partnerhändler versendet die
        Karte im eigenen Namen und auf eigene Rechnung.
      </p>
      <p>
        (2) Die Lieferfrist beträgt in der Regel 3–10 Werktage ab Versandanforderung. Konkrete
        Versandzeiten und Versandkosten sind unter{' '}
        <Link href="/versand-zahlung">Versand &amp; Zahlung</Link> einsehbar.
      </p>
      <p>
        (3) <strong>Eigentumsvorbehalt:</strong> Bis zur vollständigen Bezahlung bleibt die
        gelieferte Ware Eigentum des Partnerhändlers.
      </p>
      <p>
        (4) Das gesetzliche Widerrufsrecht für den physischen Versand bleibt unberührt und
        ist in der <Link href="/widerruf">Widerrufsbelehrung</Link> geregelt.
      </p>

      <h2>§ 9 Gewährleistung, Sachmängelhaftung</h2>
      <p>
        (1) Für gelieferte physische Waren gelten die gesetzlichen Regelungen der §§ 434,
        437 BGB. Die Gewährleistungsfrist für neue Sachen beträgt zwei Jahre ab Übergabe,
        bei gebrauchten Sachen ein Jahr.
      </p>
      <p>
        (2) Für digitale Leistungen (Coin-Gutschriften, Pack-Öffnungen) gelten die §§ 327
        ff. BGB.
      </p>
      <p>
        (3) Offensichtliche Transport- oder Lieferschäden sind bei Kaufleuten unverzüglich
        beim Zusteller bzw. Partnerhändler anzuzeigen. Unterlassene Anzeigen haben für die
        gesetzlichen Gewährleistungsansprüche von Verbrauchern keine Folgen.
      </p>

      <h2>§ 10 Haftung</h2>
      <p>
        (1) Pack-Attack haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des
        Körpers oder der Gesundheit, die auf einer fahrlässigen oder vorsätzlichen
        Pflichtverletzung von uns, unseren gesetzlichen Vertretern oder Erfüllungsgehilfen
        beruhen, sowie für sonstige Schäden, die auf einer vorsätzlichen oder grob
        fahrlässigen Pflichtverletzung beruhen, und für Schäden, für die eine Haftung nach
        dem Produkthaftungsgesetz zwingend vorgeschrieben ist.
      </p>
      <p>
        (2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Kardinalpflichten)
        ist die Haftung auf den bei Vertragsschluss vorhersehbaren, vertragstypischen
        Schaden begrenzt. Kardinalpflichten sind solche Pflichten, deren Erfüllung die
        ordnungsgemäße Durchführung des Vertrages überhaupt erst ermöglicht und auf deren
        Einhaltung der Vertragspartner regelmäßig vertrauen darf.
      </p>
      <p>
        (3) Eine weitergehende Haftung besteht nicht.
      </p>
      <p>
        (4) Die Haftung für vorübergehende Nichtverfügbarkeit der Plattform aufgrund
        technischer Wartung, höherer Gewalt oder Störungen bei Dritten (z. B.
        Zahlungsdienstleister, Hoster) ist ausgeschlossen, soweit kein grobes Verschulden
        vorliegt.
      </p>

      <h2>§ 11 Nutzerpflichten, Missbrauch, Sperrung</h2>
      <p>
        (1) Der Nutzer verpflichtet sich, die Plattform nicht zu missbrauchen, insbesondere:
      </p>
      <ul>
        <li>keine gesetzlichen Vorschriften oder Rechte Dritter zu verletzen;</li>
        <li>
          keine Sicherheitsmechanismen zu umgehen, keine Automatisierung (Bots, Scraping,
          Reverse Engineering) einzusetzen;
        </li>
        <li>
          keine Zahlungen unter Verwendung unrechtmäßiger Mittel (gestohlene Karten,
          unberechtigte Kontozugriffe) vorzunehmen;
        </li>
        <li>
          im Chat- und Battle-System keine beleidigenden, diskriminierenden, jugendgefährdenden,
          pornografischen oder sonst rechtswidrigen Inhalte zu verbreiten.
        </li>
      </ul>
      <p>
        (2) Verstößt der Nutzer schuldhaft und trotz Aufforderung zur Unterlassung gegen
        Absatz 1, können wir sein Konto temporär sperren oder nach Abmahnung dauerhaft
        schließen. Ein etwaiges noch vorhandenes Coin-Guthaben wird in begründeten
        Ausnahmefällen (z. B. nachgewiesener Betrug) einbehalten.
      </p>
      <p>
        (3) Weitergehende gesetzliche Ansprüche (insbesondere Schadensersatz, Unterlassung)
        bleiben unberührt.
      </p>

      <h2>§ 12 Änderungen der AGB</h2>
      <p>
        (1) Wir behalten uns vor, diese AGB mit Wirkung für die Zukunft zu ändern, soweit
        dies aus triftigen Gründen, insbesondere aufgrund einer geänderten Rechtslage oder
        höchstrichterlicher Rechtsprechung, technischer Änderungen oder der Einführung
        neuer Funktionen erforderlich wird.
      </p>
      <p>
        (2) Über Änderungen werden angemeldete Nutzer mindestens sechs Wochen vor
        Inkrafttreten in Textform (E-Mail) informiert. Widerspricht der Nutzer nicht
        innerhalb von sechs Wochen nach Zugang der Mitteilung, gilt die Änderung als
        genehmigt. Auf dieses Widerspruchsrecht und die Folgen des Schweigens wird in der
        Mitteilung gesondert hingewiesen.
      </p>
      <p>
        (3) Widerspricht der Nutzer fristgerecht, sind beide Parteien berechtigt, das
        Nutzungsverhältnis außerordentlich zu kündigen. Bestehende Coin-Guthaben werden in
        diesem Fall nach Rücksprache erstattet.
      </p>

      <h2>§ 13 Schlussbestimmungen, anwendbares Recht, Gerichtsstand</h2>
      <p>
        (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
        UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur insoweit, als dem
        Verbraucher nicht der Schutz zwingender Bestimmungen des Rechts des Staates
        entzogen wird, in dem er seinen gewöhnlichen Aufenthalt hat (Art. 6 Rom-I-VO).
      </p>
      <p>
        (2) Ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang
        mit dem Vertragsverhältnis ist, sofern der Nutzer Kaufmann, juristische Person des
        öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist, der Sitz der{' '}
        {LEGAL_ENTITY.companyName}. Bei Verbrauchern bestimmt sich der Gerichtsstand nach
        den gesetzlichen Vorschriften.
      </p>
      <p>
        (3) <strong>Salvatorische Klausel:</strong> Sollten einzelne Bestimmungen dieser AGB
        unwirksam oder undurchführbar sein oder werden, so wird hiervon die Wirksamkeit der
        übrigen Bestimmungen nicht berührt. An die Stelle der unwirksamen Bestimmung tritt
        die gesetzliche Regelung.
      </p>

      <h2>§ 14 Hinweise zur Streitbeilegung</h2>
      <p>
        (1) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
        unter{' '}
        <a href={LEGAL_ENTITY.odrUrl} target="_blank" rel="noopener noreferrer">
          {LEGAL_ENTITY.odrUrl}
        </a>{' '}
        bereit.
      </p>
      <p>(2) {LEGAL_ENTITY.vsbgStatement}</p>

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
      <h1>Terms and Conditions (AGB)</h1>
      <p className="text-[#8888aa] text-sm italic">
        This English translation is provided for convenience. The legally binding version of
        these Terms is the German version available under{' '}
        <Link href="/agb">/agb</Link>. In the event of any discrepancy, the German text
        prevails.
      </p>

      <h2>§ 1 Scope, Parties, Governing Language</h2>
      <p>
        These Terms govern all legal relationships between{' '}
        <strong>{LEGAL_ENTITY.companyName}</strong> (&quot;Pack-Attack&quot;, &quot;we&quot;) and users of the
        platform <a href={LEGAL_ENTITY.websiteUrl}>{LEGAL_ENTITY.websiteHost}</a>. Consumers
        within the meaning of these Terms are natural persons acting for purposes outside
        their trade or profession (§ 13 German Civil Code, BGB). The governing language is
        German.
      </p>

      <h2>§ 2 Services</h2>
      <p>
        Pack-Attack operates a platform on which users may (i) purchase{' '}
        <strong>Coins</strong> (a purely digital, closed-loop balance usable only within the
        platform), (ii) use Coins to purchase and immediately open <strong>Pack products</strong>,
        (iii) participate in competitive <strong>Battles</strong>, and (iv) request physical
        shipping of the pulled trading cards through a partner retailer, or sell them back
        for Coin credit.
      </p>
      <p>
        Pack-Attack acts as platform operator and intermediary. The contract for shipping
        physical cards is concluded between the user and the respective partner retailer.
      </p>

      <h2>§ 3 Registration, Age</h2>
      <p>
        Use of paid services requires registration. The user confirms being at least{' '}
        <strong>18 years old</strong> and having full legal capacity.
      </p>

      <h2>§ 4 Conclusion of Contract</h2>
      <p>
        The display of Coin packages and Packs on the platform is an invitation to offer.
        The user makes a binding offer by clicking &quot;Buy&quot; / &quot;Order with obligation to pay&quot;.
        The contract is concluded upon our acceptance, either by providing the service or by
        sending a confirmation email.
      </p>

      <h2>§ 5 Coin System</h2>
      <p>
        Coins are a purely digital, closed-loop accounting unit. They are not legal tender,
        not e-money within the meaning of § 1a ZAG and not a cryptocurrency. Coins can only
        be used within the platform. <strong>There is no right to exchange Coins back into
        Euro or any other currency.</strong> Statutory refund obligations remain unaffected.
      </p>

      <h2>§ 6 Prices, Payment</h2>
      <p>
        All prices include statutory VAT. Payment is due immediately upon conclusion of the
        contract via Stripe, PayPal or other methods shown during checkout.
      </p>

      <h2>§ 7 Pack Opening — Waiver of Right of Withdrawal</h2>
      <p>
        Opening a Pack is the provision of digital content within the meaning of § 356 (5)
        BGB. By starting the opening process, the user <strong>expressly requests immediate
        performance and acknowledges losing the right of withdrawal</strong> once performance
        begins. This consent is logged before execution.
      </p>

      <h2>§ 8 Shipping of Physical Cards</h2>
      <p>
        Shipping is performed by the respective partner retailer in its own name and on its
        own account. Delivery typically takes 3–10 business days. Details are available under{' '}
        <Link href="/versand-zahlung">Shipping &amp; Payment</Link>. Title passes upon full
        payment.
      </p>

      <h2>§ 9 Statutory Warranty</h2>
      <p>
        The statutory warranty rules of §§ 434, 437 BGB apply. The warranty period for new
        goods is two years from delivery; for used goods, one year.
      </p>

      <h2>§ 10 Liability</h2>
      <p>
        We are liable without limitation for damages resulting from injury to life, body or
        health caused by our negligent or intentional breach of duty, as well as for damages
        caused by intent or gross negligence. For slightly negligent breach of material
        contractual obligations (so-called cardinal duties), liability is limited to the
        foreseeable, typical damage. Further liability is excluded to the extent legally
        permissible.
      </p>

      <h2>§ 11 User Obligations, Abuse, Account Suspension</h2>
      <p>
        Users shall refrain from any abusive behaviour including violating laws, circumventing
        security mechanisms, using bots/scraping, making payments with illegal means, or
        distributing offensive content. Breaches may lead to temporary or permanent account
        suspension after prior warning.
      </p>

      <h2>§ 12 Changes to the Terms</h2>
      <p>
        We may amend these Terms with effect for the future. Registered users are notified at
        least six weeks before changes take effect. Silence for six weeks is deemed consent;
        users are explicitly informed of this in the notification.
      </p>

      <h2>§ 13 Final Provisions, Governing Law, Jurisdiction</h2>
      <p>
        German law applies, excluding the UN Convention on Contracts for the International
        Sale of Goods. Consumers retain the protection of the mandatory law of their habitual
        residence. Exclusive place of jurisdiction for merchants is the registered seat of{' '}
        {LEGAL_ENTITY.companyName}. A severability clause applies.
      </p>

      <h2>§ 14 Dispute Resolution</h2>
      <p>
        The EU Commission provides an ODR platform at{' '}
        <a href={LEGAL_ENTITY.odrUrl} target="_blank" rel="noopener noreferrer">
          {LEGAL_ENTITY.odrUrl}
        </a>
        . We do not participate in consumer arbitration proceedings.
      </p>

      <hr />

      <p className="text-xs text-[#666680]">
        Last updated: {new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString('en-US')}
      </p>
    </>
  );
}
