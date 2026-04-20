"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { sendCampaign } from "@/lib/actions/newsletter";
import { AttachmentManager } from "./AttachmentManager";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import type { NewsletterAttachment, SendCampaignResult } from "@/lib/types/newsletter";

const TipTapEditor = dynamic(
  () => import("./TipTapEditor").then((m) => m.TipTapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 rounded-lg border border-outline-variant bg-surface-container-low animate-pulse" />
    ),
  }
);

interface Props {
  lastSentAt: string | null;
  professionalId: string;
}

export function CampaignComposer({ lastSentAt, professionalId }: Props) {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<NewsletterAttachment[]>([]);
  const [result, setResult] = useState<SendCampaignResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const hoursUntilNextSend = lastSentAt
    ? Math.ceil(
        (new Date(lastSentAt).getTime() + 24 * 60 * 60 * 1000 - Date.now()) / 3_600_000
      )
    : 0;
  const isRateLimited = hoursUntilNextSend > 0;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await sendCampaign(subject, bodyHtml, attachments);
      setResult(res);
      if (res.success) {
        setSubject("");
        setBodyHtml("");
        setAttachments([]);
      }
    });
  }

  return (
    <form onSubmit={handleSend} className="space-y-4">
      {isRateLimited && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Une campagne a déjà été envoyée aujourd&apos;hui. Vous pourrez en envoyer une nouvelle dans{" "}
            <strong>{hoursUntilNextSend}h</strong>.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">
          Sujet de l&apos;email <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex : Promotion de saison — 20% sur tous nos services"
          required
          maxLength={200}
          disabled={isRateLimited}
          className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">
          Contenu <span className="text-red-500">*</span>
        </label>
        <TipTapEditor
          content={bodyHtml}
          onChange={setBodyHtml}
          professionalId={professionalId}
        />
      </div>

      <AttachmentManager
        attachments={attachments}
        onChange={setAttachments}
        professionalId={professionalId}
        disabled={isRateLimited || isPending}
      />

      {result?.error && (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      )}

      {result?.success && (
        <div className="flex items-center gap-2 text-kelen-green-700 bg-kelen-green-50 rounded-lg p-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Campagne envoyée à <strong>{result.recipientCount}</strong> abonné
            {(result.recipientCount ?? 0) > 1 ? "s" : ""} !
            {attachments.length > 0 && ` (${attachments.length} pièce${attachments.length > 1 ? "s" : ""} jointe${attachments.length > 1 ? "s" : ""})`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-on-surface-variant/60">
          Limite : 1 campagne par 24 heures.
        </p>
        <button
          type="submit"
          disabled={isPending || isRateLimited || !subject.trim() || !bodyHtml.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-kelen-green-600 hover:bg-kelen-green-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isPending ? "Envoi en cours…" : "Envoyer la campagne"}
        </button>
      </div>
    </form>
  );
}
