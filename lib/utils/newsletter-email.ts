import { Resend } from 'resend';
import type { NewsletterAttachment } from '@/lib/types/newsletter';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';

interface NewsletterEmailOptions {
  to: string;
  unsubscribeToken: string;
  businessName: string;
  replyTo: string;
  subject: string;
  bodyHtml: string;
  attachments?: NewsletterAttachment[];
}

function buildNewsletterHtml(bodyHtml: string, unsubscribeUrl: string, businessName: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #006c49; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; color: white;">${businessName}</h1>
      </div>
      <div style="padding: 32px 24px;">
        ${bodyHtml}
      </div>
      <div style="background: #f5f5f5; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
          Vous recevez cet email car vous vous êtes inscrit(e) à la newsletter de <strong>${businessName}</strong>.
          <br/>
          <a href="${unsubscribeUrl}" style="color: #006c49; text-decoration: underline;">Se désabonner</a>
          &nbsp;·&nbsp;
          <a href="${baseUrl}" style="color: #006c49; text-decoration: none;">kelen.africa</a>
        </p>
      </div>
    </div>
  `;
}

export async function sendNewsletterCampaign(
  options: NewsletterEmailOptions
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Newsletter] Resend not configured — skipping');
    return { success: false, error: 'Resend not configured' };
  }

  const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${options.unsubscribeToken}`;
  const html = buildNewsletterHtml(options.bodyHtml, unsubscribeUrl, options.businessName);

  try {
    await resend.emails.send({
      from: `${options.businessName} <newsletter@kelen.africa>`,
      replyTo: options.replyTo,
      to: [options.to],
      subject: options.subject,
      html,
      attachments: options.attachments?.map((a) => ({ filename: a.name, path: a.url })),
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    return { success: true };
  } catch (err) {
    console.error('[Newsletter] Send error:', err);
    return { success: false, error: 'Échec d\'envoi' };
  }
}

export async function sendNewsletterBatch(
  subscribers: Array<{ email: string; unsubscribe_token: string }>,
  opts: Omit<NewsletterEmailOptions, 'to' | 'unsubscribeToken'>
): Promise<{ successCount: number; failCount: number }> {

  if (!resend) return { successCount: 0, failCount: subscribers.length };

  const CHUNK_SIZE = 100;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < subscribers.length; i += CHUNK_SIZE) {
    const chunk = subscribers.slice(i, i + CHUNK_SIZE);
    const messages = chunk.map((sub) => {
      const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
      return {
        from: `${opts.businessName} <newsletter@kelen.africa>`,
        replyTo: opts.replyTo,
        to: [sub.email],
        subject: opts.subject,
        html: buildNewsletterHtml(opts.bodyHtml, unsubscribeUrl, opts.businessName),
        attachments: opts.attachments?.map((a) => ({ filename: a.name, path: a.url })),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    try {
      await resend.batch.send(messages);
      successCount += chunk.length;
    } catch (err) {
      console.error(`[Newsletter] Batch chunk ${i / CHUNK_SIZE + 1} failed:`, err);
      failCount += chunk.length;
    }
  }

  return { successCount, failCount };
}
