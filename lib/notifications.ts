import { sendWhatsApp } from '@/lib/whatsapp'
import { createClient } from '@/lib/supabase/service'
import { format } from 'date-fns'

type NotificationRecord = {
  professional_id: string
  appointment_id: string | null
  payment_id?: string
  recipient: 'client' | 'pro'
  phone: string
  template: string
  status: 'sent' | 'failed'
  twilio_sid?: string
}

async function persistNotifications(records: NotificationRecord[]) {
  if (records.length === 0) return
  const supabase = createClient()
  await supabase.from('whatsapp_notifications').insert(records)
}

function formatDateTime(isoString: string) {
  const date = new Date(isoString)
  return {
    date: format(date, 'd MMMM yyyy'),
    time: format(date, 'HH:mm'),
  }
}

export type BookingNotificationInput = {
  professionalId: string
  appointmentId: string | null
  clientName: string
  clientPhone: string | null
  proPhone: string | null
  proName: string
  serviceName: string
  startsAt: string
  withPayment: boolean
  depositAmount?: string
  location?: string
}

export async function notifyBookingConfirmed(input: BookingNotificationInput) {
  const { date, time } = formatDateTime(input.startsAt)
  const records: NotificationRecord[] = []

  if (input.clientPhone) {
    const template = input.withPayment
      ? 'booking_confirmed_with_payment'
      : 'booking_confirmed_no_payment'
    const params: Record<string, string> = {
      name: input.clientName,
      pro_name: input.proName,
      date,
      time,
      ...(input.withPayment && { amount: input.depositAmount ?? '' }),
    }
    try {
      const result = await sendWhatsApp(input.clientPhone, template, params)
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'client',
        phone: input.clientPhone,
        template,
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'client',
        phone: input.clientPhone,
        template,
        status: 'failed',
      })
    }
  }

  if (input.proPhone) {
    try {
      const result = await sendWhatsApp(input.proPhone, 'pro_new_booking', {
        client_name: input.clientName,
        date,
        time,
        service: input.serviceName,
      })
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_new_booking',
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_new_booking',
        status: 'failed',
      })
    }
  }

  await persistNotifications(records)
}

export type PaymentNotificationInput = {
  professionalId: string
  paymentId: string
  appointmentId: string | null
  clientName: string
  clientPhone: string | null
  proPhone: string | null
  proName: string
  serviceName: string
  amount: string
  paymentType: 'booking_deposit' | 'invoice'
}

export async function notifyPaymentReceived(input: PaymentNotificationInput) {
  const records: NotificationRecord[] = []

  if (input.clientPhone) {
    try {
      const result = await sendWhatsApp(input.clientPhone, 'payment_receipt', {
        amount: input.amount,
        pro_name: input.proName,
      })
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'client',
        phone: input.clientPhone,
        template: 'payment_receipt',
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'client',
        phone: input.clientPhone,
        template: 'payment_receipt',
        status: 'failed',
      })
    }
  }

  if (input.proPhone) {
    try {
      const result = await sendWhatsApp(input.proPhone, 'pro_payment_received', {
        client_name: input.clientName,
        amount: input.amount,
        service: input.serviceName,
      })
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_payment_received',
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_payment_received',
        status: 'failed',
      })
    }
  }

  await persistNotifications(records)
}

export async function notifyInvoiceSent(input: {
  professionalId: string
  paymentId: string
  clientName: string
  clientPhone: string
  proName: string
  amount: string
  paymentLink: string
}) {
  const records: NotificationRecord[] = []
  try {
    const result = await sendWhatsApp(input.clientPhone, 'invoice_received', {
      name: input.clientName,
      pro_name: input.proName,
      amount: input.amount,
      link: input.paymentLink,
    })
    records.push({
      professional_id: input.professionalId,
      appointment_id: null,
      payment_id: input.paymentId,
      recipient: 'client',
      phone: input.clientPhone,
      template: 'invoice_received',
      status: 'sent',
      twilio_sid: result.sid,
    })
  } catch {
    records.push({
      professional_id: input.professionalId,
      appointment_id: null,
      payment_id: input.paymentId,
      recipient: 'client',
      phone: input.clientPhone,
      template: 'invoice_received',
      status: 'failed',
    })
  }
  await persistNotifications(records)
}
