"use client";

import { useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, Plug, Unplug, ChevronDown } from "lucide-react";
import { updateCalendarSettings, disconnectCalendar } from "@/lib/actions/calendar";
import { toast } from "sonner";
import type { WorkingHours } from "@/lib/google-calendar";

const DAYS: { key: keyof WorkingHours; label: string }[] = [
  { key: "mon", label: "Lundi" },
  { key: "tue", label: "Mardi" },
  { key: "wed", label: "Mercredi" },
  { key: "thu", label: "Jeudi" },
  { key: "fri", label: "Vendredi" },
  { key: "sat", label: "Samedi" },
  { key: "sun", label: "Dimanche" },
];

const DEFAULT_HOURS = { start: "09:00", end: "18:00" };

interface Props {
  proId: string;
  calendarTokens: {
    google_email: string | null;
    slot_duration: number;
    buffer_time: number;
    advance_days: number;
    working_hours: WorkingHours;
  } | null;
}

export function CalendarSettings({ proId, calendarTokens }: Props) {
  const isConnected = !!calendarTokens;

  const [slotDuration, setSlotDuration] = useState(calendarTokens?.slot_duration ?? 60);
  const [bufferTime, setBufferTime] = useState(calendarTokens?.buffer_time ?? 15);
  const [advanceDays, setAdvanceDays] = useState(calendarTokens?.advance_days ?? 14);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(
    calendarTokens?.working_hours ?? {
      mon: DEFAULT_HOURS,
      tue: DEFAULT_HOURS,
      wed: DEFAULT_HOURS,
      thu: DEFAULT_HOURS,
      fri: DEFAULT_HOURS,
      sat: null,
      sun: null,
    }
  );

  const [isPending, startTransition] = useTransition();
  const [showSettings, setShowSettings] = useState(false);

  function toggleDay(key: keyof WorkingHours) {
    setWorkingHours((prev) => ({
      ...prev,
      [key]: prev[key] ? null : DEFAULT_HOURS,
    }));
  }

  function updateDayHours(key: keyof WorkingHours, field: "start" | "end", value: string) {
    setWorkingHours((prev) => ({
      ...prev,
      [key]: prev[key] ? { ...prev[key]!, [field]: value } : null,
    }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateCalendarSettings({ slot_duration: slotDuration, buffer_time: bufferTime, advance_days: advanceDays, working_hours: workingHours });
        toast.success("Paramètres de calendrier sauvegardés");
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectCalendar();
        toast.success("Google Calendar déconnecté");
      } catch {
        toast.error("Erreur lors de la déconnexion");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-outline-variant/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-headline text-lg font-bold text-on-surface">Prise de rendez-vous</h2>
          <p className="text-sm text-on-surface-variant/70">
            Connectez votre Google Calendar pour permettre aux clients de réserver un créneau
          </p>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connecté
          </span>
        )}
      </div>

      <div className="px-6 py-6 space-y-6">
        {!isConnected ? (
          /* Not connected state */
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-on-surface-variant text-center max-w-md">
              Connectez votre compte Google pour synchroniser votre agenda et afficher vos disponibilités sur votre profil public.
            </p>
            <a
              href="/api/auth/google/calendar/authorize"
              className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <Plug className="h-4 w-4" />
              Connecter Google Calendar
            </a>
          </div>
        ) : (
          /* Connected state */
          <div className="space-y-6">
            {/* Connected account */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Agenda connecté</p>
                  {calendarTokens.google_email && (
                    <p className="text-xs text-green-700">{calendarTokens.google_email}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Unplug className="h-3.5 w-3.5" />
                Déconnecter
              </button>
            </div>

            {/* Collapsible settings */}
            <div>
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-on-surface hover:text-primary transition-colors"
              >
                Paramètres de disponibilité
                <ChevronDown className={`h-4 w-4 transition-transform ${showSettings ? "rotate-180" : ""}`} />
              </button>

              {showSettings && (
                <div className="mt-4 space-y-6">
                  {/* Slot duration + buffer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Durée d&apos;un créneau
                      </label>
                      <select
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                        className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {[15, 30, 45, 60, 90, 120].map((v) => (
                          <option key={v} value={v}>{v} minutes</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Pause entre créneaux
                      </label>
                      <select
                        value={bufferTime}
                        onChange={(e) => setBufferTime(Number(e.target.value))}
                        className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {[0, 10, 15, 30, 45, 60].map((v) => (
                          <option key={v} value={v}>{v} minutes</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Jours à l&apos;avance
                      </label>
                      <select
                        value={advanceDays}
                        onChange={(e) => setAdvanceDays(Number(e.target.value))}
                        className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {[7, 14, 21, 30, 60, 90].map((v) => (
                          <option key={v} value={v}>{v} jours</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Working hours per day */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Horaires par jour
                    </p>
                    <div className="rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10 overflow-hidden">
                      {DAYS.map(({ key, label }) => {
                        const hours = workingHours[key];
                        return (
                          <div key={key} className="flex items-center gap-4 px-4 py-3 bg-surface">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={!!hours}
                              onClick={() => toggleDay(key)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${hours ? "bg-kelen-green-600" : "bg-gray-200"}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${hours ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                            <span className="w-20 text-sm font-semibold text-on-surface">{label}</span>
                            {hours ? (
                              <div className="flex items-center gap-2 text-sm">
                                <input
                                  type="time"
                                  value={hours.start}
                                  onChange={(e) => updateDayHours(key, "start", e.target.value)}
                                  className="rounded-lg border border-outline-variant/30 px-2 py-1 text-sm text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <span className="text-on-surface-variant">→</span>
                                <input
                                  type="time"
                                  value={hours.end}
                                  onChange={(e) => updateDayHours(key, "end", e.target.value)}
                                  className="rounded-lg border border-outline-variant/30 px-2 py-1 text-sm text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-on-surface-variant/50 italic">Indisponible</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="h-11 px-6 rounded-xl bg-kelen-green-600 text-white text-sm font-bold hover:bg-kelen-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sauvegarde…
                      </>
                    ) : "Sauvegarder les paramètres"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
