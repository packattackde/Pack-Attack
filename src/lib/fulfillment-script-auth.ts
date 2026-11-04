import { timingSafeEqual } from 'crypto';

export function verifyFulfillmentScriptKey(request: Request): boolean {
  const expected = process.env.FULFILLMENT_SCRIPT_KEY?.trim()?.replace(/\r/g, '');
  if (!expected) return false;
  const got = request.headers.get('x-fulfillment-key')?.trim() ?? '';
  if (!got || got.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
  } catch {
    return false;
  }
}
