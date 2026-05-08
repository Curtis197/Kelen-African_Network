"use client";

import { useState } from "react";
import { CreditCard, FileText, QrCode, Loader2 } from "lucide-react";

interface Props {
  professionalId: string;
  isPremium: boolean;
}

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  disabled?: boolean;
}

function MarketingToolCard({ title, description, icon, href, disabled }: ToolCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (disabled) return;
    setLoading(true);
    const win = window.open(href, "_blank");
    if (!win) {
      const { toast } = await import("sonner");
      toast.error("Pop-up bloqué. Autorisez les pop-ups pour ouvrir cet outil.");
    }
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="relative flex flex-col gap-3 rounded-xl border border-border bg-surface-container-low p-5 text-left transition-all hover:border-kelen-green-400 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kelen-green-50 text-kelen-green-600">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

export function MarketingToolsSection({ professionalId, isPremium }: Props) {
  const tools = [
    {
      title: "Carte de visite",
      description: "Recto : votre meilleure réalisation. Verso : vos coordonnées et QR code.",
      icon: <CreditCard className="h-5 w-5" />,
      href: `/api/business-card-print?professional_id=${professionalId}`,
    },
    {
      title: "Flyer A5",
      description: "Photo, services, réalisations, contact. Prêt à imprimer ou distribuer.",
      icon: <FileText className="h-5 w-5" />,
      href: `/api/flyer-print?professional_id=${professionalId}`,
    },
    {
      title: "Autocollant QR",
      description: "QR code vers votre profil Kelen. Pour votre véhicule, vitrine ou chantier.",
      icon: <QrCode className="h-5 w-5" />,
      href: `/api/qr-sticker-print?professional_id=${professionalId}`,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface-container-low">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold text-foreground">Outils marketing</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Générés depuis votre profil. Imprimez ou téléchargez en PDF.
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {tools.map((tool) => (
            <MarketingToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
