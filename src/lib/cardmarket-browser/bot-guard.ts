import type { Page } from 'playwright';

const BOT_HINTS = [
  /verify you are human/i,
  /checking your browser/i,
  /just a moment/i,
  /attention required/i,
  /cf-browser-verification/i,
  /challenge-platform/i,
  /bot check/i,
  /captcha/i,
  /turnstile/i,
  /hcaptcha/i,
  /recaptcha/i,
  /ddos protection/i,
  /security check/i,
];

export class CardmarketBotCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardmarketBotCheckError';
  }
}

/** Fail fast instead of hanging on Cloudflare / bot walls. */
export async function assertNotBotBlocked(page: Page): Promise<void> {
  const url = page.url();
  if (/challenges\.cloudflare\.com/i.test(url)) {
    throw new CardmarketBotCheckError(
      'Cardmarket bot check (Cloudflare). Use “Add to cart on this PC” — server datacenter IPs cannot pass this.'
    );
  }

  const title = (await page.title().catch(() => '')) ?? '';
  const bodyText =
    (await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')) ?? '';
  const haystack = `${title}\n${bodyText}`.slice(0, 8000);

  for (const re of BOT_HINTS) {
    if (re.test(haystack)) {
      throw new CardmarketBotCheckError(
        'Cardmarket bot check blocked automation. Run cart fill on your PC (real browser), not on the server.'
      );
    }
  }

  const cfIframe = page.locator('iframe[src*="challenges.cloudflare"], iframe[src*="turnstile"]');
  if (await cfIframe.first().isVisible().catch(() => false)) {
    throw new CardmarketBotCheckError(
      'Cardmarket bot check (iframe challenge). Use local cart fill on your PC.'
    );
  }
}

export async function gotoCardmarket(
  page: Page,
  url: string,
  timeoutMs = 45_000
): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  await assertNotBotBlocked(page);
}
