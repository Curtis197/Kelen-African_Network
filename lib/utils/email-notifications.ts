import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';

interface SendNewLogEmailOptions {
  to: string;
  projectName: string;
  logTitle: string;
  logDate: string;
  authorName: string;
  logId: string;
  projectId: string;
}

interface SendLogActionEmailOptions {
  to: string;
  projectName: string;
  logTitle: string;
  action: 'approved' | 'contested';
  comment: string;
  authorName: string;
  logId: string;
  projectId: string;
}

interface SendSharedLogEmailOptions {
  to: string;
  projectName: string;
  logTitle: string;
  logDate: string;
  shareUrl: string;
}

export async function sendNewLogEmail(options: SendNewLogEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured — skipping email notification');
    return { success: false, error: 'Resend not configured' };
  }

  const projectUrl = `${baseUrl}/projets/${options.projectId}/journal/${options.logId}`;

  try {
    await resend.emails.send({
      from: 'Kelen <notifications@kelen.africa>',
      to: [options.to],
      subject: `Nouveau rapport pour "${options.projectName}" — ${options.logTitle}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f5f5f5; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">Kelen</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">
              Nouveau rapport de chantier
            </h2>
            <p style="color: #666; margin: 0 0 24px;">
              Un nouveau rapport a été publié pour le projet <strong>${options.projectName}</strong>.
            </p>
            <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-weight: 600;">${options.logTitle}</p>
              <p style="margin: 0; font-size: 14px; color: #666;">
                Publié le ${options.logDate} par ${options.authorName}
              </p>
            </div>
            <a href="${projectUrl}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Voir le rapport →
            </a>
          </div>
          <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
            Propulsé par Kelen — kelen.africa
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending new log email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendLogActionEmail(options: SendLogActionEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured — skipping email notification');
    return { success: false, error: 'Resend not configured' };
  }

  const projectUrl = `${baseUrl}/projets/${options.projectId}/journal/${options.logId}`;
  const isContest = options.action === 'contested';

  try {
    await resend.emails.send({
      from: 'Kelen <notifications@kelen.africa>',
      to: [options.to],
      subject: isContest
        ? `⚠️ Rapport contesté pour "${options.projectName}"`
        : `✅ Rapport approuvé pour "${options.projectName}"`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${isContest ? '#fef2f2' : '#f0fdf4'}; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">Kelen</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">
              ${isContest ? '⚠️ Rapport contesté' : '✅ Rapport approuvé'}
            </h2>
            <p style="color: #666; margin: 0 0 24px;">
              Le rapport <strong>"${options.logTitle}"</strong> a été ${options.action === 'approved' ? 'approuvé' : 'contesté'} par ${options.authorName}.
            </p>
            ${options.comment ? `
              <div style="background: ${isContest ? '#fef2f2' : '#f0fdf4'}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-style: italic;">"${options.comment}"</p>
              </div>
            ` : ''}
            <a href="${projectUrl}"
               style="display: inline-block; background: ${isContest ? '#dc2626' : '#2563eb'}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Voir le détail →
            </a>
          </div>
          <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
            Propulsé par Kelen — kelen.africa
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending log action email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendSharedLogEmail(options: SendSharedLogEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured — skipping email notification');
    return { success: false, error: 'Resend not configured' };
  }

  try {
    await resend.emails.send({
      from: 'Kelen <notifications@kelen.africa>',
      to: [options.to],
      subject: `Rapport de chantier — ${options.projectName} (${options.logDate})`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f5f5f5; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">Kelen</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">
              Rapport de chantier partagé
            </h2>
            <p style="color: #666; margin: 0 0 24px;">
              Un rapport de chantier pour le projet <strong>${options.projectName}</strong> a été partagé avec vous.
            </p>
            <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-weight: 600;">${options.logTitle}</p>
              <p style="margin: 0; font-size: 14px; color: #666;">Date: ${options.logDate}</p>
            </div>
            <a href="${options.shareUrl}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Voir le rapport →
            </a>
          </div>
          <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
            Propulsé par Kelen — kelen.africa
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending shared log email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
