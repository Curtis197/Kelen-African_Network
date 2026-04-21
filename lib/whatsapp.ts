import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const FROM = process.env.TWILIO_WHATSAPP_NUMBER!

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
    `Hi ${p.name}, your appointment with ${p.pro_name} is confirmed for ${p.date} at ${p.time}. See you soon!`,
  booking_confirmed_with_payment: (p) =>
    `Hi ${p.name}, your booking with ${p.pro_name} on ${p.date} at ${p.time} is confirmed. Deposit of ${p.amount} received.`,
  appointment_reminder: (p) =>
    `Reminder: your appointment with ${p.pro_name} is tomorrow at ${p.time}. Address: ${p.location}`,
  invoice_received: (p) =>
    `Hi ${p.name}, ${p.pro_name} sent you an invoice for ${p.amount}. Pay here: ${p.link}`,
  payment_receipt: (p) =>
    `Payment confirmed. ${p.amount} received by ${p.pro_name}. Thank you!`,
  pro_new_booking: (p) =>
    `New booking from ${p.client_name} on ${p.date} at ${p.time}. Service: ${p.service}`,
  pro_payment_received: (p) =>
    `${p.client_name} just paid ${p.amount} for ${p.service}. Check your dashboard.`,
}

export async function sendWhatsApp(
  to: string,
  template: WhatsAppTemplate,
  params: Record<string, string>
): Promise<{ sid: string; status: string }> {
  const body = templates[template](params)
  const message = await client.messages.create({
    from: FROM,
    to: `whatsapp:${to}`,
    body,
  })
  return { sid: message.sid, status: message.status as string }
}
