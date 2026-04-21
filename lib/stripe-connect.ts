import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export async function createConnectAccount(email: string, professionalId: string) {
  return stripe.accounts.create({
    type: 'express',
    email,
    metadata: { professional_id: professionalId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}

export async function createOnboardingLink(
  stripeAccountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  return stripe.accountLinks.create({
    account: stripeAccountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })
}

export async function getConnectAccountStatus(stripeAccountId: string) {
  const account = await stripe.accounts.retrieve(stripeAccountId)
  return {
    onboarded: account.details_submitted && account.charges_enabled,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  }
}

export async function createExpressDashboardLink(stripeAccountId: string) {
  return stripe.accounts.createLoginLink(stripeAccountId)
}

export async function createCheckoutSession(params: {
  stripeAccountId: string
  serviceName: string
  amount: number
  currency: string
  clientEmail: string
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
}) {
  return stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: { name: params.serviceName },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: params.clientEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    },
    { stripeAccount: params.stripeAccountId }
  )
}

export async function createPaymentLink(params: {
  stripeAccountId: string
  serviceName: string
  amount: number
  currency: string
  metadata: Record<string, string>
}) {
  const price = await stripe.prices.create(
    {
      currency: params.currency,
      unit_amount: params.amount,
      product_data: { name: params.serviceName },
    },
    { stripeAccount: params.stripeAccountId }
  )

  return stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: params.metadata,
    },
    { stripeAccount: params.stripeAccountId }
  )
}
