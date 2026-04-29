"use client";

import { useState, useTransition } from "react";
import { sendNewsletter } from "@/lib/actions/newsletters";
import type { NewsletterContact, SentNewsletter } from "@/lib/actions/newsletters";
import { Send, Users, Clock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  contacts: NewsletterContact[];
  sentNewsletters: SentNewsletter[];
  businessName: string;
}

export function NewsletterComposer({ contacts, sentNewsletters, businessName }: Props) {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(contacts.map((c) => c.email))
  );
  const [result, setResult] = useState<{ success: boolean; sent?: number; error?: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);

  const allSelected = selected.size === contacts.length;

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(contacts.map((c) => c.email))
    );
  }

  function toggle(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }

  function handleSend() {
    if (!subject.trim() || !body.trim() || selected.size === 0) return;
    setResult(null);

    startTransition(async () => {
      const res = await sendNewsletter(subject, body, [...selected]);
      setResult(res);
      if (res.success) {
        setSubject("");
        setBody("");
      }
    });
  }

  const charCount = body.length;
  const canSend = subject.trim().length > 0 && body.trim().length > 0 && selected.size > 0 && !isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* ── Left: Composer (3 cols) ── */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-xl border border-border bg-surface-container-low overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground">Composer un email</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Recipients summary */}
            <button
              type="button"
              onClick={() => setShowContacts((v) => !v)}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>
                  {selected.size === 0
                    ? "Aucun destinataire"
                    : selected.size === contacts.length
                    ? `Tous les contacts (${contacts.length})`
                    : `${selected.size} / ${contacts.length} contacts`}
                </span>
              </span>
              {showContacts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {/* Contact list */}
            {showContacts && (
              <div className="rounded-lg border border-border bg-surface divide-y divide-border max-h-56 overflow-y-auto">
                <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Tous les contacts</span>
                </label>
                {contacts.map((c) => (
                  <label
                    key={c.email}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.email)}
                      onChange={() => toggle(c.email)}
                      className="rounded border-border accent-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {contacts.length === 0 && (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-4 py-6 text-center">
                Aucun contact pour l'instant. Ajoutez des clients à vos projets pour les retrouver ici.
              </p>
            )}

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sujet</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={`Actualités de ${businessName}`}
                maxLength={120}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Bonjour,&#10;&#10;Je souhaitais vous partager une mise à jour sur mes récents travaux..."
                rows={10}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{charCount} caractères</p>
            </div>

            {/* Result feedback */}
            {result && (
              <div
                className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
                  result.success
                    ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>
                  {result.success
                    ? `Email envoyé à ${result.sent} contact${(result.sent ?? 0) > 1 ? "s" : ""}.`
                    : result.error}
                </span>
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isPending
                ? "Envoi en cours…"
                : `Envoyer à ${selected.size} contact${selected.size > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: History (2 cols) ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-border bg-surface-container-low overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground">Historique des envois</h2>
          </div>

          {sentNewsletters.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Aucun email envoyé pour l'instant.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sentNewsletters.map((nl) => (
                <li key={nl.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expandedId === nl.id ? null : nl.id)
                    }
                    className="w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{nl.subject}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {nl.recipient_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(nl.sent_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      {expandedId === nl.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                    </div>

                    {expandedId === nl.id && (
                      <p className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6 text-left">
                        {nl.body}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
