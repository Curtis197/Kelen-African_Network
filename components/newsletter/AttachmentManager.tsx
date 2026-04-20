"use client";

import { useRef, useState } from "react";
import { Paperclip, X, FileText, Image, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import type { NewsletterAttachment } from "@/lib/types/newsletter";

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_SIZE_MB = 10;

interface Props {
  attachments: NewsletterAttachment[];
  onChange: (attachments: NewsletterAttachment[]) => void;
  professionalId: string;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function AttachmentManager({ attachments, onChange, professionalId, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null);

    const oversized = files.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setError(`${oversized.name} dépasse ${MAX_SIZE_MB} Mo.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const url = await uploadFile(file, "portfolios", `newsletter-attachments/${professionalId}`);
          return { name: file.name, url, type: file.type, size: file.size } satisfies NewsletterAttachment;
        })
      );
      onChange([...attachments, ...uploaded]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    onChange(attachments.filter((a) => a.url !== url));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-on-surface">
          Pièces jointes
          <span className="ml-1.5 text-xs font-normal text-on-surface-variant">(images, PDF — max {MAX_SIZE_MB} Mo)</span>
        </label>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-medium text-kelen-green-700 hover:text-kelen-green-800 disabled:opacity-40 transition-colors"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
          {uploading ? "Envoi…" : "Ajouter"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {attachments.length > 0 && (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li key={a.url} className="flex items-center gap-2 rounded-lg bg-surface-container-low border border-border px-3 py-2">
              {a.type === "application/pdf"
                ? <FileText className="w-4 h-4 text-red-500 shrink-0" />
                : <Image className="w-4 h-4 text-blue-500 shrink-0" />}
              <span className="flex-1 text-sm text-on-surface truncate">{a.name}</span>
              <span className="text-xs text-on-surface-variant shrink-0">{formatSize(a.size)}</span>
              <button
                type="button"
                onClick={() => remove(a.url)}
                disabled={disabled}
                className="p-0.5 rounded text-on-surface-variant hover:text-red-600 transition-colors disabled:opacity-40"
                aria-label={`Supprimer ${a.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
