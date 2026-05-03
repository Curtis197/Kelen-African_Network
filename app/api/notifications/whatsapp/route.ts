import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, WhatsAppTemplate } from '@/lib/whatsapp'
import { createClient as createServiceClient } from '@/lib/supabase/service'

// Internal-only route — requires INTERNAL_API_SECRET header
export async function POST(request: NextRequest) {
  const internalSecret = process.env.INTERNAL_API_SECRET
  if (!internalSecret) {
    console.error('[notifications/whatsapp] INTERNAL_API_SECRET is not set — route is disabled')
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== internalSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    to: string
    template: WhatsAppTemplate
    params: Record<string, string>
    professional_id: string
    payment_id?: string
    appointment_id?: string
    recipient: 'client' | 'pro'
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    const result = await sendWhatsApp(body.to, body.template, body.params)

    await supabase.from('whatsapp_notifications').insert({
      professional_id: body.professional_id,
      recipient: body.recipient,
      phone: body.to,
      template: body.template,
      status: 'sent',
      twilio_sid: result.sid,
      payment_id: body.payment_id ?? null,
      appointment_id: body.appointment_id ?? null,
    })

    return NextResponse.json({ sid: result.sid, status: result.status })
  } catch (err) {
    await supabase.from('whatsapp_notifications').insert({
      professional_id: body.professional_id,
      recipient: body.recipient,
      phone: body.to,
      template: body.template,
      status: 'failed',
      payment_id: body.payment_id ?? null,
      appointment_id: body.appointment_id ?? null,
    })

    console.error('[notifications/whatsapp] Send failed', String(err))
    return NextResponse.json({ error: 'Message send failed' }, { status: 500 })
  }
}
