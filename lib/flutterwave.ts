import { createHmac } from 'crypto'

const FLW_BASE = 'https://api.flutterwave.com/v3'

function secretKey(): string {
  const k = process.env.FLW_SECRET_KEY
  if (!k) throw new Error('FLW_SECRET_KEY not configured')
  return k
}

async function flwPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${FLW_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.status !== 'success') throw new Error(data.message ?? 'Flutterwave error')
  return data.data as T
}

async function flwGet<T>(path: string): Promise<T> {
  const res = await fetch(`${FLW_BASE}${path}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  })
  const data = await res.json()
  if (data.status !== 'success') throw new Error(data.message ?? 'Flutterwave error')
  return data.data as T
}

// ── Subaccounts (split payments) ─────────────────────────────────────────────

export interface FlwSubaccount {
  subaccount_id: string
  bank_name: string
  account_number: string
  business_name: string
}

/**
 * Create a Flutterwave split-payment subaccount for a professional.
 * The platform takes a 5% fee; remainder goes to the pro's bank/mobile account.
 */
export async function createSubaccount(params: {
  businessName: string
  email: string
  bankCode: string       // e.g. '090405' for Orange Money SN, or local bank code
  accountNumber: string  // bank account or mobile money number
  country?: string       // ISO2 country code, defaults to 'SN'
}): Promise<FlwSubaccount> {
  return flwPost('/subaccounts', {
    account_bank: params.bankCode,
    account_number: params.accountNumber,
    business_name: params.businessName,
    business_email: params.email,
    business_contact: params.businessName,
    business_mobile: params.accountNumber,
    country: params.country ?? 'SN',
    split_type: 'percentage',
    split_value: 0.05, // 5% platform fee
  })
}

// ── Checkout (one-time & subscription) ───────────────────────────────────────

export interface FlwCheckout {
  link: string
}

/**
 * Create a Flutterwave hosted checkout (booking deposit or invoice).
 * Amount must be in the currency's natural unit (XOF: 3000, EUR: 15.00).
 */
export async function createCheckout(params: {
  txRef: string
  amount: number
  currency: string
  clientEmail: string
  clientName: string
  description: string
  redirectUrl: string
  subaccountId?: string
  paymentPlanId?: number
  meta?: Record<string, string>
}): Promise<FlwCheckout> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kelen.africa'
  return flwPost('/payments', {
    tx_ref: params.txRef,
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    redirect_url: params.redirectUrl,
    customer: {
      email: params.clientEmail,
      name: params.clientName,
    },
    customizations: {
      title: 'Kelen',
      description: params.description,
      logo: `${siteUrl}/logo.png`,
    },
    ...(params.subaccountId && {
      subaccounts: [{ id: params.subaccountId }],
    }),
    ...(params.paymentPlanId !== undefined && { payment_plan: params.paymentPlanId }),
    ...(params.meta && { meta: params.meta }),
  })
}

// ── Payment plans (subscriptions) ────────────────────────────────────────────

export interface FlwPaymentPlan {
  id: number
  name: string
  amount: number
  interval: string
  currency: string
  status: string
}

/** Create a recurring monthly/yearly payment plan in Flutterwave. */
export async function createPaymentPlan(params: {
  name: string
  amount: number
  currency: string
  interval: 'monthly' | 'yearly'
}): Promise<FlwPaymentPlan> {
  return flwPost('/payment-plans', {
    amount: params.amount,
    name: params.name,
    interval: params.interval,
    currency: params.currency.toUpperCase(),
  })
}

// ── Transaction verification ──────────────────────────────────────────────────

export interface FlwTransaction {
  id: number
  tx_ref: string
  status: string   // 'successful' | 'failed' | 'pending'
  amount: number
  currency: string
  customer: { email: string; name: string; phone_number?: string }
  meta: Record<string, string> | null
}

/** Verify a completed transaction by its Flutterwave transaction ID. */
export async function verifyTransaction(txId: string | number): Promise<FlwTransaction> {
  return flwGet(`/transactions/${txId}/verify`)
}

// ── Webhook verification ──────────────────────────────────────────────────────

/**
 * Verify the webhook came from Flutterwave using HMAC-SHA256.
 * Flutterwave sends the hash in the `verif-hash` header.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.FLW_WEBHOOK_SECRET
  if (!secret) return false
  const hash = createHmac('sha256', secret).update(rawBody).digest('hex')
  return hash === signature
}
