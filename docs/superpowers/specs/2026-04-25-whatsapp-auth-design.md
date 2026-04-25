# WhatsApp Authentication — Design Spec
**Date:** 2026-04-25
**Status:** Approved

## Overview

Add WhatsApp OTP as an additional authentication option on all login and signup pages (client and professional). Uses Twilio Verify (WhatsApp channel) — already installed. Users only get their phone number from WhatsApp; new users complete a profile (name + optional email) after verification.

---

## User Flow

1. User clicks **"Continuer avec WhatsApp"** on login or signup page
2. Modal opens → user enters phone number with country code
3. Backend sends OTP via Twilio Verify (WhatsApp channel)
4. User enters 6-digit code in modal
5. Backend verifies code with Twilio
6. **Existing user** (phone in DB) → Supabase session created → redirect to dashboard
7. **New user** → modal shows profile step (name required, email optional) → account created → redirect to dashboard

Role (client or professional) is determined by which page triggered the modal — same logic as existing Google auth.

---

## Architecture

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `WhatsAppButton` | `components/auth/WhatsAppButton.tsx` | Button placed on all 4 auth pages, similar to existing `GoogleButton` |
| `WhatsAppAuthModal` | `components/auth/WhatsAppAuthModal.tsx` | Multi-step modal: phone → OTP → profile completion |

**Modal steps:**
- **Step 1 — Phone:** Input with country code selector, validates format before submit
- **Step 2 — OTP:** 6-digit code input, resend option after 60s
- **Step 3 — Profile (new users only):** Name (required) + email (optional)

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/whatsapp/send-otp` | POST | Receives `{ phone }`, calls Twilio Verify to send WhatsApp OTP |
| `/api/auth/whatsapp/verify-otp` | POST | Receives `{ phone, code, role }`, verifies with Twilio, checks if user exists |
| `/api/auth/whatsapp/complete-profile` | POST | Receives `{ phone, name, email?, role }`, creates Supabase user + session |

### Supabase

- New users created via Supabase Admin SDK (`service_role` key)
- `phone` column added to `users` table if not already present
- Sessions created server-side and set via cookie (consistent with existing SSR auth pattern)

---

## Pages Updated

All 4 auth pages get the `WhatsAppButton` added below the existing `GoogleButton`:

- `app/(auth)/connexion/page.tsx` — client login
- `app/(auth)/inscription/page.tsx` — client signup
- `app/(auth)/pro/connexion/page.tsx` — pro login
- `app/(auth)/pro/inscription/page.tsx` — pro signup (if exists)

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Wrong OTP | Error message in modal, allow retry |
| Expired OTP | Error message, offer resend |
| 5+ failed attempts | Twilio blocks automatically — show "trop de tentatives, réessayez plus tard" |
| Phone linked to another account | "Ce numéro est déjà associé à un compte, connectez-vous avec email ou Google" |
| Invalid phone format | Frontend validation before API call |
| Twilio API failure | Generic error, no internal details exposed |
| User closes modal mid-flow | No account created (creation only on profile step completion) |
| Cross-role phone (pro phone on client page) | Block + redirect message, same as existing email auth |

---

## Environment Variables Required

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
```

---

## Dependencies

- `twilio` — already installed (`^6.0.0`)
- No new packages needed
