"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, X, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

type Step = "slots" | "form" | "success" | "error";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();
}

interface Props {
  proId: string;
  proName: string;
}

export function BookingWidget({ proId, proName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between bg-primary text-on-primary px-6 py-4 rounded-lg hover:opacity-90 transition-opacity group w-full"
      >
        <span className="flex items-center gap-3 font-bold">
          <CalendarDays className="w-5 h-5" />
          Prendre rendez-vous
        </span>
        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {open && (
        <BookingModal
          proId={proId}
          proName={proName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function BookingModal({ proId, proName, onClose }: Props & { onClose: () => void }) {
  const [step, setStep] = useState<Step>("slots");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
  });

  const [form, setForm] = useState({ clientName: "", clientEmail: "", clientPhone: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/${proId}/availability`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [proId]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Days that have at least one slot in this calendar month
  const availableDays = new Set(
    slots.map((s) => {
      const d = new Date(s.start);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    })
  );

  function hasSlots(date: Date): boolean {
    return availableDays.has(`${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`);
  }

  const slotsForSelectedDay = selectedDate
    ? slots.filter((s) => isSameDay(new Date(s.start), selectedDate))
    : [];

  // Calendar grid
  const firstDayOfMonth = calendarMonth;
  const daysInMonth = new Date(Date.UTC(firstDayOfMonth.getUTCFullYear(), firstDayOfMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const startWeekday = firstDayOfMonth.getUTCDay(); // 0=Sun
  const today = new Date();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/calendar/${proId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone || undefined,
          reason: form.reason || undefined,
          startsAt: selectedSlot.start,
          endsAt: selectedSlot.end,
        }),
      });
      if (!res.ok) throw new Error();
      setStep("success");
    } catch {
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <div>
              <p className="font-headline font-bold text-on-surface">Prendre rendez-vous</p>
              <p className="text-xs text-on-surface-variant">{proName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container-high transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {/* Step: slots */}
          {step === "slots" && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <CalendarDays className="w-12 h-12 text-on-surface-variant/30 mx-auto" />
                  <p className="text-on-surface-variant font-medium">Aucun créneau disponible pour le moment</p>
                  <p className="text-sm text-on-surface-variant/60">Veuillez contacter le professionnel directement.</p>
                </div>
              ) : (
                <>
                  {/* Calendar */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button type="button" onClick={() => setCalendarMonth(m => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() - 1, 1)))} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <p className="font-headline font-bold text-on-surface text-sm">
                        {MONTH_LABELS[calendarMonth.getUTCMonth()]} {calendarMonth.getUTCFullYear()}
                      </p>
                      <button type="button" onClick={() => setCalendarMonth(m => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)))} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DAY_LABELS.map((d) => (
                        <div key={d} className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 py-1">{d}</div>
                      ))}
                      {Array.from({ length: startWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = new Date(Date.UTC(calendarMonth.getUTCFullYear(), calendarMonth.getUTCMonth(), i + 1));
                        const isPast = day < new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                        const isAvail = hasSlots(day);
                        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={isPast || !isAvail}
                            onClick={() => setSelectedDate(day)}
                            className={`aspect-square rounded-lg text-sm font-semibold transition-colors ${
                              isSelected
                                ? "bg-primary text-on-primary"
                                : isAvail && !isPast
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "text-on-surface-variant/30 cursor-default"
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time slots for selected day */}
                  {selectedDate && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        Créneaux — {formatDate(selectedDate.toISOString())}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {slotsForSelectedDay.map((slot) => (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => { setSelectedSlot(slot); setStep("form"); }}
                            className="py-2.5 px-3 rounded-xl border-2 border-primary/20 text-sm font-bold text-primary hover:bg-primary hover:text-on-primary hover:border-primary transition-colors"
                          >
                            {formatTime(slot.start)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step: form */}
          {step === "form" && selectedSlot && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Créneau sélectionné</p>
                <p className="font-headline font-bold text-on-surface">{formatDate(selectedSlot.start)}</p>
                <p className="text-on-surface-variant">{formatTime(selectedSlot.start)} — {formatTime(selectedSlot.end)}</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: "clientName", label: "Nom complet *", type: "text", required: true },
                  { id: "clientEmail", label: "Email *", type: "email", required: true },
                  { id: "clientPhone", label: "Téléphone (optionnel)", type: "tel", required: false },
                ].map(({ id, label, type, required }) => (
                  <div key={id} className="space-y-1.5">
                    <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
                    <input
                      id={id}
                      type={type}
                      required={required}
                      value={form[id as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label htmlFor="reason" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Objet du rendez-vous (optionnel)</label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("slots")} className="flex-1 h-12 rounded-xl border-2 border-outline-variant/30 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                  Retour
                </button>
                <button type="submit" disabled={submitting} className="flex-1 h-12 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Réservation…</> : "Confirmer le RDV"}
                </button>
              </div>
            </form>
          )}

          {/* Step: success */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <h3 className="font-headline font-bold text-2xl text-on-surface">Rendez-vous confirmé !</h3>
              <p className="text-on-surface-variant">
                Un email de confirmation a été envoyé à <strong>{form.clientEmail}</strong>.<br />
                L&apos;événement a été ajouté à votre Google Calendar.
              </p>
              {selectedSlot && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 w-full text-left">
                  <p className="font-bold text-green-800">{formatDate(selectedSlot.start)}</p>
                  <p className="text-green-700">{formatTime(selectedSlot.start)} — {formatTime(selectedSlot.end)}</p>
                </div>
              )}
              <button type="button" onClick={onClose} className="h-12 px-8 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity">
                Fermer
              </button>
            </div>
          )}

          {/* Step: error */}
          {step === "error" && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <h3 className="font-headline font-bold text-2xl text-on-surface">Une erreur est survenue</h3>
              <p className="text-on-surface-variant">Le créneau n&apos;a pas pu être réservé. Veuillez réessayer ou contacter le professionnel directement.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("form")} className="h-12 px-6 rounded-xl border-2 border-outline-variant/30 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                  Réessayer
                </button>
                <button type="button" onClick={onClose} className="h-12 px-6 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
