import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { LEGAL_ENTITY } from '@/lib/legal-entity';

export const metadata: Metadata = {
  title: 'Widerrufsbelehrung',
  description:
    'Widerrufsbelehrung für Verbraucher gemäß Anlage 1 zu Artikel 246a § 1 Abs. 2 EGBGB.',
  alternates: { canonical: '/widerruf' },
};

export default async function WiderrufPage() {
  const locale = await getLocale();
  return locale === 'en' ? <EN /> : <DE />;
}

function DE() {
  return (
    <>
      <h1>Widerrufsbelehrung</h1>
      <p className="text-[#8888aa] text-sm">
        Verbraucher haben ein 14-tägiges Widerrufsrecht. Die folgenden Informationen und
        Muster entsprechen der Anlage 1 zu Artikel 246a § 1 Abs. 2 EGBGB.
      </p>

      <h2>Widerrufsrecht</h2>
      <p>
        Sie haben das Recht, binnen <strong>vierzehn Tagen</strong> ohne Angabe von Gründen
        diesen Vertrag zu widerrufen.
      </p>
      <p>
        Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag,
      </p>
      <ul>
        <li>
          <strong>bei Warenkäufen</strong> (physischer Kartenversand durch einen
          Partnerhändler), an dem Sie oder ein von Ihnen benannter Dritter, der nicht der
          Beförderer ist, die Waren in Besitz genommen haben bzw. hat;
        </li>
        <li>
          <strong>bei Dienstleistungen und digitalen Inhalten</strong>, an dem der Vertrag
          geschlossen wurde.
        </li>
      </ul>
      <p>
        Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({LEGAL_ENTITY.companyName},{' '}
        {LEGAL_ENTITY.street}, {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city},{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>, Telefon{' '}
        {LEGAL_ENTITY.phone}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post
        versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen,
        informieren. Sie können dafür das unten abgedruckte Muster-Widerrufsformular
        verwenden, das jedoch nicht vorgeschrieben ist.
      </p>
      <p>
        Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die
        Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
      </p>

      <h2>Folgen des Widerrufs</h2>
      <p>
        Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von
        Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen
        Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von
        uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und
        spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung
        über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
      </p>
      <p>
        Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der
        ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde
        ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser
        Rückzahlung Entgelte berechnet.
      </p>
      <p>
        Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben
        oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je
        nachdem, welches der frühere Zeitpunkt ist.
      </p>
      <p>
        Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen
        ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an den
        versendenden Partnerhändler zurückzusenden oder zu übergeben. Die Rücksendeadresse
        teilt Ihnen der Partnerhändler bzw. wir Ihnen auf Anfrage mit.
      </p>
      <p>
        <strong>Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.</strong>
      </p>
      <p>
        Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser
        Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und
        Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
      </p>

      <h2>Ausschluss bzw. vorzeitiges Erlöschen des Widerrufsrechts</h2>
      <p>Das Widerrufsrecht besteht nicht bei Verträgen</p>
      <ul>
        <li>
          zur Lieferung von Waren, die nicht vorgefertigt sind und für deren Herstellung
          eine individuelle Auswahl oder Bestimmung durch den Verbraucher maßgeblich ist
          oder die eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten
          sind;
        </li>
        <li>
          zur Lieferung versiegelter Waren, die aus Gründen des Gesundheitsschutzes oder der
          Hygiene nicht zur Rückgabe geeignet sind, wenn ihre Versiegelung nach der
          Lieferung entfernt wurde.
        </li>
      </ul>
      <p>Das Widerrufsrecht erlischt vorzeitig bei Verträgen</p>
      <ul>
        <li>
          zur Erbringung von Dienstleistungen, wenn wir die Dienstleistung vollständig
          erbracht haben und mit der Ausführung der Dienstleistung erst begonnen haben,
          nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben haben und gleichzeitig Ihre
          Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei vollständiger
          Vertragserfüllung durch uns verlieren;
        </li>
        <li>
          <strong>
            zur Lieferung von nicht auf einem körperlichen Datenträger befindlichen
            digitalen Inhalten, wenn wir mit der Ausführung des Vertrags begonnen haben,
            nachdem Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung des
            Vertrags vor Ablauf der Widerrufsfrist beginnen, und Sie Ihre Kenntnis davon
            bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung des
            Vertrags Ihr Widerrufsrecht verlieren, und wir Ihnen eine Bestätigung nach § 312f
            Abs. 3 BGB zur Verfügung gestellt haben.
          </strong>
        </li>
      </ul>
      <blockquote>
        <strong>Wichtiger Hinweis zum Pack-Opening:</strong> Das Öffnen eines Packs ist eine
        Lieferung digitaler Inhalte im Sinne dieses Ausnahmetatbestands. Mit dem Start des
        Pack-Opening-Vorgangs erklären Sie ausdrücklich Ihre Zustimmung zur sofortigen
        Ausführung und bestätigen, dass Sie mit Beginn der Ausführung Ihr Widerrufsrecht
        verlieren. Vor dem Opening wird Ihnen diese Zustimmung erneut zur Bestätigung
        vorgelegt.
      </blockquote>

      <h2>Muster-Widerrufsformular</h2>
      <p>
        (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus
        und senden Sie es zurück.)
      </p>
      <div
        className="p-4 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)] text-[13px] font-mono whitespace-pre-wrap leading-6"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
      >{`An:
${LEGAL_ENTITY.companyName}
${LEGAL_ENTITY.street}
${LEGAL_ENTITY.zip} ${LEGAL_ENTITY.city}
E-Mail: ${LEGAL_ENTITY.email}

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*)
abgeschlossenen Vertrag über den Kauf der folgenden
Waren (*) / die Erbringung der folgenden Dienst­leistung (*):

_________________________________________________

Bestellt am (*) / erhalten am (*): ____________________

Name des/der Verbraucher(s):       ____________________

Anschrift des/der Verbraucher(s):  ____________________

                                   ____________________

Unterschrift des/der Verbraucher(s) (nur bei Mitteilung
auf Papier):                       ____________________

Datum:                             ____________________

(*) Unzutreffendes streichen.`}</div>

      <hr />

      <p>
        Weitere Informationen zur Rückabwicklung finden Sie in unseren{' '}
        <Link href="/agb">AGB</Link> sowie unter{' '}
        <Link href="/versand-zahlung">Versand &amp; Zahlung</Link>.
      </p>

      <p className="text-xs text-[#666680]">
        Stand: {new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString('de-DE')}
      </p>
    </>
  );
}

function EN() {
  return (
    <>
      <h1>Right of Withdrawal</h1>
      <p className="text-[#8888aa] text-sm italic">
        This English translation is provided for convenience. The legally binding text is the
        German version available at <Link href="/widerruf">/widerruf</Link>.
      </p>

      <h2>Right of Withdrawal</h2>
      <p>
        You have the right to withdraw from this contract within{' '}
        <strong>fourteen days</strong> without giving any reason. The withdrawal period
        expires fourteen days after the day you, or a third party other than the carrier
        indicated by you, acquire physical possession of the goods; for services and
        digital content contracts, from the day the contract was concluded.
      </p>
      <p>
        To exercise your right of withdrawal, you must inform us ({LEGAL_ENTITY.companyName},{' '}
        {LEGAL_ENTITY.street}, {LEGAL_ENTITY.zip} {LEGAL_ENTITY.city},{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>) of your decision
        by an unequivocal statement (e.g. letter sent by post or email).
      </p>

      <h2>Consequences of Withdrawal</h2>
      <p>
        If you withdraw from this contract, we shall reimburse all payments received from
        you, including delivery costs (excluding supplementary costs for a delivery type
        other than the cheapest standard delivery offered), without undue delay and not later
        than fourteen days from the day we receive notice of your withdrawal. The refund
        will use the same means of payment you used for the original transaction unless
        expressly agreed otherwise.
      </p>
      <p>
        You shall return the goods to the shipping partner retailer without undue delay and
        not later than fourteen days from the day you notify us of your withdrawal. You bear
        the direct costs of returning the goods. You are liable only for any diminished
        value resulting from handling that exceeds what is necessary to establish the nature,
        characteristics and functioning of the goods.
      </p>

      <h2>Exceptions / Early Expiry of the Right of Withdrawal</h2>
      <p>The right of withdrawal does not apply to contracts</p>
      <ul>
        <li>
          for sealed goods that are unsuitable for return due to reasons of health or hygiene
          once their seal has been broken;
        </li>
        <li>
          <strong>
            for the supply of digital content not on a tangible medium, if performance began
            with your express consent and acknowledgement that you thereby lose your right of
            withdrawal.
          </strong>
        </li>
      </ul>
      <blockquote>
        <strong>Important note on Pack Opening:</strong> Opening a Pack qualifies as supply
        of digital content. By starting the pack-opening process you expressly consent to
        immediate performance and confirm that you lose your right of withdrawal once
        performance begins.
      </blockquote>

      <h2>Model Withdrawal Form</h2>
      <div
        className="p-4 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)] text-[13px] font-mono whitespace-pre-wrap leading-6"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
      >{`To:
${LEGAL_ENTITY.companyName}
${LEGAL_ENTITY.street}
${LEGAL_ENTITY.zip} ${LEGAL_ENTITY.city}
Email: ${LEGAL_ENTITY.email}

I/We (*) hereby give notice that I/We (*) withdraw
from my/our (*) contract of sale of the following
goods (*) / for the provision of the following
service (*):

_________________________________________________

Ordered on (*) / received on (*):  ____________________

Name of consumer(s):               ____________________

Address of consumer(s):            ____________________

                                   ____________________

Signature of consumer(s) (only if
this form is notified on paper):   ____________________

Date:                              ____________________

(*) Delete as appropriate.`}</div>

      <p className="text-xs text-[#666680]">
        Last updated: {new Date(LEGAL_ENTITY.lastUpdated).toLocaleDateString('en-US')}
      </p>
    </>
  );
}
