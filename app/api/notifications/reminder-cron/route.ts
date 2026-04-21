import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { sendWhatsApp } from '@/lib/whatsapp'
import { format } from 'date-fns'

// Called by Vercel Cron at 09:00 UTC daily
// Requires CRON_SECRET as Bearer token
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Appointments starting in the next 24 hours that have a client phone
  const { data: appointments } = await supabase
    .from('pro_appointments')
    .select('id, pro_id, client_name, client_phone, starts_at, professionals(business_name, whatsapp_phone)')
    .gte('starts_at', now.toISOString())
    .lte('starts_at', in24h.toISOString())
    .eq('status', 'confirmed')
    .not('client_phone', 'is', null)

  if (!appointments?.length) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const apt of appointments) {
    const pro = (apt.professionals as unknown as { business_name: string; whatsapp_phone: string | null } | null)
    const date = new Date(apt.starts_at)

    try {
      const result = await sendWhatsApp(apt.client_phone!, 'appointment_reminder', {
        pro_name: pro?.business_name ?? '',
        time: format(date, 'HH:mm'),
        location: '',
      })

      await supabase.from('whatsapp_notifications').insert({
        professional_id: apt.pro_id,
        appointment_id: apt.id,
        recipient: 'client',
        phone: apt.client_phone!,
        template: 'appointment_reminder',
        status: 'sent',
        twilio_sid: result.sid,
      })

      sent++
    } catch {
      await supabase.from('whatsapp_notifications').insert({
        professional_id: apt.pro_id,
        appointment_id: apt.id,
        recipient: 'client',
        phone: apt.client_phone!,
        template: 'appointment_reminder',
        status: 'failed',
      })
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
