import { Resend } from 'resend';
import { prisma } from './prisma';
import { EmailType, EmailStatus } from '@prisma/client';

// Lazy initialize Resend to avoid errors during build
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = 'Pack Attack';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Log an email to the database
 */
async function logEmail(
  toEmail: string,
  subject: string,
  type: EmailType,
  status: EmailStatus,
  userId?: string,
  resendId?: string,
  error?: string
) {
  try {
    await prisma.emailLog.create({
      data: {
        toEmail,
        subject,
        type,
        status,
        userId,
        resendId,
        error,
      },
    });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

/**
 * Send a verification email to a user
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  userId?: string
): Promise<SendEmailResult> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const subject = `Verify your ${APP_NAME} account`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(to bottom, #1e293b, #0f172a); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <div style="padding: 40px 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">
              <span style="color: #fff;">PACK </span>
              <span style="background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ATTACK</span>
            </h1>
          </div>
          <div style="padding: 20px 40px 40px;">
            <h2 style="color: #fff; font-size: 24px; margin: 0 0 16px;">Verify Your Email</h2>
            <p style="color: #94a3b8; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
              Welcome to Pack Attack! Please verify your email address to complete your registration and start opening packs.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(to right, #3b82f6, #2563eb); color: #fff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 20px; margin: 0;">
              Or copy and paste this link into your browser:<br>
              <a href="${verifyUrl}" style="color: #60a5fa; word-break: break-all;">${verifyUrl}</a>
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
          <div style="padding: 20px 40px; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    if (error) {
      await logEmail(email, subject, 'VERIFICATION', 'FAILED', userId, undefined, error.message);
      return { success: false, error: error.message };
    }

    await logEmail(email, subject, 'VERIFICATION', 'SENT', userId, data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await logEmail(email, subject, 'VERIFICATION', 'FAILED', userId, undefined, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a welcome email after verification
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string,
  userId?: string
): Promise<SendEmailResult> {
  const subject = `Welcome to ${APP_NAME}!`;
  const greeting = name ? `Hi ${name}` : 'Welcome';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(to bottom, #1e293b, #0f172a); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <div style="padding: 40px 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">
              <span style="color: #fff;">PACK </span>
              <span style="background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ATTACK</span>
            </h1>
          </div>
          <div style="padding: 20px 40px 40px;">
            <h2 style="color: #fff; font-size: 24px; margin: 0 0 16px;">${greeting}! 🎉</h2>
            <p style="color: #94a3b8; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
              Your email has been verified and your account is ready to go! You've received <strong style="color: #fbbf24;">1,000 bonus coins</strong> to get started.
            </p>
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #fff; font-size: 16px; margin: 0 0 12px;">What you can do now:</h3>
              <ul style="color: #94a3b8; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                <li>Open trading card packs</li>
                <li>Battle other players</li>
                <li>Build your collection</li>
                <li>Win real cards!</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${APP_URL}/boxes" style="display: inline-block; padding: 16px 32px; background: linear-gradient(to right, #3b82f6, #2563eb); color: #fff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px;">
                Start Opening Packs
              </a>
            </div>
          </div>
          <div style="padding: 20px 40px; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    if (error) {
      await logEmail(email, subject, 'WELCOME', 'FAILED', userId, undefined, error.message);
      return { success: false, error: error.message };
    }

    await logEmail(email, subject, 'WELCOME', 'SENT', userId, data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await logEmail(email, subject, 'WELCOME', 'FAILED', userId, undefined, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a custom email (for admin use)
 */
export async function sendCustomEmail(
  to: string | string[],
  subject: string,
  html: string,
  userId?: string
): Promise<SendEmailResult> {
  const toArray = Array.isArray(to) ? to : [to];
  
  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: toArray,
      subject,
      html,
    });

    if (error) {
      // Log for each recipient
      for (const email of toArray) {
        await logEmail(email, subject, 'ADMIN_CUSTOM', 'FAILED', userId, undefined, error.message);
      }
      return { success: false, error: error.message };
    }

    // Log for each recipient
    for (const email of toArray) {
      await logEmail(email, subject, 'ADMIN_CUSTOM', 'SENT', userId, data?.id);
    }
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    for (const email of toArray) {
      await logEmail(email, subject, 'ADMIN_CUSTOM', 'FAILED', userId, undefined, errorMessage);
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Order item for shop notification emails
 */
export interface ShopOrderItem {
  orderNumber: string;
  cardName: string;
  cardImage?: string | null;
  cardValue: number;
  cardRarity?: string | null;
}

/**
 * Shipping info for shop notification emails
 */
export interface ShopOrderShipping {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  method: string;
  cost: number;
  notes?: string | null;
}

/**
 * Send a new-order notification email to a shop owner.
 * Contains an itemised invoice, customer shipping details, and a CTA to the shop dashboard.
 */
export async function sendShopOrderNotificationEmail(
  shopOwnerEmail: string,
  shopName: string,
  items: ShopOrderItem[],
  shipping: ShopOrderShipping,
  shopOwnerId?: string
): Promise<SendEmailResult> {
  const itemCount = items.length;
  const subject = `${APP_NAME} — Neue Bestellung (${itemCount} ${itemCount === 1 ? 'Artikel' : 'Artikel'}) für ${shopName}`;
  const dashboardUrl = `${APP_URL}/shop-dashboard/orders`;
  const totalValue = items.reduce((sum, i) => sum + i.cardValue, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const itemRows = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 12px 16px; color: #e2e8f0; font-size: 14px;">${idx + 1}</td>
      <td style="padding: 12px 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${item.cardImage ? `<img src="${item.cardImage}" alt="" width="40" height="56" style="border-radius: 4px; object-fit: cover;" />` : ''}
          <div>
            <div style="color: #e2e8f0; font-size: 14px; font-weight: 600;">${item.cardName}</div>
            ${item.cardRarity ? `<div style="color: #94a3b8; font-size: 12px;">${item.cardRarity}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 12px 16px; color: #94a3b8; font-size: 12px; white-space: nowrap;">${item.orderNumber}</td>
      <td style="padding: 12px 16px; color: #fbbf24; font-size: 14px; font-weight: 600; text-align: right;">${item.cardValue.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px;">
        <div style="max-width: 640px; margin: 0 auto; background: linear-gradient(to bottom, #1e293b, #0f172a); border-radius: 16px; border: 1px solid #334155; overflow: hidden;">

          <!-- Header -->
          <div style="padding: 32px 40px 16px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
              <span style="color: #fff;">PACK </span>
              <span style="background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ATTACK</span>
            </h1>
          </div>

          <!-- Title -->
          <div style="padding: 8px 40px 24px; text-align: center;">
            <h2 style="color: #fff; font-size: 22px; margin: 0 0 8px;">Neue Bestellung eingegangen!</h2>
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">${dateStr} um ${timeStr}</p>
          </div>

          <!-- Invoice table -->
          <div style="padding: 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: rgba(15, 23, 42, 0.6); border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
              <thead>
                <tr style="background: rgba(59, 130, 246, 0.1); border-bottom: 1px solid #334155;">
                  <th style="padding: 12px 16px; color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: left; font-weight: 600;">#</th>
                  <th style="padding: 12px 16px; color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: left; font-weight: 600;">Artikel</th>
                  <th style="padding: 12px 16px; color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: left; font-weight: 600;">Bestell-Nr.</th>
                  <th style="padding: 12px 16px; color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: right; font-weight: 600;">Wert (Coins)</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tfoot>
                <tr style="background: rgba(59, 130, 246, 0.05);">
                  <td colspan="3" style="padding: 14px 16px; color: #e2e8f0; font-size: 14px; font-weight: 700; text-align: right;">Gesamt</td>
                  <td style="padding: 14px 16px; color: #fbbf24; font-size: 16px; font-weight: 700; text-align: right;">${totalValue.toFixed(2)} Coins</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 8px 16px 14px; color: #94a3b8; font-size: 13px; text-align: right;">Versandkosten (${shipping.method === 'COINS' ? 'Coins' : 'Euro'})</td>
                  <td style="padding: 8px 16px 14px; color: #94a3b8; font-size: 13px; text-align: right;">${shipping.cost.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Shipping info -->
          <div style="padding: 24px 24px 0;">
            <div style="background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid #334155; padding: 20px 24px;">
              <h3 style="color: #fff; font-size: 15px; margin: 0 0 14px; font-weight: 700;">Lieferadresse</h3>
              <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-size: 13px; width: 100px;">Name</td>
                  <td style="padding: 4px 0; color: #e2e8f0; font-size: 13px; font-weight: 600;">${shipping.name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-size: 13px;">E-Mail</td>
                  <td style="padding: 4px 0; color: #e2e8f0; font-size: 13px;">${shipping.email}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-size: 13px;">Adresse</td>
                  <td style="padding: 4px 0; color: #e2e8f0; font-size: 13px;">${shipping.address}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-size: 13px;">Stadt / PLZ</td>
                  <td style="padding: 4px 0; color: #e2e8f0; font-size: 13px;">${shipping.zip} ${shipping.city}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8; font-size: 13px;">Land</td>
                  <td style="padding: 4px 0; color: #e2e8f0; font-size: 13px;">${shipping.country}</td>
                </tr>
              </table>
              ${shipping.notes ? `
                <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #334155;">
                  <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 4px; font-weight: 600;">Kundennotiz</p>
                  <p style="color: #e2e8f0; font-size: 13px; margin: 0; white-space: pre-line;">${shipping.notes}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- CTA -->
          <div style="padding: 32px 40px; text-align: center;">
            <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(to right, #3b82f6, #2563eb); color: #fff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px;">
              Bestellung bearbeiten
            </a>
            <p style="color: #64748b; font-size: 13px; margin: 16px 0 0;">
              Logge dich in dein Shop-Dashboard ein, um die Bestellung zu bestätigen und den Versand vorzubereiten.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 40px; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} ${APP_NAME} &mdash; Diese E-Mail wurde automatisch generiert.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: shopOwnerEmail,
      subject,
      html,
    });

    if (error) {
      await logEmail(shopOwnerEmail, subject, 'NOTIFICATION', 'FAILED', shopOwnerId, undefined, error.message);
      return { success: false, error: error.message };
    }

    await logEmail(shopOwnerEmail, subject, 'NOTIFICATION', 'SENT', shopOwnerId, data?.id);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await logEmail(shopOwnerEmail, subject, 'NOTIFICATION', 'FAILED', shopOwnerId, undefined, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Resend verification email to a user
 */
export async function resendVerificationEmail(
  userId: string
): Promise<SendEmailResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.emailVerified) {
    return { success: false, error: 'Email already verified' };
  }

  // Generate new token
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationToken: token,
      verificationExpires: expires,
    },
  });

  return sendVerificationEmail(user.email, token, userId);
}

/**
 * Generate a verification token for a user
 */
export function generateVerificationToken(): { token: string; expires: Date } {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, expires };
}

