/** ISO 3166-1 alpha-2 → Cardmarket country option value (extend as needed). */
const ISO_TO_MKM_OPTION: Record<string, string> = {
  DE: 'DE',
  AT: 'AT',
  FR: 'FR',
  IT: 'IT',
  ES: 'ES',
  NL: 'NL',
  BE: 'BE',
  PL: 'PL',
  CZ: 'CZ',
  GB: 'GB',
  US: 'US',
  CH: 'CH',
};

export function toCardmarketCountryOption(isoOrCode: string): string {
  const raw = isoOrCode.trim().toUpperCase();
  return ISO_TO_MKM_OPTION[raw] ?? raw;
}
