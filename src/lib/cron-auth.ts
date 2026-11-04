const WEAK_DEFAULT_SECRETS = new Set(['your-secret-key', 'change-me', '']);

/**
 * Returns CRON_SECRET for bearer auth. In production, missing or weak secrets throw at call time.
 */
export function getCronSecret(): string {
  const secret = process.env.CRON_SECRET?.trim() ?? '';
  if (process.env.NODE_ENV === 'production') {
    if (!secret || WEAK_DEFAULT_SECRETS.has(secret)) {
      throw new Error('CRON_SECRET must be set to a strong value in production');
    }
    return secret;
  }
  return secret || 'dev-cron-secret-local-only';
}

export function isValidCronBearer(request: Request): boolean {
  try {
    const expected = getCronSecret();
    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${expected}`;
  } catch {
    return false;
  }
}

export function isValidCronBearerFromHeader(authHeader: string | null): boolean {
  try {
    const expected = getCronSecret();
    return authHeader === `Bearer ${expected}`;
  } catch {
    return false;
  }
}
