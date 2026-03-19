// JustTCG API utility for searching cards across multiple TCGs
// API Documentation: https://justtcg.com/docs

const JUSTTCG_API_KEY = process.env.JUSTTCG_API_KEY || '';
const JUSTTCG_API_URL = 'https://api.justtcg.com/v1/cards';

// Game identifiers for JustTCG API
export const JUSTTCG_GAMES = {
  mtg: 'magic-the-gathering',
  pokemon: 'pokemon',
  lorcana: 'disney-lorcana',
  onepiece: 'one-piece-card-game',
  yugioh: 'yugioh',
  fleshblood: 'flesh-and-blood-tcg',
} as const;

export type JustTCGGame = keyof typeof JUSTTCG_GAMES;

export interface JustTCGCard {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
  rarity: string;
  imageUrl: string;
  tcgplayerId: string | null;
  price: number | null;
  type: string;
}

export interface JustTCGResponse {
  success: boolean;
  cards?: JustTCGCard[];
  total?: number;
  error?: string;
  message?: string;
}

/**
 * Check if JustTCG API is configured
 */
export function isJustTCGConfigured(): boolean {
  return !!JUSTTCG_API_KEY;
}

/**
 * Resolve a card image URL from available IDs.
 * JustTCG doesn't return images — we construct URLs from game-specific sources.
 */
function resolveCardImage(
  game: JustTCGGame,
  ids: { tcgplayerId?: string | null; scryfallId?: string | null; number?: string | null }
): string {
  const { tcgplayerId, scryfallId, number } = ids;

  switch (game) {
    case 'mtg':
      if (scryfallId) return `https://api.scryfall.com/cards/${scryfallId}?format=image&version=normal`;
      break;

    case 'yugioh':
      if (number) return `https://images.ygoprodeck.com/images/cards/${number}.jpg`;
      break;

    case 'onepiece':
      if (number && number !== 'N/A') {
        return `https://optcgapi.com/media/static/Card_Images/${number}.jpg`;
      }
      break;

    case 'pokemon':
    case 'lorcana':
    case 'fleshblood':
      if (tcgplayerId) return `https://product-images.tcgplayer.com/fit-in/400x558/${tcgplayerId}.jpg`;
      break;
  }

  if (tcgplayerId) {
    return `https://product-images.tcgplayer.com/fit-in/400x558/${tcgplayerId}.jpg`;
  }

  return '';
}

/**
 * Search cards using JustTCG API with retry logic
 */
export async function searchJustTCG(
  game: JustTCGGame,
  query: string,
  limit: number = 20
): Promise<JustTCGResponse> {
  if (!JUSTTCG_API_KEY) {
    return {
      success: false,
      error: 'JustTCG API key not configured',
      message: 'Please set JUSTTCG_API_KEY environment variable',
    };
  }

  const gameId = JUSTTCG_GAMES[game];
  const maxRetries = 2;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `${JUSTTCG_API_URL}?game=${gameId}&q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            'X-API-Key': JUSTTCG_API_KEY,
            'Accept': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`JustTCG API error for ${game}:`, response.status, errorText);
      return {
        success: false,
        error: `JustTCG API error: ${response.status}`,
        message: errorText,
      };
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return {
        success: true,
        cards: [],
        total: 0,
        message: 'No cards found matching your search',
      };
    }

    const cards: JustTCGCard[] = data.data.map((card: any) => {
      const tcgplayerId = card.tcgplayerId;
      const scryfallId = card.scryfallId;
      
      const imageUrl = resolveCardImage(game, { tcgplayerId, scryfallId, number: card.number });
      const price = card.variants?.[0]?.price || null;

      return {
        id: card.id,
        name: card.name || 'Unknown Card',
        setName: card.set_name || '',
        setCode: card.set || '',
        collectorNumber: card.number || '',
        rarity: card.rarity || 'common',
        imageUrl,
        tcgplayerId,
        price,
        type: game,
      };
    });

    return {
      success: true,
      cards: cards,
      total: cards.length,
    };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Only retry on timeout/abort errors
      if (lastError.message.includes('abort') && attempt < maxRetries) {
        console.warn(`JustTCG search timeout for ${game}, retrying (${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }
      
      console.error(`JustTCG search error for ${game}:`, error);
      
      if (lastError.message.includes('abort')) {
        return {
          success: false,
          error: 'Request timeout',
          message: 'The card search took too long. Please try a more specific search term.',
        };
      }

      return {
        success: false,
        error: 'Failed to search cards',
        message: lastError.message,
      };
    }
  }
  
  // All retries exhausted
  return {
    success: false,
    error: 'Request timeout after retries',
    message: 'The card search repeatedly timed out. Please try again later.',
  };
}













