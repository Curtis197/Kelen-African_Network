import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';

// ── Email template options ───────────────────────────────────

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
  action: 'approved' | 'contested' | 'resolved';
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

interface SendProjectAssignmentOptions {
  to: string;
  proName: string;
  projectName: string;
  projectUrl: string;
}

interface SendReputationNotificationOptions {
  to: string;
  type: 'new_recommendation' | 'new_signal';
  proName: string;
  count: number;
  actionUrl: string;
}

// ── Email sending helpers ────────────────────────────────────

function emailWrapper(html: string, subject: string, to: string): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured — skipping email notification');
    return Promise.resolve({ success: false, error: 'Resend not configured' });
  }

  return resend.emails.send({
    from: 'Kelen <notifications@kelen.africa>',
    to: [to],
    subject,
    html,
  }).then(() => ({ success: true }))
    .catch((error) => {
      console.error(`[Email] Error: ${error}`);
      return { success: false, error: 'Failed to send email' };
    });
}

function emailTemplate(title: string, body: string, actionUrl?: string, actionText?: string, accentColor?: string) {
  const accent = accentColor || '#006c49';
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: ${accent}; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: white;">Kelen</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 20px;">${title}</h2>
        ${body}
        ${actionUrl && actionText ? `
          <a href="${actionUrl}"
             style="display: inline-block; background: ${accent}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            ${actionText} →
          </a>
        ` : ''}
      </div>
      <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999;">
        Propulsé par Kelen — <a href="${baseUrl}" style="color: ${accent}; text-decoration: none;">kelen.africa</a>
      </div>
    </div>
  `;
}

// ── Email templates ──────────────────────────────────────────

export async function sendNewLogEmail(options: SendNewLogEmailOptions): Promise<{ success: boolean; error?: string }> {
  const url = `${baseUrl}/projets/${options.projectId}/journal/${options.logId}`;
  const body = `
    <p style="color: #666; margin: 0 0 24px;">
      Un nouveau rapport a été publié pour le projet <strong>${options.projectName}</strong>.
    </p>
    <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-weight: 600;">${options.logTitle}</p>
      <p style="margin: 0; font-size: 14px; color: #666;">
        Publié le ${options.logDate} par ${options.authorName}
      </p>
    </div>
  `;

  return emailWrapper(emailTemplate('Nouveau rapport de chantier', body, url, 'Voir le rapport'),
    `Nouveau rapport pour "${options.projectName}" — ${options.logTitle}`,
    options.to);
}

export async function sendLogActionEmail(options: SendLogActionEmailOptions): Promise<{ success: boolean; error?: string }> {
  const url = `${baseUrl}/projets/${options.projectId}/journal/${options.logId}`;
  const isContest = options.action === 'contested';
  const isResolved = options.action === 'resolved';
  const accent = isContest ? '#dc2626' : isResolved ? '#2563eb' : '#006c49';

  const body = `
    <p style="color: #666; margin: 0 0 24px;">
      Le rapport <strong>"${options.logTitle}"</strong> a été ${
        isContest ? 'contesté' : isResolved ? 'résolu' : 'approuvé'
      } par ${options.authorName}.
    </p>
    ${options.comment ? `
      <div style="background: ${isContest ? '#fef2f2' : '#f0fdf4'}; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${accent};">
        <p style="margin: 0; font-style: italic; color: #666;">"${options.comment}"</p>
      </div>
    ` : ''}
  `;

  return emailWrapper(emailTemplate(
      isContest ? '⚠️ Rapport contesté' : isResolved ? '✅ Contestation résolue' : '✅ Rapport approuvé',
      body, url, 'Voir le détail', accent),
    isContest
      ? `⚠️ Rapport contesté pour "${options.projectName}"`
      : isResolved
        ? `✅ Contestation résolue pour "${options.projectName}"`
        : `✅ Rapport approuvé pour "${options.projectName}"`,
    options.to);
}

export async function sendSharedLogEmail(options: SendSharedLogEmailOptions): Promise<{ success: boolean; error?: string }> {
  const body = `
    <p style="color: #666; margin: 0 0 24px;">
      Un rapport de chantier pour le projet <strong>${options.projectName}</strong> a été partagé avec vous.
    </p>
    <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-weight: 600;">${options.logTitle}</p>
      <p style="margin: 0; font-size: 14px; color: #666;">Date: ${options.logDate}</p>
    </div>
  `;

  return emailWrapper(emailTemplate('Rapport de chantier partagé', body, options.shareUrl, 'Voir le rapport'),
    `Rapport de chantier — ${options.projectName} (${options.logDate})`,
    options.to);
}

export async function sendProjectAssignmentEmail(options: SendProjectAssignmentOptions): Promise<{ success: boolean; error?: string }> {
  const body = `
    <p style="color: #666; margin: 0 0 24px;">
      Vous avez été assigné(e) au projet <strong>${options.projectName}</strong>.
    </p>
    <p style="color: #666; margin: 0 0 24px;">
      Connectez-vous à votre espace professionnel pour consulter les détails du projet et commencer à documenter votre travail.
    </p>
  `;

  return emailWrapper(emailTemplate('Nouvelle assignation de projet', body, options.projectUrl, 'Voir le projet'),
    `Vous avez été assigné(e) au projet "${options.projectName}"`,
    options.to);
}

export async function sendReputationNotificationEmail(options: SendReputationNotificationOptions): Promise<{ success: boolean; error?: string }> {
  const isNewRec = options.type === 'new_recommendation';
  const accent = isNewRec ? '#006c49' : '#dc2626';

  const body = isNewRec
    ? `<p style="color: #666; margin: 0 0 24px;">
         Bonne nouvelle ! Votre profil a reçu une nouvelle recommandation vérifiée.
         Vous en avez maintenant <strong>${options.count}</strong> au total.
       </p>`
    : `<p style="color: #666; margin: 0 0 24px;">
         ⚠️ Un signalement a été enregistré sur votre profil.
         Vous disposez de 15 jours pour répondre avant qu'il ne soit automatiquement validé.
       </p>`;

  return emailWrapper(emailTemplate(
      isNewRec ? 'Nouvelle recommandation' : '⚠️ Nouveau signalement',
      body, options.actionUrl,
      isNewRec ? 'Voir mon profil' : 'Répondre au signalement',
      accent),
    isNewRec
      ? `Nouvelle recommandation pour ${options.proName}`
      : `⚠️ Signalement enregistré — ${options.proName}`,
    options.to);
}
