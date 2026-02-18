"use client";

import { useState } from "react";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with Supabase auth
      // const { error } = await supabase.auth.resetPasswordForEmail(email, {
      //   redirectTo: `${window.location.origin}/mot-de-passe/reset`,
      // });
      // if (error) throw error;

      console.log("Password reset request:", email);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-kelen-green-50">
          <span className="text-xl text-kelen-green-500">✓</span>
        </div>
        <h3 className="font-semibold text-foreground">Email envoyé</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous
          recevrez un lien de réinitialisation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-kelen-red-500/20 bg-kelen-red-50 p-3 text-sm text-kelen-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="reset-email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Adresse email
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          placeholder="vous@exemple.com"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
      </button>
    </form>
  );
}
