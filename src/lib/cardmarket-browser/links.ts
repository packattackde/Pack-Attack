const DEFAULT_LOCALE = 'en';
const DEFAULT_GAME = 'Magic';

export function cardmarketProductSearchUrl(
  search: string,
  options?: { locale?: string; game?: string }
): string {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const game = options?.game ?? DEFAULT_GAME;
  const q = encodeURIComponent(search.trim());
  return `https://www.cardmarket.com/${locale}/${game}/Products/Singles?searchString=${q}`;
}

export function cardmarketArticleUrl(
  idArticle: number,
  options?: { locale?: string; game?: string }
): string {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const game = options?.game ?? DEFAULT_GAME;
  return `https://www.cardmarket.com/${locale}/${game}/Articles/${idArticle}`;
}

export function cardmarketShoppingCartUrl(options?: { locale?: string; game?: string }): string {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const game = options?.game ?? DEFAULT_GAME;
  return `https://www.cardmarket.com/${locale}/${game}/ShoppingCart`;
}

export function cardmarketShoppingWizardUrl(options?: { locale?: string; game?: string }): string {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const game = options?.game ?? DEFAULT_GAME;
  return `https://www.cardmarket.com/${locale}/${game}/ShoppingWizard`;
}
