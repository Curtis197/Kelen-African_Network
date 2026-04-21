import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('twilio', () => {
  const mockClient = {
    messages: {
      create: vi.fn(),
    },
  }
  return { default: vi.fn(function() { return mockClient }) }
})

import twilio from 'twilio'
import { sendWhatsApp } from '../whatsapp'

const mockClient = new (twilio as any)() as any

beforeEach(() => vi.clearAllMocks())

describe('sendWhatsApp', () => {
  it('formats the to number with whatsapp: prefix', async () => {
    mockClient.messages.create.mockResolvedValue({ sid: 'SM123', status: 'queued' })
    await sendWhatsApp('+33612345678', 'booking_confirmed_no_payment', {
      name: 'Jean',
      pro_name: 'Plomberie Martin',
      date: '25 avril',
      time: '10:00',
    })
    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'whatsapp:+33612345678' })
    )
  })

  it('returns sid and status', async () => {
    mockClient.messages.create.mockResolvedValue({ sid: 'SM999', status: 'sent' })
    const result = await sendWhatsApp('+33612345678', 'pro_payment_received', {
      client_name: 'Sophie',
      amount: '€120.00',
      service: 'Peinture',
    })
    expect(result).toEqual({ sid: 'SM999', status: 'sent' })
  })

  it('interpolates booking_confirmed_no_payment template correctly', async () => {
    mockClient.messages.create.mockResolvedValue({ sid: 'SM1', status: 'queued' })
    await sendWhatsApp('+33600000000', 'booking_confirmed_no_payment', {
      name: 'Alice',
      pro_name: 'Garage Dupont',
      date: '1 mai',
      time: '14:30',
    })
    const call = mockClient.messages.create.mock.calls[0][0]
    expect(call.body).toContain('Alice')
    expect(call.body).toContain('Garage Dupont')
    expect(call.body).toContain('1 mai')
    expect(call.body).toContain('14:30')
  })

  it('interpolates pro_new_booking template correctly', async () => {
    mockClient.messages.create.mockResolvedValue({ sid: 'SM2', status: 'queued' })
    await sendWhatsApp('+33611111111', 'pro_new_booking', {
      client_name: 'Bob',
      date: '2 mai',
      time: '09:00',
      service: 'Vidange',
    })
    const call = mockClient.messages.create.mock.calls[0][0]
    expect(call.body).toContain('Bob')
    expect(call.body).toContain('Vidange')
  })
})
