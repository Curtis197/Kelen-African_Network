import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Stripe before importing the module under test
vi.mock('stripe', () => {
  const mockStripe = {
    accounts: {
      create: vi.fn(),
      retrieve: vi.fn(),
      createLoginLink: vi.fn(),
    },
    accountLinks: {
      create: vi.fn(),
    },
    checkout: {
      sessions: { create: vi.fn() },
    },
    prices: {
      create: vi.fn(),
    },
    paymentLinks: {
      create: vi.fn(),
    },
  }
  const MockStripe = vi.fn(function () { return mockStripe })
  return { default: MockStripe }
})

import Stripe from 'stripe'
import {
  createConnectAccount,
  createOnboardingLink,
  getConnectAccountStatus,
  createExpressDashboardLink,
  createCheckoutSession,
  createPaymentLink,
} from '../stripe-connect'

const mockStripe = new (Stripe as any)() as any

beforeEach(() => vi.clearAllMocks())

describe('createConnectAccount', () => {
  it('creates an express account with correct params', async () => {
    mockStripe.accounts.create.mockResolvedValue({ id: 'acct_123' })
    const result = await createConnectAccount('test@email.com', 'pro_abc')
    expect(mockStripe.accounts.create).toHaveBeenCalledWith({
      type: 'express',
      email: 'test@email.com',
      metadata: { professional_id: 'pro_abc' },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    expect(result.id).toBe('acct_123')
  })
})

describe('createOnboardingLink', () => {
  it('creates an account_onboarding link', async () => {
    mockStripe.accountLinks.create.mockResolvedValue({ url: 'https://connect.stripe.com/setup/...' })
    const result = await createOnboardingLink('acct_123', 'https://app.com/return', 'https://app.com/refresh')
    expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
      account: 'acct_123',
      return_url: 'https://app.com/return',
      refresh_url: 'https://app.com/refresh',
      type: 'account_onboarding',
    })
    expect(result.url).toBe('https://connect.stripe.com/setup/...')
  })
})

describe('getConnectAccountStatus', () => {
  it('returns onboarded true when details_submitted and charges_enabled', async () => {
    mockStripe.accounts.retrieve.mockResolvedValue({
      details_submitted: true,
      charges_enabled: true,
      payouts_enabled: true,
    })
    const result = await getConnectAccountStatus('acct_123')
    expect(result).toEqual({ onboarded: true, chargesEnabled: true, payoutsEnabled: true })
  })

  it('returns onboarded false when charges not enabled', async () => {
    mockStripe.accounts.retrieve.mockResolvedValue({
      details_submitted: false,
      charges_enabled: false,
      payouts_enabled: false,
    })
    const result = await getConnectAccountStatus('acct_123')
    expect(result.onboarded).toBe(false)
  })
})

describe('createCheckoutSession', () => {
  it('creates a session on the connected account', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/...', id: 'cs_123' })
    const result = await createCheckoutSession({
      stripeAccountId: 'acct_123',
      serviceName: 'Plumbing repair',
      amount: 5000,
      currency: 'eur',
      clientEmail: 'client@test.com',
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel',
      metadata: { professional_id: 'pro_abc', payment_id: 'pay_xyz' },
    })
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'payment', customer_email: 'client@test.com' }),
      { stripeAccount: 'acct_123' }
    )
    expect(result.id).toBe('cs_123')
  })
})

describe('createPaymentLink', () => {
  it('creates a price then a payment link on the connected account', async () => {
    mockStripe.prices.create.mockResolvedValue({ id: 'price_123' })
    mockStripe.paymentLinks.create.mockResolvedValue({ url: 'https://buy.stripe.com/...', id: 'plink_123' })
    const result = await createPaymentLink({
      stripeAccountId: 'acct_123',
      serviceName: 'Roof repair',
      amount: 20000,
      currency: 'eur',
      metadata: { professional_id: 'pro_abc', payment_id: 'pay_xyz' },
    })
    expect(mockStripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ unit_amount: 20000, currency: 'eur' }),
      { stripeAccount: 'acct_123' }
    )
    expect(result.url).toBe('https://buy.stripe.com/...')
  })
})
