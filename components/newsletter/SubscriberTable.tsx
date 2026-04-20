"use client";

import { useState, useTransition } from "react";
import { deleteSubscriber } from "@/lib/actions/newsletter";
import { Trash2, Search, Users } from "lucide-react";
import type { NewsletterSubscriber } from "@/lib/types/newsletter";

interface Props {
  subscribers: NewsletterSubscriber[];
}

export function SubscriberTable({ subscribers }: Props) {
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      (s.name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteSubscriber(id);
      setDeletingId(null);
    });
  }

  if (subscribers.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucun abonné pour l&apos;instant.</p>
        <p className="text-sm mt-1 opacity-70">
          Partagez votre profil public pour commencer à collecter des abonnés.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm font-medium text-on-surface-variant">
          {subscribers.length} abonné{subscribers.length > 1 ? "s" : ""} actif{subscribers.length > 1 ? "s" : ""}
        </span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nom</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Inscrit le</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((sub) => (
              <tr key={sub.id} className="hover:bg-surface-container/50 transition-colors">
                <td className="px-4 py-3 text-on-surface">
                  {sub.name || <span className="text-on-surface-variant/40 italic">—</span>}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">{sub.email}</td>
                <td className="px-4 py-3 text-on-surface-variant hidden sm:table-cell">
                  {new Date(sub.subscribed_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(sub.id)}
                    disabled={isPending && deletingId === sub.id}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    aria-label={`Supprimer ${sub.email}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant/60 text-sm">
                  Aucun résultat pour &quot;{query}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
