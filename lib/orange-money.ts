/**
 * CinetPay payment client — supports Orange Money, MTN, Moov, Wave, and card
 * across CI, SN, ML, BF, CM, TG, NE, CD.
 *
 * Docs: https://docs.cinetpay.com/api/
 *
 * Flow:
 *  1. initPayment()       → payment_url to redirect the user
 *  2. CinetPay POSTs to notify_url (webhook) with cpm_trans_id
 *  3. getPaymentStatus()  → confirm before fulfilling order
 */

const CINETPAY_BASE = 'https://api-checkout.cinetpay.com/v2'

function getConfig() {
  const apiKey = process.env.CINETPAY_API_KEY
  const siteId = process.env.CINETPAY_SITE_ID

  if (!apiKey || !siteId) {
    throw new Error('CINETPAY_API_KEY and CINETPAY_SITE_ID must be set')
  }

  return { apiKey, siteId }
}

export interface InitPaymentParams {
  /** Unique transaction ID — use your internal payment record ID */
  transactionId: string
  /** Amount in XOF (FCFA), e.g. 5000 for 5 000 F CFA. Minimum: 100 */
  amount: number
  /** Payment description shown to the customer */
  description: string
  /** URL to redirect after payment (success page) */
  returnUrl: string
  /** URL CinetPay will POST the notification to (your webhook) */
  notifyUrl: string
  /** Customer details — optional but recommended for fraud scoring */
  customer?: {
    name?: string
    surname?: string
    email?: string
    phone?: string
    /** ISO 3166-1 alpha-2, e.g. "CI", "SN" */
    country?: string
  }
  /**
   * Payment methods to offer:
   * "ALL" = all available methods
   * "MOBILE_MONEY" = only mobile money (Orange Money, MTN, Moov, Wave)
   * "CREDIT_CARD" = only card
   * Default: "ALL"
   */
  channels?: 'ALL' | 'MOBILE_MONEY' | 'CREDIT_CARD'
}

export interface InitPaymentResult {
  /** Redirect the user to this URL */
  paymentUrl: string
  /** CinetPay's payment token (store it if needed) */
  paymentToken: string
}

export async function initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
  const { apiKey, siteId } = getConfig()

  const body = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: params.transactionId,
    amount: params.amount,
    currency: 'XOF',
    description: params.description,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    channels: params.channels ?? 'ALL',
    customer_name: params.customer?.name ?? '',
    customer_surname: params.customer?.surname ?? '',
    customer_email: params.customer?.email ?? '',
    customer_phone_number: params.customer?.phone ?? '',
    customer_address: '',
    customer_city: '',
    customer_country: params.customer?.country ?? 'CI',
    customer_state: params.customer?.country ?? 'CI',
    customer_zip: '00000',
    lang: 'fr',
  }

  const res = await fetch(`${CINETPAY_BASE}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data.code !== '201') {
    throw new Error(`CinetPay initPayment failed: ${data.message} — ${JSON.stringify(data)}`)
  }

  return {
    paymentUrl: data.data.payment_url,
    paymentToken: data.data.payment_token ?? '',
  }
}

export interface PaymentStatus {
  /** "ACCEPTED" | "REFUSED" | "PENDING" | "CANCELLED" */
  status: string
  /** e.g. "ORANGE_MONEY", "MTN", "WAVE", "CREDIT_CARD" */
  paymentMethod: string | null
  amount: number
  currency: string
  message: string
}

export async function getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
  const { apiKey, siteId } = getConfig()

  const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: transactionId }),
  })

  const data = await res.json()

  return {
    status: data.data?.status ?? 'UNKNOWN',
    paymentMethod: data.data?.payment_method ?? null,
    amount: data.data?.amount ?? 0,
    currency: data.data?.currency ?? 'XOF',
    message: data.message ?? '',
  }
}
