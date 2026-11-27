import type messages from '../../messages/de.json';

/**
 * Makes next-intl type-check every `t('some.key')` call against the real
 * message files, so a key that does not exist fails `tsc` / `next build`
 * instead of silently rendering the raw key in production.
 *
 * `de.json` is the reference shape; `npm run i18n:check` guarantees that
 * `en.json` has exactly the same keys.
 */
declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages;
  }
}
