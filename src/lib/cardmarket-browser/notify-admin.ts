import { cardmarketShoppingCartUrl } from './links';
import { sendCustomEmail } from '../email';
import { prisma } from '../prisma';

export type CardmarketCartReadyPayload = {
  pullforgeOrderIds: string[];
  /** Optional lines for the email body, e.g. card names and MKM sellers. */
  lines?: string[];
  cartUrl?: string;
};

async function resolveNotifyEmails(): Promise<string[]> {
  const fromEnv = process.env.FULFILLMENT_NOTIFY_EMAIL ?? process.env.CARDMARKET_ADMIN_EMAIL;
  if (fromEnv?.trim()) {
    return fromEnv
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
  }
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true },
  });
  return admins.map((a) => a.email).filter((e): e is string => Boolean(e));
}

/** Email admins + link to MKM cart after MCP/browser cart prep (no checkout). */
export async function notifyAdminsCardmarketCartReady(
  payload: CardmarketCartReadyPayload
): Promise<{ sent: boolean; recipients: string[]; error?: string }> {
  const recipients = await resolveNotifyEmails();
  if (recipients.length === 0) {
    return { sent: false, recipients: [], error: 'No admin notify emails configured' };
  }

  const cartUrl = payload.cartUrl ?? cardmarketShoppingCartUrl();
  const adminOrdersUrl = `${process.env.NEXTAUTH_URL || 'https://pack-attack.de'}/admin/orders`;
  const orderList = payload.pullforgeOrderIds.map((id) => `<li><code>${id}</code></li>`).join('');
  const lineList = (payload.lines ?? [])
    .map((l) => `<li style="color:#e2e8f0;font-size:14px;">${l}</li>`)
    .join('');

  const subject = `Cardmarket cart ready — ${payload.pullforgeOrderIds.length} Pullforge order(s)`;
  const html = `
    <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
      <h2 style="color:#fff;">Cardmarket cart prepared</h2>
      <p>Pullforge order(s) were added to the Cardmarket basket. <strong>Payment is not done</strong> — finish checkout manually.</p>
      <ul>${orderList}</ul>
      ${lineList ? `<p style="color:#94a3b8;">Lines:</p><ul>${lineList}</ul>` : ''}
      <p style="margin-top:24px;">
        <a href="${cartUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Open Cardmarket cart</a>
      </p>
      <p style="margin-top:16px;">
        <a href="${adminOrdersUrl}" style="color:#93c5fd;">Pullforge admin orders</a>
      </p>
    </div>
  `;

  const result = await sendCustomEmail(recipients, subject, html);
  return {
    sent: result.success,
    recipients,
    error: result.error,
  };
}
