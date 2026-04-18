/**
 * Central legal entity data for PullForge.
 *
 * ALL legal/imprint/contact data lives here. Every legal page imports
 * from this file — so you only ever have to update company details
 * in ONE place.
 *
 * ---------------------------------------------------------------------
 * BEFORE GOING LIVE you MUST replace every value prefixed with "TODO:"
 * with the real, commercially-registered data of the operating GmbH.
 * Missing / wrong Impressum data is an abmahnfähiger Verstoß (TMG §5,
 * up to ~1.500 EUR + Anwaltskosten per incident).
 * ---------------------------------------------------------------------
 */

export const LEGAL_ENTITY = {
  // --- Firma (TMG §5 Abs. 1 Nr. 1) ---
  companyName: 'TODO: PullForge GmbH',
  legalForm: 'GmbH' as const,

  // --- Anschrift (TMG §5 Abs. 1 Nr. 1 — ladungsfähig, keine Postfach-Adresse) ---
  street: 'TODO: Musterstraße 1',
  zip: 'TODO: 12345',
  city: 'TODO: Musterstadt',
  country: 'Deutschland',
  countryCode: 'DE',

  // --- Kontakt (TMG §5 Abs. 1 Nr. 2) ---
  email: 'info@pack-attack.de',
  phone: 'TODO: +49 (0) 000 000 000 0',
  // Optional, falls vorhanden:
  fax: null as string | null,

  // --- Handelsregister (TMG §5 Abs. 1 Nr. 4) ---
  registerCourt: 'TODO: Amtsgericht Musterstadt',
  registerNumber: 'TODO: HRB 123456',

  // --- Umsatzsteuer-ID (TMG §5 Abs. 1 Nr. 6) — NICHT die Steuernummer! ---
  vatId: 'TODO: DE999999999',

  // --- Wirtschafts-ID (optional, §5 Abs. 1 Nr. 6 TMG, seit 2024 vergeben) ---
  economicId: null as string | null,

  // --- Geschäftsführung (für GmbH Pflicht) ---
  managingDirectors: ['TODO: Max Mustermann'] as readonly string[],

  // --- Inhaltlich Verantwortlicher nach §18 Abs. 2 MStV ---
  // Für redaktionelle Inhalte (Blog, Tutorials, Ankündigungen etc.).
  // Muss eine natürliche Person mit ladungsfähiger Anschrift sein.
  responsibleForContent: {
    name: 'TODO: Max Mustermann',
    street: 'TODO: Musterstraße 1',
    zip: 'TODO: 12345',
    city: 'TODO: Musterstadt',
  },

  // --- EU-Streitbeilegung (Art. 14 Abs. 1 ODR-VO) ---
  // Link zur OS-Plattform — Pflichtangabe für Online-Händler an Verbraucher.
  odrUrl: 'https://ec.europa.eu/consumers/odr',

  // --- Verbraucherstreitbeilegung (VSBG §36) ---
  // Kleine Händler können "nein" angeben; größere müssen benannte Stelle nennen.
  participatesInVSBG: false,
  vsbgStatement:
    'Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',

  // --- Aufsichtsbehörde (nur wenn erforderlich, z. B. für bestimmte Finanzdienstleistungen) ---
  supervisoryAuthority: null as string | null,

  // --- Berufsrechtliche Angaben (nur für Kammerberufe — hier: n/a) ---
  professionalRegulation: null as {
    chamber: string;
    professionTitle: string;
    awardingState: string;
    rulesUrl: string;
  } | null,

  // --- Brand / Domain ---
  brandName: 'PullForge',
  // NOTE: Currently still hosted on pack-attack.de infrastructure.
  // If you register a new domain (e.g. pullforge.de), update both values here.
  websiteUrl: 'https://pack-attack.de',
  websiteHost: 'pack-attack.de',

  // --- Versions- / Stand-Informationen ---
  // Bei jeder Änderung der Rechtstexte hier hochzählen, damit User sehen,
  // wann sie zuletzt aktualisiert wurden.
  lastUpdated: '2026-04-17',
} as const;

/**
 * Formatted address (one line).
 * Use in Impressum + Datenschutz "Verantwortlicher".
 */
export function formatAddress(): string {
  return `${LEGAL_ENTITY.street}, ${LEGAL_ENTITY.zip} ${LEGAL_ENTITY.city}, ${LEGAL_ENTITY.country}`;
}

/**
 * Hosting provider block — informational only, not legally required
 * but commonly shown in German Impressum for transparency.
 */
export const HOSTING_PROVIDER = {
  name: 'Strato AG',
  street: 'Pascalstraße 10',
  zip: '10587',
  city: 'Berlin',
  country: 'Deutschland',
} as const;
