import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../whatsapp', () => ({
  sendWhatsApp: vi.fn().mockResolvedValue({ sid: 'SM_test', status: 'queued' }),
}))

vi.mock('@/lib/supabase/service', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

import { sendWhatsApp } from '../whatsapp'
import { notifyBookingConfirmed, notifyPaymentReceived } from '../notifications'

beforeEach(() => vi.clearAllMocks())

describe('notifyBookingConfirmed', () => {
  const base = {
    professionalId: 'pro_1',
    appointmentId: 'apt_1',
    clientName: 'Jean',
    proPhone: '+33611111111',
    proName: 'Plomberie Martin',
    serviceName: 'Débouchage',
    startsAt: '2026-05-01T10:00:00Z',
    withPayment: false,
  }

  it('sends pro_new_booking to pro when proPhone is set', async () => {
    await notifyBookingConfirmed({ ...base, clientPhone: null })
    expect(sendWhatsApp).toHaveBeenCalledWith(
      '+33611111111',
      'pro_new_booking',
      expect.objectContaining({ client_name: 'Jean', service: 'Débouchage' })
    )
  })

  it('sends booking_confirmed_no_payment to client when clientPhone is set', async () => {
    await notifyBookingConfirmed({ ...base, clientPhone: '+33699999999' })
    expect(sendWhatsApp).toHaveBeenCalledWith(
      '+33699999999',
      'booking_confirmed_no_payment',
      expect.objectContaining({ name: 'Jean', pro_name: 'Plomberie Martin' })
    )
  })

  it('sends booking_confirmed_with_payment when withPayment is true', async () => {
    await notifyBookingConfirmed({
      ...base,
      clientPhone: '+33699999999',
      withPayment: true,
      depositAmount: '€45.00',
    })
    expect(sendWhatsApp).toHaveBeenCalledWith(
      '+33699999999',
      'booking_confirmed_with_payment',
      expect.objectContaining({ amount: '€45.00' })
    )
  })

  it('skips client WhatsApp when clientPhone is null', async () => {
    await notifyBookingConfirmed({ ...base, clientPhone: null })
    const clientCalls = (sendWhatsApp as any).mock.calls.filter(
      ([, t]: [string, string]) => t.startsWith('booking_confirmed')
    )
    expect(clientCalls).toHaveLength(0)
  })

  it('skips pro WhatsApp when proPhone is null', async () => {
    await notifyBookingConfirmed({ ...base, clientPhone: null, proPhone: null })
    expect(sendWhatsApp).not.toHaveBeenCalled()
  })
})

describe('notifyPaymentReceived', () => {
  const base = {
    professionalId: 'pro_1',
    paymentId: 'pay_1',
    appointmentId: null,
    clientName: 'Sophie',
    proPhone: '+33611111111',
    proName: 'Garage Dupont',
    serviceName: 'Vidange',
    amount: '€85.00',
    paymentType: 'invoice' as const,
  }

  it('sends payment_receipt to client and pro_payment_received to pro', async () => {
    await notifyPaymentReceived({ ...base, clientPhone: '+33699999999' })
    const templates = (sendWhatsApp as any).mock.calls.map(([, t]: [string, string]) => t)
    expect(templates).toContain('payment_receipt')
    expect(templates).toContain('pro_payment_received')
  })

  it('skips client notification when clientPhone is null', async () => {
    await notifyPaymentReceived({ ...base, clientPhone: null })
    const templates = (sendWhatsApp as any).mock.calls.map(([, t]: [string, string]) => t)
    expect(templates).not.toContain('payment_receipt')
    expect(templates).toContain('pro_payment_received')
  })
})
