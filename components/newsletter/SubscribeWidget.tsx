"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { Mail } from "lucide-react";

interface Props {
  professionalId: string;
  businessName: string;
}

export function SubscribeWidget({ professionalId, businessName }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<{ success?: boolean; error?: string; alreadySubscribed?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await subscribeToNewsletter(professionalId, email, name || undefined);
      setResult(res);
      if (res.success) {
        setEmail("");
        setName("");
      }
    });
  }

  if (result?.success) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-kelen-green-700 font-semibold">
          <Mail className="w-5 h-5" />
          <span>Vous êtes inscrit(e) ! Vous recevrez les prochaines newsletters.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 justify-center mb-3">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="font-headline font-bold text-lg text-on-surface">
          Rester informé(e)
        </h3>
      </div>
      <p className="text-on-surface-variant text-sm text-center mb-6">
        Inscrivez-vous pour recevoir les offres et actualités de{" "}
        <strong>{businessName}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm mx-auto">
        <input
          type="text"
          placeholder="Votre prénom (optionnel)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          type="email"
          required
          placeholder="Votre adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {result?.error && (
          <p className="text-red-600 text-xs text-center">{result.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-kelen-green-600 hover:bg-kelen-green-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Inscription en cours…" : "S'inscrire à la newsletter"}
        </button>
      </form>

      <p className="text-xs text-on-surface-variant/50 text-center mt-3">
        Désinscription possible à tout moment via le lien en bas de chaque email.
      </p>
    </div>
  );
}
