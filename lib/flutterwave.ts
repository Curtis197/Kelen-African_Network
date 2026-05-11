/**
 * Flutterwave Standard Checkout — Orange Money, MTN, Moov, Wave, card
 * Supports XOF (CI, SN, ML, BF, TG) and XAF (CM).
 *
 * Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
 *
 * Flow:
 *  1. initPayment()  → payment link, redirect the user there
 *  2. User pays, Flutterwave redirects to return_url with ?transaction_id=&tx_ref=&status=
 *  3. Flutterwave also POSTs to your webhook URL
 *  4. verifyTransaction() to confirm before fulfilling the order
 */

const FLW_BASE = 'https://api.flutterwave.com/v3'

function getSecretKey(): string {
  // Note: env var has a typo (CLENT), kept as-is to match .env.local
  const key = process.env.FLUTTERWAVE_CLENT_SECRET ?? process.env.FLUTTERWAVE_CLIENT_SECRET
  if (!key) throw new Error('FLUTTERWAVE_CLENT_SECRET is not configured')
  return key
}

export interface InitPaymentParams {
  /** Your internal payment ID — used as tx_ref */
  transactionRef: string
  /** Amount in the chosen currency (XOF or XAF) */
  amount: number
  /** "XOF" for CI/SN/ML/BF/TG, "XAF" for CM. Default: "XOF" */
  currency?: string
  /** Description shown on the checkout page */
  description: string
  /** URL Flutterwave redirects to after payment (appends ?transaction_id=&tx_ref=&status=) */
  redirectUrl: string
  customer: {
    email: string
    name: string
    phone?: string
  }
  /** Restrict to mobile money only. Default: all methods. */
  mobileMoneyOnly?: boolean
  meta?: Record<string, string>
}

export interface InitPaymentResult {
  /** Redirect the user to this URL */
  paymentLink: string
}

export async function initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
  const body: Record<string, unknown> = {
    tx_ref: params.transactionRef,
    amount: params.amount,
    currency: params.currency ?? 'XOF',
    redirect_url: params.redirectUrl,
    customer: {
      email: params.customer.email,
      name: params.customer.name,
      phonenumber: params.customer.phone ?? '',
    },
    customizations: {
      title: 'Kelen Africa',
      description: params.description,
      logo: 'https://kelen.africa/logo.png',
    },
    meta: params.meta ?? {},
  }

  if (params.mobileMoneyOnly) {
    // mobilemoneyfranc = XOF zone mobile money (Orange Money, MTN, Moov, Wave)
    body.payment_options = 'mobilemoneyfranc'
  }

  const res = await fetch(`${FLW_BASE}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data.status !== 'success' || !data.data?.link) {
    throw new Error(`Flutterwave initPayment failed: ${data.message ?? JSON.stringify(data)}`)
  }

  return { paymentLink: data.data.link }
}

export interface TransactionVerification {
  /** "successful" | "failed" | "pending" */
  status: string
  amount: number
  currency: string
  /** e.g. "ORANGE-MONEY-CI", "MTN-SN", "card" */
  paymentType: string | null
  flwRef: string | null
  txRef: string
}

export async function verifyTransaction(transactionId: string): Promise<TransactionVerification> {
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
  })

  const data = await res.json()

  if (data.status !== 'success') {
    throw new Error(`Flutterwave verify failed: ${data.message ?? JSON.stringify(data)}`)
  }

  const tx = data.data
  return {
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    paymentType: tx.payment_type ?? null,
    flwRef: tx.flw_ref ?? null,
    txRef: tx.tx_ref,
  }
}

/**
 * Verify the webhook secret to ensure the notification is genuinely from Flutterwave.
 * Set FLUTTERWAVE_WEBHOOK_SECRET in your dashboard and env vars.
 */
export function verifyWebhookSignature(
  receivedHash: string | null
): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET
  if (!secret) return false
  return receivedHash === secret
}
