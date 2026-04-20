import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Gem } from "lucide-react";
import { getNewsletterData } from "@/lib/actions/newsletter";
import { NewsletterDashboard } from "@/components/newsletter/NewsletterDashboard";

export const metadata = { title: "Newsletter | Kelen Pro" };

export default async function NewsletterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/pro/connexion");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (!pro) return redirect("/pro/dashboard");

  const isPaid = pro.status === "gold" || pro.status === "silver";

  if (!isPaid) {
    return (
      <main className="min-h-screen pt-12 pb-24 px-6 md:px-12">
        <h1 className="text-3xl font-extrabold font-headline text-on-surface mb-2">Newsletter</h1>
        <p className="text-on-surface-variant mb-10">
          Gérez vos abonnés et envoyez des campagnes email à vos clients.
        </p>
        <div className="max-w-lg bg-surface-container-low rounded-2xl border border-border p-10 text-center">
          <Gem className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-headline text-on-surface mb-2">
            Fonctionnalité réservée
          </h2>
          <p className="text-on-surface-variant text-sm mb-6">
            La gestion de la newsletter est disponible pour les abonnés <strong>Gold</strong> et{" "}
            <strong>Silver</strong>. Améliorez votre abonnement pour débloquer cette fonctionnalité.
          </p>
          <Link
            href="/pro/abonnement"
            className="inline-flex items-center gap-2 px-6 py-3 bg-kelen-green-600 hover:bg-kelen-green-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            <Gem className="w-4 h-4" />
            Voir les offres
          </Link>
        </div>
      </main>
    );
  }

  const { subscribers, campaigns } = await getNewsletterData(pro.id);

  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold font-headline text-on-surface mb-2">Newsletter</h1>
          <p className="text-on-surface-variant">
            Gérez vos abonnés et envoyez des campagnes email à vos clients.
          </p>
        </div>

        <NewsletterDashboard subscribers={subscribers} campaigns={campaigns} />
      </div>
    </main>
  );
}
