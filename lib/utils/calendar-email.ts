import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export async function sendClientConfirmationEmail({
  clientEmail,
  clientName,
  proName,
  startsAt,
  endsAt,
  reason,
}: {
  clientEmail: string;
  clientName: string;
  proName: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
}) {
  if (!resend) return;

  const dateLabel = formatDateTime(startsAt);
  const endLabel = formatDateTime(endsAt);

  await resend.emails.send({
    from: "Kelen <noreply@kelen.africa>",
    to: clientEmail,
    subject: `Votre rendez-vous avec ${proName} est confirmé`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #006c49; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; color: white;">Rendez-vous confirmé ✓</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Votre rendez-vous avec <strong>${proName}</strong> est confirmé.</p>
          <div style="background: #f9fafb; border-left: 4px solid #006c49; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px;"><strong>Date :</strong> ${dateLabel}</p>
            <p style="margin: 0 0 8px;"><strong>Heure de fin :</strong> ${endLabel}</p>
            ${reason ? `<p style="margin: 0;"><strong>Objet :</strong> ${reason}</p>` : ""}
          </div>
          <p>Un événement a été ajouté à votre calendrier Google. Vous pouvez le modifier ou l'annuler directement depuis votre agenda.</p>
          <p style="color: #6b7280; font-size: 14px;">À bientôt,<br/>L'équipe Kelen</p>
        </div>
      </div>
    `,
  });
}

export async function sendProNotificationEmail({
  proEmail,
  proName,
  clientName,
  clientEmail,
  clientPhone,
  startsAt,
  endsAt,
  reason,
}: {
  proEmail: string;
  proName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
}) {
  if (!resend) return;

  const dateLabel = formatDateTime(startsAt);
  const endLabel = formatDateTime(endsAt);

  await resend.emails.send({
    from: "Kelen <noreply@kelen.africa>",
    to: proEmail,
    subject: `Nouveau RDV — ${clientName} — ${dateLabel}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #1a1a1a; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; color: white;">Nouveau rendez-vous</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p>Bonjour <strong>${proName}</strong>,</p>
          <p>Un client vient de réserver un créneau via votre profil Kelen.</p>
          <div style="background: #f9fafb; border-left: 4px solid #1a1a1a; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px;"><strong>Client :</strong> ${clientName}</p>
            <p style="margin: 0 0 8px;"><strong>Email :</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
            ${clientPhone ? `<p style="margin: 0 0 8px;"><strong>Téléphone :</strong> ${clientPhone}</p>` : ""}
            <p style="margin: 0 0 8px;"><strong>Date :</strong> ${dateLabel}</p>
            <p style="margin: 0 0 8px;"><strong>Fin :</strong> ${endLabel}</p>
            ${reason ? `<p style="margin: 0;"><strong>Objet :</strong> ${reason}</p>` : ""}
          </div>
          <p>L'événement a été ajouté à votre Google Calendar automatiquement.</p>
        </div>
      </div>
    `,
  });
}
