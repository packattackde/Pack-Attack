/** ISO / common names → Cardmarket idCountry option label. */
const TO_MKM_LABEL: Record<string, string> = {
  DE: 'Germany',
  D: 'Germany',
  GERMANY: 'Germany',
  AT: 'Austria',
  AUSTRIA: 'Austria',
  FR: 'France',
  FRANCE: 'France',
  IT: 'Italy',
  ITALY: 'Italy',
  ES: 'Spain',
  SPAIN: 'Spain',
  NL: 'Netherlands',
  NETHERLANDS: 'Netherlands',
  BE: 'Belgium',
  BELGIUM: 'Belgium',
  PL: 'Poland',
  POLAND: 'Poland',
  CZ: 'Czech Republic',
  'CZECH REPUBLIC': 'Czech Republic',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  'UNITED KINGDOM': 'United Kingdom',
  US: 'United States',
  USA: 'United States',
  'UNITED STATES': 'United States',
  CH: 'Switzerland',
  SWITZERLAND: 'Switzerland',
};

export function toCardmarketCountryLabel(isoOrName: string): string {
  const key = isoOrName.trim().toUpperCase();
  return TO_MKM_LABEL[key] ?? isoOrName.trim();
}

/** @deprecated use toCardmarketCountryLabel for address forms */
export function toCardmarketCountryOption(isoOrCode: string): string {
  return toCardmarketCountryLabel(isoOrCode);
}
