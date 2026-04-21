import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface CalendarTokens {
  pro_id: string;
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
  calendar_id: string;
  google_email: string | null;
  slot_duration: number;
  buffer_time: number;
  advance_days: number;
  working_hours: WorkingHours;
  connected_at: string;
}

export interface DayHours {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export type WorkingHours = {
  mon: DayHours | null;
  tue: DayHours | null;
  wed: DayHours | null;
  thu: DayHours | null;
  fri: DayHours | null;
  sat: DayHours | null;
  sun: DayHours | null;
};

export interface TimeSlot {
  start: string; // ISO string
  end: string;   // ISO string
}

// ──────────────────────────────────────────────
// OAuth client factory
// ──────────────────────────────────────────────

function createCalendarOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );
}

export function generateCalendarAuthUrl(proId: string): string {
  const client = createCalendarOAuthClient();
  const state = Buffer.from(JSON.stringify({ proId })).toString("base64");

  return client.generateAuthUrl({
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.freebusy",
      "email",
      "profile",
    ],
    state,
    access_type: "offline",
    prompt: "consent",
  });
}

// ──────────────────────────────────────────────
// Token helpers
// ──────────────────────────────────────────────

export async function getCalendarTokens(proId: string): Promise<CalendarTokens | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pro_calendar_tokens")
    .select("*")
    .eq("pro_id", proId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[google-calendar] Error fetching calendar tokens", { proId, error: error.message });
    }
    return null;
  }
  return data as CalendarTokens;
}

export async function getCalendarTokensPublic(proId: string): Promise<CalendarTokens | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pro_calendar_tokens")
    .select("*")
    .eq("pro_id", proId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[google-calendar] Error fetching calendar tokens (service)", { proId, error: error.message });
    }
    return null;
  }
  return data as CalendarTokens;
}

async function getAuthenticatedCalendarClient(
  tokens: CalendarTokens,
  proId: string
): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const client = createCalendarOAuthClient();
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  });

  const fiveMinutes = 5 * 60 * 1000;
  const isExpiringSoon = (tokens.expiry_date ?? 0) < Date.now() + fiveMinutes;

  if (isExpiringSoon && tokens.refresh_token) {
    try {
      const { credentials } = await client.refreshAccessToken();
      const supabase = createServiceClient();
      await supabase
        .from("pro_calendar_tokens")
        .update({ access_token: credentials.access_token, expiry_date: credentials.expiry_date })
        .eq("pro_id", proId);
      client.setCredentials(credentials);
    } catch (err) {
      console.error("[google-calendar] Token refresh failed", { proId, error: String(err) });
    }
  }

  return client;
}

// ──────────────────────────────────────────────
// Availability — freebusy API
// ──────────────────────────────────────────────

const DAY_KEYS: (keyof WorkingHours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function generateSlots(
  date: Date,
  hours: DayHours,
  slotDuration: number,
  bufferTime: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startH, startM] = hours.start.split(":").map(Number);
  const [endH, endM] = hours.end.split(":").map(Number);

  const startMs = (startH * 60 + startM) * 60_000;
  const endMs = (endH * 60 + endM) * 60_000;
  const step = (slotDuration + bufferTime) * 60_000;
  const slotLen = slotDuration * 60_000;

  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  for (let ms = startMs; ms + slotLen <= endMs; ms += step) {
    const start = new Date(base.getTime() + ms);
    const end = new Date(start.getTime() + slotLen);
    slots.push({ start: start.toISOString(), end: end.toISOString() });
  }
  return slots;
}

export async function getAvailableSlots(proId: string): Promise<TimeSlot[]> {
  const tokens = await getCalendarTokensPublic(proId);
  if (!tokens) return [];

  const authClient = await getAuthenticatedCalendarClient(tokens, proId);
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + tokens.advance_days);

  // Fetch busy periods
  let busyPeriods: { start: string; end: string }[] = [];
  try {
    const freebusyRes = await calendar.freebusy.query({
      requestBody: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        items: [{ id: tokens.calendar_id }],
      },
    });
    const calendarBusy = freebusyRes.data.calendars?.[tokens.calendar_id]?.busy ?? [];
    busyPeriods = calendarBusy.filter(
      (b): b is { start: string; end: string } => !!b.start && !!b.end
    );
  } catch (err) {
    console.error("[google-calendar] freebusy query failed", { proId, error: String(err) });
    return [];
  }

  // Generate all potential slots and filter out busy ones
  const available: TimeSlot[] = [];
  const current = new Date(from);

  while (current < to) {
    const dayKey = DAY_KEYS[current.getDay()];
    const hours = tokens.working_hours[dayKey];

    if (hours) {
      const slots = generateSlots(current, hours, tokens.slot_duration, tokens.buffer_time);
      for (const slot of slots) {
        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();

        // Skip past slots (add 30min buffer so current-hour slots aren't shown)
        if (slotEnd <= Date.now() + 30 * 60_000) continue;

        const isBusy = busyPeriods.some((b) => {
          const busyStart = new Date(b.start).getTime();
          const busyEnd = new Date(b.end).getTime();
          return slotStart < busyEnd && slotEnd > busyStart;
        });

        if (!isBusy) available.push(slot);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return available;
}

// ──────────────────────────────────────────────
// Create appointment — Calendar event + DB record
// ──────────────────────────────────────────────

export interface AppointmentInput {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  reason?: string;
  startsAt: string; // ISO string
  endsAt: string;   // ISO string
  proName: string;
  proEmail: string;
}

export async function createAppointment(
  proId: string,
  input: AppointmentInput
): Promise<{ googleEventId: string }> {
  const tokens = await getCalendarTokensPublic(proId);
  if (!tokens) throw new Error("Professional Google Calendar not connected");

  const authClient = await getAuthenticatedCalendarClient(tokens, proId);
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const event = await calendar.events.insert({
    calendarId: tokens.calendar_id,
    requestBody: {
      summary: `RDV — ${input.clientName}`,
      description: input.reason
        ? `Objet : ${input.reason}\nTél : ${input.clientPhone ?? "—"}`
        : `Tél : ${input.clientPhone ?? "—"}`,
      start: { dateTime: input.startsAt, timeZone: "UTC" },
      end: { dateTime: input.endsAt, timeZone: "UTC" },
      attendees: [
        { email: input.clientEmail, displayName: input.clientName },
        { email: input.proEmail, displayName: input.proName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
    sendUpdates: "all",
  });

  const googleEventId = event.data.id!;

  const supabase = createServiceClient();
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
}
