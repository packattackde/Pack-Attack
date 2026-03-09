import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

// Initialize obscenity matcher once at module level
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// URL regex: detects http(s), www., or domain.tld patterns
const URL_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /www\.[^\s]+/i,
  /[a-zA-Z0-9-]+\.(com|net|org|io|gg|tv|co|me|xyz|dev|app|link|live|stream|info|de|uk|fr|eu|ru|cn|jp|be|nl|at|ch)\b/i,
];

// ASCII art / offensive pattern detection
function containsAsciiArt(content: string): boolean {
  // High ratio of special characters (>40% of a message longer than 15 chars)
  const specialChars = content.replace(/[a-zA-Z0-9\s.,!?'"@#$%&:;+-]/g, '');
  if (specialChars.length > content.length * 0.4 && content.length > 15) return true;

  // Same character repeated 5+ times in a row (e.g. "======", "!!!!!")
  if (/(.)\1{4,}/.test(content)) return true;

  // Known offensive ASCII patterns
  const offensivePatterns = [
    /8=+D/i,
    /\(_\)_\)/,
    /[)(]{4,}/,
    /[|lI]{2,}={2,}D/,
  ];
  if (offensivePatterns.some((p) => p.test(content))) return true;

  return false;
}

/**
 * Filter a chat message for profanity, links, and ASCII art.
 * Admins bypass the link filter but NOT profanity or ASCII art.
 */
export function filterMessage(
  content: string,
  userRole: string,
): { allowed: boolean; reason: string } {
  // 1. Profanity check (all users)
  if (matcher.hasMatch(content)) {
    return { allowed: false, reason: 'Message contains inappropriate language.' };
  }

  // 2. Link check (non-admins only)
  if (userRole !== 'ADMIN') {
    for (const pattern of URL_PATTERNS) {
      if (pattern.test(content)) {
        return { allowed: false, reason: 'Links are not allowed in chat.' };
      }
    }
  }

  // 3. ASCII art check (all users)
  if (containsAsciiArt(content)) {
    return { allowed: false, reason: 'That type of message is not allowed in chat.' };
  }

  return { allowed: true, reason: '' };
}
