/** Cardmarket URL segment per TCG (en/…/Products/Singles). */
export type CardmarketGameSlug =
  | 'Magic'
  | 'FleshAndBlood'
  | 'Pokemon'
  | 'OnePiece'
  | 'Lorcana'
  | 'YuGiOh';

const FAB_PITCH_SUFFIX = /\((?:Red|Yellow|Blue)\)\s*$/i;

/** Infer MKM game from Pullforge card name when DB has no sourceGame on the order line. */
export function inferCardmarketGameSlug(cardName: string): CardmarketGameSlug {
  if (FAB_PITCH_SUFFIX.test(cardName.trim())) {
    return 'FleshAndBlood';
  }
  return 'Magic';
}

export function assertSingleCardmarketGame(
  cardNames: string[]
): CardmarketGameSlug {
  const slugs = new Set(cardNames.map(inferCardmarketGameSlug));
  if (slugs.size > 1) {
    throw new Error(
      'Order mixes different Cardmarket games (e.g. Magic + Flesh and Blood). Fulfill as separate orders.'
    );
  }
  return slugs.values().next().value ?? 'Magic';
}
