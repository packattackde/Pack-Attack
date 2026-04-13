'use server';

import { cookies } from 'next/headers';
import { type Locale, locales, defaultLocale } from './request';

export async function setLocale(locale: string) {
  if (!locales.includes(locale as Locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }
  const store = await cookies();
  store.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}

export async function getLocaleFromCookie(): Promise<Locale> {
  const store = await cookies();
  const val = store.get('locale')?.value;
  return locales.includes(val as Locale) ? (val as Locale) : defaultLocale;
}
