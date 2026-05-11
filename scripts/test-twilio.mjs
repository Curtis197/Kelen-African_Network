/**
 * Quick Twilio WhatsApp test — run once to verify credentials.
 * Usage: node scripts/test-twilio.mjs +2250700000000
 *
 * For sandbox: the recipient must have first sent "join <sandbox-word>"
 * to +14155238886 on WhatsApp.
 */
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually (no dotenv dependency needed)
try {
  const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
} catch {
  console.error('Could not read .env.local')
}

const to = process.argv[2]
if (!to) {
  console.error('Usage: node scripts/test-twilio.mjs <phone> (e.g. +2250700000000)')
  process.exit(1)
}

const sid = process.env.TWILIO_ACCOUNT_SID
const token = process.env.TWILIO_AUTH_TOKEN
const from = process.env.TWILIO_WHATSAPP_NUMBER

if (!sid || !token || !from) {
  console.error('Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_NUMBER in .env.local')
  process.exit(1)
}

const require = createRequire(import.meta.url)
const twilio = require('twilio')
const client = twilio(sid, token)

console.log(`Sending WhatsApp test from ${from} to ${to}...`)

try {
  const msg = await client.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${to}`,
    body: 'Kelen Africa — test WhatsApp OK. Twilio est bien configuré !',
  })
  console.log(`✓ Sent! SID: ${msg.sid} | Status: ${msg.status}`)
} catch (err) {
  console.error('✗ Failed:', err.message)
  if (err.code === 63016) {
    console.error('  → Sandbox: recipient must send "join <word>" to +14155238886 first')
  }
  process.exit(1)
}
