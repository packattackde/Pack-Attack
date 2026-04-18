/**
 * Cookie consent helpers — client-only.
 *
 * State lives in both localStorage (long-lived) AND a 1st-party cookie
 * (so the banner doesn't flash on SSR'd pages because middleware/server
 * could read it if ever needed).
 */

export const CONSENT_KEY = 'pa_consent';
export const CONSENT_VERSION = 1; // bump to re-prompt all users

export type ConsentCategories = {
  necessary: true; // always true — can't be turned off
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentState = {
  version: number;
  categories: ConsentCategories;
  consentedAt: string; // ISO timestamp
};

const DEFAULT_STATE: ConsentState = {
  version: CONSENT_VERSION,
  categories: {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  },
  consentedAt: '',
};

export function loadConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(categories: Partial<ConsentCategories>): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    categories: {
      necessary: true,
      functional: Boolean(categories.functional),
      analytics: Boolean(categories.analytics),
      marketing: Boolean(categories.marketing),
    },
    consentedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
      // 1st-party cookie — 1 year, SameSite=Lax, Secure on HTTPS
      const maxAge = 60 * 60 * 24 * 365;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${CONSENT_KEY}=${encodeURIComponent(
        JSON.stringify(state.categories)
      )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
    } catch {
      /* swallow — private mode etc. */
    }
  }
  return state;
}

export function acceptAll(): ConsentState {
  return saveConsent({ functional: true, analytics: true, marketing: true });
}

export function acceptNecessaryOnly(): ConsentState {
  return saveConsent({ functional: false, analytics: false, marketing: false });
}

export function resetConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CONSENT_KEY);
    document.cookie = `${CONSENT_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    /* noop */
  }
}

export function hasConsent(): boolean {
  return loadConsent() !== null;
}

export function getDefaultState(): ConsentState {
  return { ...DEFAULT_STATE };
}
