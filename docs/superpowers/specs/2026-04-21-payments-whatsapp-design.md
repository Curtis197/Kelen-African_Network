# Payments & WhatsApp Notifications — Design Spec
**Date:** 2026-04-21
**Status:** Approved
**Scope:** MVP — Western market (Stripe Connect Express + Twilio WhatsApp)

---

## 1. Context

Kelen is a professional services platform for construction workers, garages, restaurants, and small retailers. Professionals have a personal website, diary log, appointment booking, GMB sync, newsletter, and exportable realisations.

This spec adds two features:
- **Payments**: professionals can collect money from clients (deposit at booking, or invoice after work)
- **WhatsApp notifications**: both sides receive automated messages on booking and payment events

**Out of scope (V2):** African payment gateways (Flutterwave, CinetPay, Wave), Meta Cloud API WhatsApp, AI analytics.

---

## 2. Architecture

Three new modules added to the existing Next.js 16 / Supabase app:

- `lib/stripe-connect.ts` — Connect account creation, onboarding links, checkout sessions, invoice links
- `lib/whatsapp.ts` — Twilio client, message templates, send helpers
- `lib/notifications.ts` — orchestrates triggers (booking → WhatsApp, payment → WhatsApp)

Existing files extended:
- `app/api/calendar/[proId]/book/route.ts` — trigger payment checkout after booking
- `app/api/stripe/webhook/route.ts` — handle new payment + onboarding events

---

## 3. Stripe Connect Express

### 3.1 Pro Onboarding

1. Pro opens dashboard with no Stripe account → banner displayed
2. `POST /api/stripe/connect/onboard` called with `professional_id`
3. Server calls `stripe.accounts.create({ type: 'express', email, metadata: { professional_id } })`
4. Server calls `stripe.accountLinks.create({ type: 'account_onboarding' })`
5. `stripe_account_id` saved to `stripe_connect_accounts` table immediately
6. Pro redirected to Stripe-hosted onboarding URL (~3 min, mobile-friendly)
7. Stripe redirects back to `/dashboard/payments?onboarded=true`
8. Webhook `account.updated` → sets `onboarded: true` in Supabase
9. `GET /api/stripe/connect/status` — used by dashboard to check onboarding state
10. `POST /api/stripe/connect/dashboard` — returns Stripe Express dashboard link for pro to view payouts

### 3.2 Payment Mode Settings

Pros choose their mode in dashboard settings. Stored as `payment_mode` on `stripe_connect_accounts`.

| Mode | Description |
|---|---|
| `booking` | Deposit or full payment collected when client books |
| `invoice` | Pro sends payment link to client after work |
| `both` | Pro can use either flow |

Deposit config: `deposit_type` (`fixed` or `percent`) + `deposit_amount` or `deposit_percent`.

### 3.3 Booking Deposit Flow (Option A)

1. Client books appointment on pro's public website
2. `POST /api/stripe/checkout` called with service, amount, client details, `appointment_id`
3. Server creates Stripe Checkout Session on the pro's Connect account (with optional platform fee)
4. Client completes payment on Stripe-hosted page
5. Webhook `checkout.session.completed` → save `payments` record → trigger WhatsApp notifications

### 3.4 Invoice Flow (Option B)

1. Pro selects a realisation/service from dashboard, enters client details and amount
2. `POST /api/stripe/invoice` called
3. Server creates a Stripe PaymentLink on the pro's Connect account
4. Response returns `payment_link_url` → if `client_phone` provided, auto-send WhatsApp invoice notification; otherwise pro shares link manually
5. Webhook `payment_intent.succeeded` → update `payments` record → trigger WhatsApp payment receipt

---

## 4. WhatsApp Notifications (Twilio)

### 4.1 Message Templates

**To Client:**

| Trigger | Template |
|---|---|
| Booking confirmed (no payment) | `Hi [name], your appointment with [pro_name] is confirmed for [date] at [time]. See you soon!` |
| Booking confirmed (with payment) | `Hi [name], your booking with [pro_name] on [date] at [time] is confirmed. Deposit of [amount] received.` |
| Appointment reminder (24h before) | `Reminder: your appointment with [pro_name] is tomorrow at [time]. Address: [location]` |
| Invoice received | `Hi [name], [pro_name] sent you an invoice for [amount]. Pay here: [link]` |
| Payment receipt | `Payment confirmed. [amount] received by [pro_name]. Thank you!` |

**To Pro:**

| Trigger | Template |
|---|---|
| New booking | `New booking from [client_name] on [date] at [time]. Service: [service]` |
| Payment received | `[client_name] just paid [amount] for [service]. Check your dashboard.` |

### 4.2 Trigger Points

| Event | File | Notifications sent |
|---|---|---|
| Appointment booked | `app/api/calendar/[proId]/book/route.ts` | Client: booking confirmed, Pro: new booking |
| Deposit paid | `app/api/stripe/webhook/route.ts` (`checkout.session.completed`) | Client: payment confirmed, Pro: payment received |
| Invoice paid | `app/api/stripe/webhook/route.ts` (`payment_intent.succeeded`) | Client: payment receipt, Pro: payment received |
| 24h before appointment | `app/api/notifications/reminder-cron/route.ts` | Client: reminder |

### 4.3 Phone Number Handling

- Pro sets `whatsapp_phone` once in dashboard settings
- Client provides phone at booking (optional) — falls back to email via Resend if missing
- If pro has no `whatsapp_phone` set: skip pro notification silently, show one-time dashboard prompt
- All sends are best-effort — failure does NOT fail the parent operation

### 4.4 Reminder Cron

Vercel Cron runs daily at 09:00 UTC via `GET /api/notifications/reminder-cron`.

```json
{
  "crons": [{ "path": "/api/notifications/reminder-cron", "schedule": "0 9 * * *" }]
}
```

Queries appointments scheduled in the next 24h, sends reminder to each client with a phone number.

---

## 5. Data Model

### New Tables

```sql
CREATE TABLE stripe_connect_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   uuid REFERENCES professionals(id) ON DELETE CASCADE,
  stripe_account_id text UNIQUE NOT NULL,
  onboarded         boolean DEFAULT false,
  payment_mode      text DEFAULT 'both',   -- 'booking' | 'invoice' | 'both'
  deposit_type      text DEFAULT 'fixed',  -- 'fixed' | 'percent'
  deposit_amount    numeric(10,2),
  deposit_percent   integer,               -- 0-100
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id         uuid REFERENCES professionals(id),
  stripe_payment_intent   text UNIQUE,
  stripe_checkout_session text,
  type                    text NOT NULL,          -- 'booking_deposit' | 'invoice'
  amount                  numeric(10,2) NOT NULL,
  currency                text DEFAULT 'eur',
  status                  text DEFAULT 'pending', -- 'pending' | 'paid' | 'refunded'
  client_name             text,
  client_phone            text,
  client_email            text,
  service_name            text,
  appointment_id          uuid REFERENCES appointments(id),
  payment_link_url        text,
  paid_at                 timestamptz,
  created_at              timestamptz DEFAULT now()
);

CREATE TABLE whatsapp_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES professionals(id),
  recipient       text NOT NULL,   -- 'client' | 'pro'
  phone           text NOT NULL,
  template        text NOT NULL,
  status          text DEFAULT 'sent', -- 'sent' | 'failed'
  twilio_sid      text,
  payment_id      uuid REFERENCES payments(id),
  appointment_id  uuid REFERENCES appointments(id),
  created_at      timestamptz DEFAULT now()
);
```

### Columns Added to Existing Tables

```sql
ALTER TABLE professionals ADD COLUMN whatsapp_phone text;
ALTER TABLE professionals ADD COLUMN stripe_onboarded boolean DEFAULT false;
```

---

## 6. API Routes

### New Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/stripe/connect/onboard` | Create Express account + return onboarding URL |
| GET | `/api/stripe/connect/status` | Check if pro is onboarded |
| POST | `/api/stripe/connect/dashboard` | Return Stripe Express dashboard link |
| POST | `/api/stripe/checkout` | Create booking deposit checkout session |
| POST | `/api/stripe/invoice` | Create payment link for invoice flow |
| POST | `/api/notifications/whatsapp` | Internal — send a WhatsApp message via Twilio |
| GET | `/api/notifications/reminder-cron` | Called by Vercel Cron, sends 24h reminders |

### Route Contracts

```ts
// POST /api/stripe/connect/onboard
body:    { professional_id: string }
returns: { onboarding_url: string, stripe_account_id: string }

// POST /api/stripe/checkout
body: {
  professional_id: string
  service_name: string
  amount: number          // in cents
  client_name: string
  client_email: string
  client_phone?: string
  appointment_id?: string
}
returns: { checkout_url: string, payment_id: string }

// POST /api/stripe/invoice
body: {
  professional_id: string
  service_name: string
  amount: number
  client_name: string
  client_email: string
  client_phone?: string
}
returns: { payment_link: string, payment_id: string }

// POST /api/notifications/whatsapp (internal)
body: {
  to: string
  template: string
  params: Record<string, string>
  payment_id?: string
  appointment_id?: string
}
returns: { sid: string, status: string }
```

### Webhook — New Events

```ts
case 'checkout.session.completed'   // booking deposit paid
case 'payment_intent.succeeded'     // invoice paid
case 'account.updated'              // pro onboarding completed
```

---

## 7. Error Handling

### Stripe

| Scenario | Behaviour |
|---|---|
| Connect onboarding fails | Log error, show retry banner, do NOT save `stripe_account_id` |
| Checkout session creation fails | Save appointment without payment, notify pro via WhatsApp, pro can send invoice as fallback |
| Unknown `professional_id` in webhook | Log to errors table, alert via Resend email, return 200 to Stripe |
| Pro not yet onboarded | Return 402 with message `"Pro has not activated payments"` |
| All webhook handlers | Always return 200 to prevent Stripe retries, log business logic errors separately |

### WhatsApp / Twilio

| Scenario | Behaviour |
|---|---|
| Twilio send fails | Log `failed` in `whatsapp_notifications`, do NOT fail parent operation |
| Client has no phone number | Skip WhatsApp, send email via Resend instead |
| Pro has no `whatsapp_phone` | Skip pro notification silently, show one-time dashboard prompt |

### Principle

> Payments are hard failures — block and surface to user.
> Notifications are soft failures — log and degrade silently.

---

## 8. Environment Variables Required

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886   # sandbox for dev
CRON_SECRET=                                   # shared secret — Vercel Cron sends as Bearer token
```

---

## 9. Future Considerations (V2 / Africa expansion)

- Swap Stripe Connect for Flutterwave or CinetPay for West/Central Africa
- Migrate WhatsApp from Twilio to Meta Cloud API for cost reduction at scale
- Add invoice overdue reminders (3 days, 7 days)
- Add booking cancellation flow with refund handling
