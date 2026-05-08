/**
 * Orange Money Web Pay API client.
 * Covers Francophone West Africa: SN (Senegal), CI (Côte d'Ivoire),
 * ML (Mali), BF (Burkina Faso), CM (Cameroon), GN (Guinea).
 *
 * Docs: https://developer.orange.com/apis/om-webpay-prod/getting-started
 */

const OM_BASE = 'https://api.orange.com'

// ── Auth ─────────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const clientId = process.env.ORANGE_MONEY_CLIENT_ID
  const clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Orange Money credentials not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${OM_BASE}/oauth/v3/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()
  if (!data.access_token) {
    throw new Error(data.error_description ?? 'Failed to get Orange Money access token')
  }
  return data.access_token as string
}

// ── Payment initiation ────────────────────────────────────────────────────────

export interface OrangePaymentInit {
  payToken: string
  notifToken: string
  paymentUrl: string
  orderId: string
}

/**
 * Initiate an Orange Money Web Payment.
 * The customer is redirected to `paymentUrl` to confirm via USSD or PIN.
 * Orange Money POSTs to `notifUrl` on completion.
 *
 * @param country ISO2 country code in lowercase: 'sn' | 'ci' | 'ml' | 'bf' | 'cm' | 'gn'
 */
export async function initiatePayment(params: {
  orderId: string
  amount: number
  currency: string
  notifUrl: string
  returnUrl: string
  cancelUrl: string
  country?: string
}): Promise<OrangePaymentInit> {
  const merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY
  if (!merchantKey) throw new Error('ORANGE_MONEY_MERCHANT_KEY not configured')

  const token = await getAccessToken()
  const cc = (params.country ?? 'sn').toLowerCase()

  const res = await fetch(`${OM_BASE}/orange-money-webpay/${cc}/v1/webpayment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      merchant_key: merchantKey,
      currency: params.currency.toUpperCase(),
      order_id: params.orderId,
      amount: params.amount,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      notif_url: params.notifUrl,
      lang: 'fr',
      reference: params.orderId,
    }),
  })

  const data = await res.json()
  if (!data.payment_url) {
    throw new Error(data.message ?? data.description ?? 'Orange Money: failed to initiate payment')
  }

  return {
    payToken: data.pay_token ?? '',
    notifToken: data.notif_token ?? '',
    paymentUrl: data.payment_url,
    orderId: params.orderId,
  }
}

// ── Status check ──────────────────────────────────────────────────────────────

export interface OrangePaymentStatus {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'EXPIRED' | string
  amount: number
  currency: string
  orderId: string
}

/** Poll Orange Money for the current status of a payment by order ID. */
export async function getPaymentStatus(
  orderId: string,
  country?: string
): Promise<OrangePaymentStatus> {
  const token = await getAccessToken()
  const cc = (country ?? 'sn').toLowerCase()

  const res = await fetch(
    `${OM_BASE}/orange-money-webpay/${cc}/v1/webpayment?order_id=${encodeURIComponent(orderId)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
  )

  const data = await res.json()
  return {
    status: data.status ?? 'PENDING',
    amount: Number(data.amount ?? 0),
    currency: data.currency ?? 'XOF',
    orderId,
  }
}

// ── Webhook validation ────────────────────────────────────────────────────────

/**
 * Validate an incoming Orange Money callback.
 * Orange Money sends `notif_token` in the POST body; compare it against
 * the token returned at payment initiation (stored in the payments table).
 */
export function validateCallback(notifToken: string, storedToken: string): boolean {
  if (!notifToken || !storedToken) return false
  return notifToken === storedToken
}
