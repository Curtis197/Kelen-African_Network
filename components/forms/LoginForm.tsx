"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginFormData } from "@/lib/utils/validators";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/GoogleButton";

interface LoginFormProps {
  defaultRole?: "client" | "professional";
}

export function LoginForm({ defaultRole }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const isProPage = defaultRole === "professional";
  const [wrongRole, setWrongRole] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setWrongRole(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Query the database for the actual role (user_metadata may be stale)
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        const role = profile?.role || "client";
        const isProUser = role.startsWith("pro_");
        const isClientUser = role === "client";
        const isAdminUser = role === "admin";

        // Block cross-role login: pro user on client page, or client on pro page
        if (isProPage && (isClientUser || isAdminUser)) {
          await supabase.auth.signOut();
          setWrongRole("client");
          setIsLoading(false);
          return;
        }

        if (!isProPage && isProUser) {
          await supabase.auth.signOut();
          setWrongRole("pro");
          setIsLoading(false);
          return;
        }

        // Role matches page â€” redirect to correct dashboard
        if (isAdminUser) {
          router.push("/admin");
        } else if (isProUser) {
          router.push("/pro/dashboard");
        } else {
          router.push("/dashboard");
        }

        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect.");
    } finally {
      if (!wrongRole) setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Google OAuth Button */}
      <GoogleButton role={isProPage ? "professional" : "client"} />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-kelen-red-500/20 bg-kelen-red-50 p-3 text-sm text-kelen-red-700">
          {error}
        </div>
      )}

      {wrongRole === "client" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">Compte professionnel dÃ©tectÃ©</p>
          <p className="mb-3">Ce compte appartient Ã  l&apos;Espace Pro. Veuillez vous connecter depuis la page professionnelle.</p>
          <Link
            href="/pro/connexion"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Aller Ã  l&apos;Espace Pro â†’
          </Link>
        </div>
      )}

      {wrongRole === "pro" && (
        <div className="rounded-lg border border-kelen-green-200 bg-kelen-green-50 p-4 text-sm text-kelen-green-800">
          <p className="font-medium mb-1">Compte client dÃ©tectÃ©</p>
          <p className="mb-3">Ce compte est un compte client. Veuillez vous connecter depuis la page de connexion classique.</p>
          <Link
            href="/connexion"
            className="inline-flex items-center gap-1.5 rounded-lg bg-kelen-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-kelen-green-700 transition-colors"
          >
            Aller Ã  la page de connexion â†’
          </Link>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          placeholder="nom@exemple.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-kelen-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
          >
            Mot de passe
          </label>
          <Link
            href="/mot-de-passe"
            className="text-xs font-medium text-kelen-green-600 hover:text-kelen-green-500"
          >
            Mot de passe oubliÃ© ?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-kelen-red-500">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-kelen-green-600 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connexion...
          </span>
        ) : (
          "Se connecter"
        )}
      </button>
    </form>
    </div>
  );
}
