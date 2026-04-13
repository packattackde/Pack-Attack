import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get('locale')?.value;
  const locale = locales.includes(cookieLocale as Locale) ? cookieLocale! : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] ${error.message}`);
      } else {
        console.error(`[i18n] ${error.message}`);
      }
    },
    getMessageFallback({ namespace, key }) {
      if (process.env.NODE_ENV === 'development') {
        return `[MISSING: ${namespace}.${key}]`;
      }
      return key;
    },
  };
});
