"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// ── Country codes (West Africa + common diaspora) ──────────────────────────
const COUNTRY_CODES = [
  { code: "+221", flag: "🇸🇳", name: "Sénégal" },
  { code: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "+223", flag: "🇲🇱", name: "Mali" },
  { code: "+224", flag: "🇬🇳", name: "Guinée" },
  { code: "+226", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "+227", flag: "🇳🇪", name: "Niger" },
  { code: "+228", flag: "🇹🇬", name: "Togo" },
  { code: "+229", flag: "🇧🇯", name: "Bénin" },
  { code: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "+213", flag: "🇩🇿", name: "Algérie" },
  { code: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+32", flag: "🇧🇪", name: "Belgique" },
  { code: "+41", flag: "🇨🇭", name: "Suisse" },
  { code: "+1", flag: "🇨🇦", name: "Canada / USA" },
];

const RESEND_DELAY = 60;

type Step = "phone" | "otp" | "profile";

interface WhatsAppAuthModalProps {
  open: boolean;
  onClose: () => void;
  role: "client" | "professional";
}

export function WhatsAppAuthModal({
  open,
  onClose,
  role,
}: WhatsAppAuthModalProps) {
  const router = useRouter();
  const supabase = createClient();

  // ── State ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [localNumber, setLocalNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneE164 = `${countryCode}${localNumber.replace(/\D/g, "")}`;

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("phone");
        setLocalNumber("");
        setOtp("");
        setName("");
        setEmail("");
        setError(null);
        setCountdown(0);
        if (timerRef.current) clearInterval(timerRef.current);
      }, 300);
    }
  }, [open]);

  // OTP auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && step === "otp") {
      handleVerifyOtp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // ── Helpers ────────────────────────────────────────────────────────────
  function startCountdown() {
    setCountdown(RESEND_DELAY);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function exchangeToken(token_hash: string, type: string) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (verifyError) throw verifyError;

    // Redirect based on role
    router.push(role === "professional" ? "/pro/dashboard" : "/dashboard");
    router.refresh();
  }

  // ── Step 1: Send OTP ────────────────────────────────────────────────────
  async function handleSendOtp() {
    setError(null);

    const digits = localNumber.replace(/\D/g, "");
    if (digits.length < 7) {
      setError("Veuillez entrer un numéro valide");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneE164 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi du code");
        return;
      }

      setStep("otp");
      setOtp("");
      startCountdown();
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────
  async function handleVerifyOtp() {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneE164, code: otp, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtp("");
        if (data.redirect) {
          setError(data.error);
          return;
        }
        setError(data.error || "Code incorrect");
        return;
      }

      if (data.status === "new_user") {
        setStep("profile");
        return;
      }

      // Existing user — exchange token for session
      await exchangeToken(data.token_hash, data.type);
    } catch {
      setError("Erreur inattendue, réessayez");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 3: Complete profile ────────────────────────────────────────────
  async function handleCompleteProfile() {
    setError(null);
    if (!name.trim()) {
      setError("Le prénom / nom est requis");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/whatsapp/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneE164,
          name: name.trim(),
          email: email.trim() || undefined,
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création du compte");
        return;
      }

      await exchangeToken(data.token_hash, data.type);
    } catch {
      setError("Erreur inattendue, réessayez");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────
  const ErrorBox = ({ msg }: { msg: string }) => (
    <div className="rounded-lg border border-kelen-red-500/20 bg-kelen-red-50 px-4 py-3 text-sm text-kelen-red-700">
      {msg}
    </div>
  );

  const stepLabels: Record<Step, { title: string; description: string }> = {
    phone: {
      title: "Connexion via WhatsApp",
      description: "Entrez votre numéro pour recevoir un code de vérification",
    },
    otp: {
      title: "Vérification",
      description: `Code envoyé au ${phoneE164} via WhatsApp`,
    },
    profile: {
      title: "Votre profil",
      description: "Dernière étape — quelques informations pour votre compte",
    },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {/* WhatsApp icon header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10">
            <WhatsAppIcon />
          </div>
          <div>
            <DialogHeader className="text-left p-0">
              <DialogTitle className="text-base">
                {stepLabels[step].title}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {stepLabels[step].description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-4">
          {(["phone", "otp", "profile"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                ["phone", "otp", "profile"].indexOf(step) >= i
                  ? "bg-[#25D366]"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* ── Step 1: Phone ─────────────────────────────────────────── */}
        {step === "phone" && (
          <div className="space-y-4">
            {error && <ErrorBox msg={error} />}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Numéro WhatsApp
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="77 123 45 67"
                  value={localNumber}
                  onChange={(e) => setLocalNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="input-field flex-1"
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Sans le zéro initial · ex: 77 123 45 67
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  <WhatsAppIcon className="h-4 w-4" />
                  Envoyer le code
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Step 2: OTP ───────────────────────────────────────────── */}
        {step === "otp" && (
          <div className="space-y-4">
            {error && <ErrorBox msg={error} />}

            <div className="flex flex-col items-center gap-4 py-2">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-11 w-11 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-3.5 w-3.5" />
                  Vérification…
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Modifier le numéro
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtp("");
                  setError(null);
                  handleSendOtp();
                }}
                disabled={countdown > 0 || isLoading}
                className="font-medium text-[#25D366] hover:text-[#1ea855] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Renvoyer (${countdown}s)` : "Renvoyer"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Profile ───────────────────────────────────────── */}
        {step === "profile" && (
          <div className="space-y-4">
            {error && <ErrorBox msg={error} />}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Prénom et nom <span className="text-kelen-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Amadou Diallo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Email{" "}
                <span className="text-muted-foreground font-normal">
                  (optionnel)
                </span>
              </label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Pour recevoir vos confirmations par email
              </p>
            </div>

            <button
              type="button"
              onClick={handleCompleteProfile}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : "Créer mon compte"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ color: "#25D366" }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
