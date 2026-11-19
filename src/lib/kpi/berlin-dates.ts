import { subDays } from 'date-fns';

export const KPI_TIMEZONE = 'Europe/Berlin';

/** Calendar date YYYY-MM-DD in Europe/Berlin (for chart axis keys). */
export function formatBerlinYmd(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: KPI_TIMEZONE }).format(d);
}

export function buildDayKeys(rangeDays: number): string[] {
  const keys: string[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    keys.push(formatBerlinYmd(subDays(new Date(), i)));
  }
  return keys;
}

/** Postgres `date` columns come back as UTC midnight of that calendar day. */
export function dateKeyFromDb(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** SQL fragment: timestamptz >= start of (today Berlin - (n-1) days). Pass range days as $1. */
export function sqlSinceBerlinDaysAgo(): string {
  return `(((NOW() AT TIME ZONE '${KPI_TIMEZONE}')::date - ($1::int - 1))::timestamp AT TIME ZONE '${KPI_TIMEZONE}')`;
}