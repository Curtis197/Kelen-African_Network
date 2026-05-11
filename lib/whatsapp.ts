import twilio from 'twilio'

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set')
  return twilio(sid, token)
}

function getFrom(): string {
  const from = process.env.TWILIO_WHATSAPP_NUMBER
  if (!from) throw new Error('TWILIO_WHATSAPP_NUMBER must be set')
  return from
}

export type WhatsAppTemplate =
  | 'booking_confirmed_no_payment'
  | 'booking_confirmed_with_payment'
  | 'appointment_reminder'
  | 'invoice_received'
  | 'payment_receipt'
  | 'pro_new_booking'
  | 'pro_payment_received'

const templates: Record<WhatsAppTemplate, (p: Record<string, string>) => string> = {
  booking_confirmed_no_payment: (p) =>
    `Bonjour ${p.name}, votre rendez-vous avec ${p.pro_name} est confirmé pour le ${p.date} à ${p.time}. À bientôt !`,
  booking_confirmed_with_payment: (p) =>
    `Bonjour ${p.name}, votre réservation avec ${p.pro_name} le ${p.date} à ${p.time} est confirmée. Acompte de ${p.amount} reçu.`,
  appointment_reminder: (p) =>
    `Rappel : votre rendez-vous avec ${p.pro_name} est demain à ${p.time}. Adresse : ${p.location}`,
  invoice_received: (p) =>
    `Bonjour ${p.name}, ${p.pro_name} vous a envoyé une facture de ${p.amount}. Payez ici : ${p.link}`,
  payment_receipt: (p) =>
    `Paiement confirmé. ${p.amount} reçu par ${p.pro_name}. Merci !`,
  pro_new_booking: (p) =>
    `Nouvelle réservation de ${p.client_name} le ${p.date} à ${p.time}. Service : ${p.service}`,
  pro_payment_received: (p) =>
    `${p.client_name} vient de payer ${p.amount} pour ${p.service}. Consultez votre tableau de bord.`,
}

export async function sendWhatsApp(
  to: string,
  template: WhatsAppTemplate,
  params: Record<string, string>
): Promise<{ sid: string; status: string }> {
  const body = templates[template](params)
  const message = await getClient().messages.create({
    from: `whatsapp:${getFrom()}`,
    to: `whatsapp:${to}`,
    body,
  })
  return { sid: message.sid, status: message.status as string }
}
