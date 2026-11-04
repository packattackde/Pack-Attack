import crypto from 'crypto';

const COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

function getSecretOrNull(): string | null {
  return process.env.NEXTAUTH_SECRET?.trim() || null;
}

function requireSecret(): string {
  const secret = getSecretOrNull();
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for OAuth account linking');
  }
  return secret;
}

/** Signed token stored in link cookies (userId + expiry). */
export function createOAuthLinkToken(userId: string): string {
  const exp = Date.now() + COOKIE_MAX_AGE_MS;
  const payload = `${userId}.${exp}`;
  const sig = crypto.createHmac('sha256', requireSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/** Returns userId if token is valid and not expired. */
export function verifyOAuthLinkToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const secret = getSecretOrNull();
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;

  const payload = `${userId}.${expStr}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  return userId;
}

export const OAUTH_LINK_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: COOKIE_MAX_AGE_MS / 1000,
  secure: process.env.NODE_ENV === 'production',
};
