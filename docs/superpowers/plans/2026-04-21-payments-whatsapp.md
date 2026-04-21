# Payments & WhatsApp Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe Connect Express payment collection (booking deposit + invoice) and Twilio WhatsApp notifications to the Kelen platform for MVP Western market launch.

**Architecture:** Stripe Connect Express handles pro onboarding and payment splitting. Three new lib modules (`stripe-connect`, `whatsapp`, `notifications`) encapsulate external APIs. Existing booking route and webhook are extended — not replaced.

**Tech Stack:** Next.js 16 App Router, Supabase (service role), Stripe Connect Express, Twilio WhatsApp API, Vitest for unit tests.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `supabase/migrations/20260422000003_payments_whatsapp.sql` | DB schema |
| Create | `lib/stripe-connect.ts` | Stripe Connect API helpers |
| Create | `lib/whatsapp.ts` | Twilio client + message templates |
| Create | `lib/notifications.ts` | Orchestrate WhatsApp triggers |
| Create | `lib/__tests__/stripe-connect.test.ts` | Unit tests |
| Create | `lib/__tests__/whatsapp.test.ts` | Unit tests |
| Create | `lib/__tests__/notifications.test.ts` | Unit tests |
| Create | `vitest.config.ts` | Test runner config |
| Create | `app/api/stripe/connect/onboard/route.ts` | Create Express account |
| Create | `app/api/stripe/connect/status/route.ts` | Check onboarding state |
| Create | `app/api/stripe/connect/dashboard/route.ts` | Express dashboard link |
| Create | `app/api/stripe/checkout/route.ts` | Booking deposit checkout |
| Create | `app/api/stripe/invoice/route.ts` | Invoice payment link |
| Create | `app/api/notifications/whatsapp/route.ts` | Internal send endpoint |
| Create | `app/api/notifications/reminder-cron/route.ts` | Daily 24h reminders |
| Create | `vercel.json` | Cron schedule |
| Modify | `lib/google-calendar.ts` | Return appointment DB id |
| Modify | `app/api/stripe/webhook/route.ts` | Handle 3 new events |
| Modify | `app/api/calendar/[proId]/book/route.ts` | Trigger WhatsApp on booking |

---

## Task 1: Install Dependencies + Test Runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Twilio and Vitest**

```bash
npm install twilio
npm install -D vitest @vitest/coverage-v8
```

Expected: `node_modules/twilio` and `node_modules/vitest` appear. No errors.

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 4: Verify test runner works**

```bash
npx vitest run
```

Expected: "No test files found" (not an error — just nothing to run yet).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add twilio and vitest dependencies"
```

---

## Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/20260422000003_payments_whatsapp.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Migration: 20260422000003_payments_whatsapp.sql
-- Adds payment and WhatsApp notification tables for MVP

-- Stripe Connect account per professional
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   uuid UNIQUE NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  stripe_account_id text UNIQUE NOT NULL,
  onboarded         boolean NOT NULL DEFAULT false,
  payment_mode      text NOT NULL DEFAULT 'both',   -- 'booking' | 'invoice' | 'both'
  deposit_type      text NOT NULL DEFAULT 'fixed',  -- 'fixed' | 'percent'
  deposit_amount    numeric(10,2),
  deposit_percent   integer CHECK (deposit_percent BETWEEN 1 AND 100),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_connect_select_own"
  ON stripe_connect_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "stripe_connect_insert_own"
  ON stripe_connect_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "stripe_connect_update_own"
  ON stripe_connect_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Payment records (booking deposits + invoices)
CREATE TABLE IF NOT EXISTS payments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id         uuid NOT NULL REFERENCES professionals(id),
  stripe_payment_intent   text UNIQUE,
  stripe_checkout_session text,
  type                    text NOT NULL CHECK (type IN ('booking_deposit', 'invoice')),
  amount                  numeric(10,2) NOT NULL,
  currency                text NOT NULL DEFAULT 'eur',
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  client_name             text,
  client_phone            text,
  client_email            text,
  service_name            text,
  appointment_id          uuid REFERENCES pro_appointments(id),
  payment_link_url        text,
  paid_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- WhatsApp notification log
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id),
  recipient       text NOT NULL CHECK (recipient IN ('client', 'pro')),
  phone           text NOT NULL,
  template        text NOT NULL,
  status          text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  twilio_sid      text,
  payment_id      uuid REFERENCES payments(id),
  appointment_id  uuid REFERENCES pro_appointments(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_notifications_select_own"
  ON whatsapp_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Add WhatsApp phone and onboarding flag to professionals
ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected output: migration applied successfully, no errors. If you see "already exists" errors, the migration already ran — that's fine.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260422000003_payments_whatsapp.sql
git commit -m "feat: add payments and whatsapp_notifications schema migration"
```

---

## Task 3: lib/stripe-connect.ts + Tests

**Files:**
- Create: `lib/stripe-connect.ts`
- Create: `lib/__tests__/stripe-connect.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `lib/__tests__/stripe-connect.test.ts`:

```typescript
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
  return { default: vi.fn(() => mockStripe) }
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run lib/__tests__/stripe-connect.test.ts
```

Expected: FAIL — "Cannot find module '../stripe-connect'"

- [ ] **Step 3: Implement lib/stripe-connect.ts**

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run lib/__tests__/stripe-connect.test.ts
```

Expected: 5 test suites PASS, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/stripe-connect.ts lib/__tests__/stripe-connect.test.ts
git commit -m "feat: add stripe-connect lib with unit tests"
```

---

## Task 4: lib/whatsapp.ts + Tests

**Files:**
- Create: `lib/whatsapp.ts`
- Create: `lib/__tests__/whatsapp.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/whatsapp.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('twilio', () => {
  const mockClient = {
    messages: {
      create: vi.fn(),
    },
  }
  return { default: vi.fn(() => mockClient) }
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run lib/__tests__/whatsapp.test.ts
```

Expected: FAIL — "Cannot find module '../whatsapp'"

- [ ] **Step 3: Implement lib/whatsapp.ts**

```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const FROM = process.env.TWILIO_WHATSAPP_NUMBER!

export type WhatsAppTemplate =
  | 'booking_confirmed_no_payment'
  | 'booking_confirmed_with_payment'
  | 'appointment_reminder'
  | 'invoice_received'
  | 'payment_receipt'
  | 'pro_new_booking'
  | 'pro_payment_received'

const templates: Record<WhatsAppTemplate, (p: Record<string, string>) => string> = {
  booking_confirmed_no_payment: (p) =>
    `Hi ${p.name}, your appointment with ${p.pro_name} is confirmed for ${p.date} at ${p.time}. See you soon!`,
  booking_confirmed_with_payment: (p) =>
    `Hi ${p.name}, your booking with ${p.pro_name} on ${p.date} at ${p.time} is confirmed. Deposit of ${p.amount} received.`,
  appointment_reminder: (p) =>
    `Reminder: your appointment with ${p.pro_name} is tomorrow at ${p.time}. Address: ${p.location}`,
  invoice_received: (p) =>
    `Hi ${p.name}, ${p.pro_name} sent you an invoice for ${p.amount}. Pay here: ${p.link}`,
  payment_receipt: (p) =>
    `Payment confirmed. ${p.amount} received by ${p.pro_name}. Thank you!`,
  pro_new_booking: (p) =>
    `New booking from ${p.client_name} on ${p.date} at ${p.time}. Service: ${p.service}`,
  pro_payment_received: (p) =>
    `${p.client_name} just paid ${p.amount} for ${p.service}. Check your dashboard.`,
}

export async function sendWhatsApp(
  to: string,
  template: WhatsAppTemplate,
  params: Record<string, string>
): Promise<{ sid: string; status: string }> {
  const body = templates[template](params)
  const message = await client.messages.create({
    from: FROM,
    to: `whatsapp:${to}`,
    body,
  })
  return { sid: message.sid, status: message.status as string }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run lib/__tests__/whatsapp.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp.ts lib/__tests__/whatsapp.test.ts
git commit -m "feat: add whatsapp lib with Twilio templates and unit tests"
```

---

## Task 5: lib/notifications.ts + Tests

**Files:**
- Create: `lib/notifications.ts`
- Create: `lib/__tests__/notifications.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/notifications.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run lib/__tests__/notifications.test.ts
```

Expected: FAIL — "Cannot find module '../notifications'"

- [ ] **Step 3: Implement lib/notifications.ts**

```typescript
import { sendWhatsApp } from '@/lib/whatsapp'
import { createClient } from '@/lib/supabase/service'
import { format } from 'date-fns'

type NotificationRecord = {
  professional_id: string
  appointment_id: string | null
  payment_id?: string
  recipient: 'client' | 'pro'
  phone: string
  template: string
  status: 'sent' | 'failed'
  twilio_sid?: string
}

async function persistNotifications(records: NotificationRecord[]) {
  if (records.length === 0) return
  const supabase = createClient()
  await supabase.from('whatsapp_notifications').insert(records)
}

function formatDateTime(isoString: string) {
  const date = new Date(isoString)
  return {
    date: format(date, 'd MMMM yyyy'),
    time: format(date, 'HH:mm'),
  }
}

export type BookingNotificationInput = {
  professionalId: string
  appointmentId: string | null
  clientName: string
  clientPhone: string | null
  proPhone: string | null
  proName: string
  serviceName: string
  startsAt: string
  withPayment: boolean
  depositAmount?: string
  location?: string
}

export async function notifyBookingConfirmed(input: BookingNotificationInput) {
  const { date, time } = formatDateTime(input.startsAt)
  const records: NotificationRecord[] = []

  if (input.clientPhone) {
    const template = input.withPayment
      ? 'booking_confirmed_with_payment'
      : 'booking_confirmed_no_payment'
    const params: Record<string, string> = {
      name: input.clientName,
      pro_name: input.proName,
      date,
      time,
      ...(input.withPayment && { amount: input.depositAmount ?? '' }),
    }
    try {
      const result = await sendWhatsApp(input.clientPhone, template, params)
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'client',
        phone: input.clientPhone,
        template,
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'client',
        phone: input.clientPhone,
        template,
        status: 'failed',
      })
    }
  }

  if (input.proPhone) {
    try {
      const result = await sendWhatsApp(input.proPhone, 'pro_new_booking', {
        client_name: input.clientName,
        date,
        time,
        service: input.serviceName,
      })
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_new_booking',
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_new_booking',
        status: 'failed',
      })
    }
  }

  await persistNotifications(records)
}

export type PaymentNotificationInput = {
  professionalId: string
  paymentId: string
  appointmentId: string | null
  clientName: string
  clientPhone: string | null
  proPhone: string | null
  proName: string
  serviceName: string
  amount: string
  paymentType: 'booking_deposit' | 'invoice'
}

export async function notifyPaymentReceived(input: PaymentNotificationInput) {
  const records: NotificationRecord[] = []

  if (input.clientPhone) {
    try {
      const result = await sendWhatsApp(input.clientPhone, 'payment_receipt', {
        amount: input.amount,
        pro_name: input.proName,
      })
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'client',
        phone: input.clientPhone,
        template: 'payment_receipt',
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'client',
        phone: input.clientPhone,
        template: 'payment_receipt',
        status: 'failed',
      })
    }
  }

  if (input.proPhone) {
    try {
      const result = await sendWhatsApp(input.proPhone, 'pro_payment_received', {
        client_name: input.clientName,
        amount: input.amount,
        service: input.serviceName,
      })
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_payment_received',
        status: 'sent',
        twilio_sid: result.sid,
      })
    } catch {
      records.push({
        professional_id: input.professionalId,
        appointment_id: input.appointmentId,
        payment_id: input.paymentId,
        recipient: 'pro',
        phone: input.proPhone,
        template: 'pro_payment_received',
        status: 'failed',
      })
    }
  }

  await persistNotifications(records)
}

export async function notifyInvoiceSent(input: {
  professionalId: string
  paymentId: string
  clientName: string
  clientPhone: string
  proName: string
  amount: string
  paymentLink: string
}) {
  const records: NotificationRecord[] = []
  try {
    const result = await sendWhatsApp(input.clientPhone, 'invoice_received', {
      name: input.clientName,
      pro_name: input.proName,
      amount: input.amount,
      link: input.paymentLink,
    })
    records.push({
      professional_id: input.professionalId,
      appointment_id: null,
      payment_id: input.paymentId,
      recipient: 'client',
      phone: input.clientPhone,
      template: 'invoice_received',
      status: 'sent',
      twilio_sid: result.sid,
    })
  } catch {
    records.push({
      professional_id: input.professionalId,
      appointment_id: null,
      payment_id: input.paymentId,
      recipient: 'client',
      phone: input.clientPhone,
      template: 'invoice_received',
      status: 'failed',
    })
  }
  await persistNotifications(records)
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run lib/__tests__/notifications.test.ts
```

Expected: 7 tests PASS.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests from Tasks 3, 4, 5 pass. 0 failures.

- [ ] **Step 6: Commit**

```bash
git add lib/notifications.ts lib/__tests__/notifications.test.ts
git commit -m "feat: add notifications orchestration lib with unit tests"
```

---

## Task 6: Update google-calendar.ts to Return Appointment ID

**Files:**
- Modify: `lib/google-calendar.ts` (line ~289)

The booking route needs the `pro_appointments` row id to link payments. Currently `createAppointment` discards it.

- [ ] **Step 1: Update createAppointment to select and return the DB id**

Find the `createAppointment` function (around line 253). Replace the insert block:

```typescript
// BEFORE (around line 289):
  await supabase.from("pro_appointments").insert({
    pro_id: proId,
    google_event_id: googleEventId,
    client_name: input.clientName,
    client_email: input.clientEmail,
    client_phone: input.clientPhone ?? null,
    reason: input.reason ?? null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: "confirmed",
  });

  return { googleEventId };
```

```typescript
// AFTER:
  const { data: appointment } = await supabase
    .from("pro_appointments")
    .insert({
      pro_id: proId,
      google_event_id: googleEventId,
      client_name: input.clientName,
      client_email: input.clientEmail,
      client_phone: input.clientPhone ?? null,
      reason: input.reason ?? null,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "confirmed",
    })
    .select("id")
    .single();

  return { googleEventId, appointmentId: appointment?.id ?? null };
```

Also update the return type on the function signature (around line 256):

```typescript
// BEFORE:
): Promise<{ googleEventId: string }> {
```

```typescript
// AFTER:
): Promise<{ googleEventId: string; appointmentId: string | null }> {
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If the compiler complains about destructuring in `app/api/calendar/[proId]/book/route.ts`, that's fine — we update that route in Task 13.

- [ ] **Step 3: Commit**

```bash
git add lib/google-calendar.ts
git commit -m "feat: return appointment DB id from createAppointment"
```

---

## Task 7: Connect Onboard API Route

**Files:**
- Create: `app/api/stripe/connect/onboard/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe-connect'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { professional_id } = await request.json()
  if (!professional_id) {
    return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })
  }

  // Verify this pro belongs to the authenticated user
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, email')
    .eq('id', professional_id)
    .eq('user_id', user.id)
    .single()

  if (!pro) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

  // Check if account already exists
  const { data: existing } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  let stripeAccountId: string

  if (existing) {
    stripeAccountId = existing.stripe_account_id
  } else {
    try {
      const account = await createConnectAccount(pro.email, professional_id)
      stripeAccountId = account.id
      await supabase.from('stripe_connect_accounts').insert({
        professional_id,
        stripe_account_id: stripeAccountId,
        onboarded: false,
      })
    } catch (err) {
      console.error('[connect/onboard] Stripe account creation failed', String(err))
      return NextResponse.json({ error: 'Failed to create Stripe account' }, { status: 500 })
    }
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!
  const link = await createOnboardingLink(
    stripeAccountId,
    `${origin}/dashboard/payments?onboarded=true`,
    `${origin}/dashboard/payments?refresh=true`
  )

  return NextResponse.json({ onboarding_url: link.url, stripe_account_id: stripeAccountId })
}
```

- [ ] **Step 2: Manual test with curl**

Start the dev server: `npm run dev`

```bash
# Replace TOKEN with a valid Supabase session token and PRO_ID with a real pro id
curl -X POST http://localhost:3000/api/stripe/connect/onboard \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"professional_id": "<pro_id>"}'
```

Expected: `{"onboarding_url": "https://connect.stripe.com/setup/...", "stripe_account_id": "acct_..."}`

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/connect/onboard/route.ts
git commit -m "feat: add stripe connect onboard API route"
```

---

## Task 8: Connect Status + Dashboard Routes

**Files:**
- Create: `app/api/stripe/connect/status/route.ts`
- Create: `app/api/stripe/connect/dashboard/route.ts`

- [ ] **Step 1: Create status route**

```typescript
// app/api/stripe/connect/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnectAccountStatus } from '@/lib/stripe-connect'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const professionalId = request.nextUrl.searchParams.get('professional_id')
  if (!professionalId) {
    return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })
  }

  const { data: account } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded, payment_mode, deposit_type, deposit_amount, deposit_percent')
    .eq('professional_id', professionalId)
    .single()

  if (!account) {
    return NextResponse.json({ onboarded: false, hasAccount: false })
  }

  // If already marked onboarded in DB, trust it — avoid unnecessary Stripe calls
  if (account.onboarded) {
    return NextResponse.json({
      onboarded: true,
      hasAccount: true,
      paymentMode: account.payment_mode,
      depositType: account.deposit_type,
      depositAmount: account.deposit_amount,
      depositPercent: account.deposit_percent,
    })
  }

  // Otherwise verify with Stripe
  const status = await getConnectAccountStatus(account.stripe_account_id)
  return NextResponse.json({
    onboarded: status.onboarded,
    hasAccount: true,
    chargesEnabled: status.chargesEnabled,
    payoutsEnabled: status.payoutsEnabled,
  })
}
```

- [ ] **Step 2: Create dashboard link route**

```typescript
// app/api/stripe/connect/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExpressDashboardLink } from '@/lib/stripe-connect'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { professional_id } = await request.json()
  if (!professional_id) {
    return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })
  }

  const { data: account } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  const link = await createExpressDashboardLink(account.stripe_account_id)
  return NextResponse.json({ url: link.url })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/connect/status/route.ts app/api/stripe/connect/dashboard/route.ts
git commit -m "feat: add connect status and dashboard link routes"
```

---

## Task 9: Checkout Route (Booking Deposit)

**Files:**
- Create: `app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { createCheckoutSession } from '@/lib/stripe-connect'

export async function POST(request: NextRequest) {
  let body: {
    professional_id: string
    service_name: string
    amount: number
    currency?: string
    client_name: string
    client_email: string
    client_phone?: string
    appointment_id?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { professional_id, service_name, amount, client_name, client_email } = body
  if (!professional_id || !service_name || !amount || !client_name || !client_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: account } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  // Create a pending payment record first to get the id for metadata
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      professional_id,
      type: 'booking_deposit',
      amount: amount / 100, // convert cents to decimal
      currency: body.currency ?? 'eur',
      status: 'pending',
      client_name,
      client_email,
      client_phone: body.client_phone ?? null,
      service_name,
      appointment_id: body.appointment_id ?? null,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('[checkout] Failed to create payment record', insertError)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!

  try {
    const session = await createCheckoutSession({
      stripeAccountId: account.stripe_account_id,
      serviceName: service_name,
      amount,
      currency: body.currency ?? 'eur',
      clientEmail: client_email,
      successUrl: `${origin}/booking/success?payment_id=${payment.id}`,
      cancelUrl: `${origin}/booking/cancel`,
      metadata: {
        professional_id,
        payment_id: payment.id,
        appointment_id: body.appointment_id ?? '',
      },
    })

    // Save the checkout session id
    await supabase
      .from('payments')
      .update({ stripe_checkout_session: session.id })
      .eq('id', payment.id)

    return NextResponse.json({ checkout_url: session.url, payment_id: payment.id })
  } catch (err) {
    console.error('[checkout] Stripe checkout session creation failed', String(err))
    // Clean up the pending payment record
    await supabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Manual test**

```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "professional_id": "<pro_id>",
    "service_name": "Plumbing repair",
    "amount": 5000,
    "client_name": "Jean Dupont",
    "client_email": "jean@test.com"
  }'
```

Expected: `{"checkout_url": "https://checkout.stripe.com/...", "payment_id": "<uuid>"}`

If pro is not onboarded yet: `{"error": "Pro has not activated payments"}` with status 402.

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat: add booking deposit checkout route"
```

---

## Task 10: Invoice Route

**Files:**
- Create: `app/api/stripe/invoice/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { createPaymentLink } from '@/lib/stripe-connect'
import { notifyInvoiceSent } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    professional_id: string
    service_name: string
    amount: number
    currency?: string
    client_name: string
    client_email: string
    client_phone?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { professional_id, service_name, amount, client_name, client_email } = body
  if (!professional_id || !service_name || !amount || !client_name || !client_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()

  const { data: account } = await serviceSupabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  // Create payment record
  const { data: payment, error: insertError } = await serviceSupabase
    .from('payments')
    .insert({
      professional_id,
      type: 'invoice',
      amount: amount / 100,
      currency: body.currency ?? 'eur',
      status: 'pending',
      client_name,
      client_email,
      client_phone: body.client_phone ?? null,
      service_name,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  try {
    const link = await createPaymentLink({
      stripeAccountId: account.stripe_account_id,
      serviceName: service_name,
      amount,
      currency: body.currency ?? 'eur',
      metadata: { professional_id, payment_id: payment.id },
    })

    await serviceSupabase
      .from('payments')
      .update({ payment_link_url: link.url })
      .eq('id', payment.id)

    // Fetch pro name for WhatsApp message
    const { data: pro } = await serviceSupabase
      .from('professionals')
      .select('business_name')
      .eq('id', professional_id)
      .single()

    // Auto-send WhatsApp invoice notification if client phone provided
    if (body.client_phone) {
      notifyInvoiceSent({
        professionalId: professional_id,
        paymentId: payment.id,
        clientName: client_name,
        clientPhone: body.client_phone,
        proName: pro?.business_name ?? '',
        amount: `${(amount / 100).toFixed(2)} ${(body.currency ?? 'eur').toUpperCase()}`,
        paymentLink: link.url,
      }).catch((err) => console.error('[invoice] WhatsApp notify failed', String(err)))
    }

    return NextResponse.json({ payment_link: link.url, payment_id: payment.id })
  } catch (err) {
    console.error('[invoice] Stripe payment link creation failed', String(err))
    await serviceSupabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Manual test**

```bash
curl -X POST http://localhost:3000/api/stripe/invoice \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "professional_id": "<pro_id>",
    "service_name": "Roof repair",
    "amount": 20000,
    "client_name": "Sophie Martin",
    "client_email": "sophie@test.com",
    "client_phone": "+33699999999"
  }'
```

Expected: `{"payment_link": "https://buy.stripe.com/...", "payment_id": "<uuid>"}`

- [ ] **Step 3: Commit**

```bash
git add app/api/stripe/invoice/route.ts
git commit -m "feat: add invoice payment link route"
```

---

## Task 11: Extend Stripe Webhook

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

The existing webhook handles platform subscriptions. Add 3 new cases after the existing `invoice.payment_failed` case.

- [ ] **Step 1: Add imports at top of file**

Add after the existing imports:

```typescript
import { notifyPaymentReceived } from "@/lib/notifications";
```

- [ ] **Step 2: Add new cases to the switch statement**

Add after the existing `case "invoice.payment_failed":` block, before the closing brace of the switch:

```typescript
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const paymentId = checkoutSession.metadata?.payment_id;
      if (!paymentId) break;

      await supabase
        .from("payments")
        .update({
          status: "paid",
          stripe_payment_intent:
            typeof checkoutSession.payment_intent === "string"
              ? checkoutSession.payment_intent
              : null,
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      // Fetch payment + pro details for WhatsApp
      const { data: payment } = await supabase
        .from("payments")
        .select("*, professionals(business_name, whatsapp_phone)")
        .eq("id", paymentId)
        .single();

      if (payment) {
        const pro = payment.professionals as { business_name: string; whatsapp_phone: string | null };
        notifyPaymentReceived({
          professionalId: payment.professional_id,
          paymentId: payment.id,
          appointmentId: payment.appointment_id,
          clientName: payment.client_name ?? "",
          clientPhone: payment.client_phone ?? null,
          proPhone: pro?.whatsapp_phone ?? null,
          proName: pro?.business_name ?? "",
          serviceName: payment.service_name ?? "",
          amount: `${payment.amount} ${payment.currency.toUpperCase()}`,
          paymentType: "booking_deposit",
        }).catch((err) =>
          console.error("[webhook] checkout.session.completed WhatsApp failed", String(err))
        );
      }
      break;
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const paymentId = intent.metadata?.payment_id;
      if (!paymentId) break;

      await supabase
        .from("payments")
        .update({
          status: "paid",
          stripe_payment_intent: intent.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      const { data: payment } = await supabase
        .from("payments")
        .select("*, professionals(business_name, whatsapp_phone)")
        .eq("id", paymentId)
        .single();

      if (payment) {
        const pro = payment.professionals as { business_name: string; whatsapp_phone: string | null };
        notifyPaymentReceived({
          professionalId: payment.professional_id,
          paymentId: payment.id,
          appointmentId: payment.appointment_id,
          clientName: payment.client_name ?? "",
          clientPhone: payment.client_phone ?? null,
          proPhone: pro?.whatsapp_phone ?? null,
          proName: pro?.business_name ?? "",
          serviceName: payment.service_name ?? "",
          amount: `${payment.amount} ${payment.currency.toUpperCase()}`,
          paymentType: "invoice",
        }).catch((err) =>
          console.error("[webhook] payment_intent.succeeded WhatsApp failed", String(err))
        );
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const onboarded = account.details_submitted && account.charges_enabled;
      if (!onboarded) break;

      await supabase
        .from("stripe_connect_accounts")
        .update({ onboarded: true })
        .eq("stripe_account_id", account.id);

      // Denormalise onto professionals for quick lookups
      const { data: connectAccount } = await supabase
        .from("stripe_connect_accounts")
        .select("professional_id")
        .eq("stripe_account_id", account.id)
        .single();

      if (connectAccount) {
        await supabase
          .from("professionals")
          .update({ stripe_onboarded: true })
          .eq("id", connectAccount.professional_id);
      }
      break;
    }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: extend webhook with checkout, payment_intent, and account.updated handlers"
```

---

## Task 12: Internal WhatsApp Route

**Files:**
- Create: `app/api/notifications/whatsapp/route.ts`

This is an internal-only route called by server-side code. It must not be publicly accessible.

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, WhatsAppTemplate } from '@/lib/whatsapp'
import { createClient as createServiceClient } from '@/lib/supabase/service'

// Internal-only route — requires INTERNAL_API_SECRET header
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
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
```

- [ ] **Step 2: Add INTERNAL_API_SECRET to .env.local**

```bash
# Add to .env.local (generate a random 32-char string)
echo "INTERNAL_API_SECRET=$(openssl rand -hex 16)" >> .env.local
```

- [ ] **Step 3: Commit**

```bash
git add app/api/notifications/whatsapp/route.ts
git commit -m "feat: add internal whatsapp notification route"
```

---

## Task 13: Daily Reminder Cron Route

**Files:**
- Create: `app/api/notifications/reminder-cron/route.ts`

- [ ] **Step 1: Create the route**

```typescript
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
    const pro = apt.professionals as { business_name: string; whatsapp_phone: string | null } | null
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/notifications/reminder-cron/route.ts
git commit -m "feat: add daily appointment reminder cron route"
```

---

## Task 14: Update Booking Route

**Files:**
- Modify: `app/api/calendar/[proId]/book/route.ts`

Extend the existing booking handler to: (1) trigger WhatsApp notifications, (2) handle optional checkout redirect when the pro has booking-mode payments enabled.

- [ ] **Step 1: Replace the booking route contents**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { createAppointment, getCalendarTokensPublic } from "@/lib/google-calendar";
import { sendClientConfirmationEmail, sendProNotificationEmail } from "@/lib/utils/calendar-email";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { createCheckoutSession } from "@/lib/stripe-connect";
import { format } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params;

  let body: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    reason?: string;
    startsAt: string;
    endsAt: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { clientName, clientEmail, startsAt, endsAt } = body;
  if (!clientName || !clientEmail || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, email, whatsapp_phone")
    .eq("id", proId)
    .single();

  if (!pro) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const tokens = await getCalendarTokensPublic(proId);
  if (!tokens) {
    return NextResponse.json({ error: "Calendar not connected" }, { status: 409 });
  }

  try {
    const { googleEventId, appointmentId } = await createAppointment(proId, {
      clientName,
      clientEmail,
      clientPhone: body.clientPhone,
      reason: body.reason,
      startsAt,
      endsAt,
      proName: pro.business_name,
      proEmail: pro.email,
    });

    // Check if pro has booking-deposit payments enabled
    const { data: connectAccount } = await supabase
      .from("stripe_connect_accounts")
      .select("stripe_account_id, onboarded, payment_mode, deposit_type, deposit_amount, deposit_percent")
      .eq("professional_id", proId)
      .single();

    const hasBookingPayments =
      connectAccount?.onboarded &&
      (connectAccount.payment_mode === "booking" || connectAccount.payment_mode === "both");

    let checkoutUrl: string | null = null;

    if (hasBookingPayments && connectAccount) {
      // Percent-based deposits require a service price not yet in the booking flow — fixed only for now
      if (connectAccount.deposit_type !== "fixed") break;
      const depositAmountCents = Math.round((connectAccount.deposit_amount ?? 0) * 100);

      if (depositAmountCents > 0) {
        const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;
        try {
          const session = await createCheckoutSession({
            stripeAccountId: connectAccount.stripe_account_id,
            serviceName: body.reason ?? "Appointment",
            amount: depositAmountCents,
            currency: "eur",
            clientEmail,
            successUrl: `${origin}/booking/success`,
            cancelUrl: `${origin}/booking/cancel`,
            metadata: {
              professional_id: proId,
              appointment_id: appointmentId ?? "",
              payment_id: "", // will be set after payment record creation by webhook
            },
          });
          checkoutUrl = session.url;
        } catch (err) {
          console.error("[api/calendar/book] Checkout session creation failed", String(err));
          // Non-fatal — booking is confirmed, payment is optional
        }
      }
    }

    // Fire-and-forget: emails + WhatsApp
    Promise.all([
      sendClientConfirmationEmail({
        clientEmail,
        clientName,
        proName: pro.business_name,
        startsAt,
        endsAt,
        reason: body.reason,
      }),
      sendProNotificationEmail({
        proEmail: pro.email,
        proName: pro.business_name,
        clientName,
        clientEmail,
        clientPhone: body.clientPhone,
        startsAt,
        endsAt,
        reason: body.reason,
      }),
      notifyBookingConfirmed({
        professionalId: proId,
        appointmentId: appointmentId ?? null,
        clientName,
        clientPhone: body.clientPhone ?? null,
        proPhone: pro.whatsapp_phone ?? null,
        proName: pro.business_name,
        serviceName: body.reason ?? "Appointment",
        startsAt,
        withPayment: false, // WhatsApp sent immediately; payment confirmation comes via webhook
      }),
    ]).catch((err) =>
      console.error("[api/calendar/book] Async notification failed", String(err))
    );

    return NextResponse.json({
      success: true,
      googleEventId,
      ...(checkoutUrl && { checkout_url: checkoutUrl }),
    });
  } catch (err) {
    console.error("[api/calendar/book] Error creating appointment", String(err));
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/calendar/[proId]/book/route.ts
git commit -m "feat: extend booking route with WhatsApp notifications and optional checkout"
```

---

## Task 15: Vercel Cron Config + Environment Variables

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/notifications/reminder-cron",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- [ ] **Step 2: Document required environment variables**

Ensure all of the following are set in your Vercel project settings (Settings → Environment Variables) and locally in `.env.local`:

```
# Stripe (already exists — verify it's set)
STRIPE_SECRET_KEY=sk_live_...        # or sk_test_... for dev
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886   # sandbox number for dev

# Cron + internal security
CRON_SECRET=<random-32-char-hex>
INTERNAL_API_SECRET=<random-32-char-hex>

# App URL (used for redirect URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com   # or http://localhost:3000 for dev
```

To get your Twilio sandbox number:
1. Go to twilio.com/console/messaging/whatsapp/sandbox
2. The sandbox number is shown there (typically `+14155238886`)
3. Join the sandbox by sending "join <word-word>" to that number from your test phone

- [ ] **Step 3: Register Stripe webhook in Stripe dashboard**

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `account.updated`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

- [ ] **Step 4: Final test run**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: All tests pass, 0 TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add vercel.json
git commit -m "feat: add vercel cron config for daily appointment reminders"
```

---

## Summary

| Task | What it builds |
|---|---|
| 1 | Twilio + Vitest setup |
| 2 | DB migration (3 tables, 2 columns) |
| 3 | `lib/stripe-connect.ts` + tests |
| 4 | `lib/whatsapp.ts` + tests |
| 5 | `lib/notifications.ts` + tests |
| 6 | `createAppointment` returns DB id |
| 7 | Connect onboard route |
| 8 | Connect status + dashboard routes |
| 9 | Booking deposit checkout route |
| 10 | Invoice payment link route |
| 11 | Webhook extended for 3 new events |
| 12 | Internal WhatsApp send route |
| 13 | Daily reminder cron route |
| 14 | Booking route extended |
| 15 | Vercel cron config + env vars |
