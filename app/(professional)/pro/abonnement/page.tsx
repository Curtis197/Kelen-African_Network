import { createClient } from "@/lib/supabase/server";
import Link from 'next/link';
import { redirect } from "next/navigation";
import { createCheckoutSession, cancelSubscription, getSubscriptionInfo } from "@/lib/actions/stripe";
import { Lightbulb, History, CheckCircle, XCircle, CreditCard, Bell } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Get professional and subscription
  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name")
    .eq("user_id", user.id)
    .single();

  if (!pro) {
    return redirect("/pro/dashboard");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("professional_id", pro.id)
    .single();

  // Mock fallbacks if no subscription record exists yet
  const planName = subscription?.plan === 'pro_africa' ? 'Premium Kelen' : 
                   subscription?.plan === 'pro_europe' ? 'Premium Europe' :
                   subscription?.plan === 'pro_intl' ? 'Premium International' : 'Gratuit';
  
  const status = subscription?.status || 'Aucun';
  const nextRenewal = subscription?.current_period_end ? 
    new Date(subscription.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 
    'N/A';

  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      <header className="docked full-width top-0 sticky z-50 bg-surface/70 backdrop-blur-xl border-b border-border/10 shadow-sm flex justify-between items-center w-full px-8 py-3">
        <div className="flex items-center gap-8">
          <div className="md:hidden">
            <span className="text-xl font-bold tracking-tight text-kelen-green-500">Kelen Pro</span>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <Link className="text-on-surface-variant font-medium hover:text-kelen-green-500 transition-colors duration-200" href="/">Support</Link>
            <Link className="text-on-surface-variant font-medium hover:text-kelen-green-500 transition-colors duration-200" href="/">Enterprise</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:text-kelen-green-500 transition-colors">
            <Bell />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-primary-container">
            <div className="w-full h-full bg-kelen-green-100 flex items-center justify-center text-kelen-green-700 font-bold text-xs">
              {pro.business_name[0]}
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Abonnement &amp; Visibilité</h2>
            <p className="text-on-surface-variant max-w-lg">Gérez vos performances de visibilité et suivez vos transactions en toute transparence.</p>
          </div>
          <form action={async () => {
            "use server";
            const result = await cancelSubscription();
            if (result.url) redirect(result.url);
          }}>
            <button className="inline-flex items-center gap-2 bg-surface-container text-on-surface px-6 py-3 rounded-xl font-semibold hover:bg-surface-container-high transition-colors">
              <CreditCard />
              <span>Gérer mon moyen de paiement</span>
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="bg-gradient-to-br from-kelen-green-600 to-kelen-green-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block">Statut Abonnement</span>
                    <h3 className="text-3xl font-bold font-headline">{planName}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm mb-1 font-medium">Prochain renouvellement</p>
                    <p className="font-bold">{nextRenewal}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <p className="text-5xl font-extrabold font-headline capitalize">{status === 'active' ? 'Actif' : status}</p>
                      <p className="text-white/80 font-medium mb-1">Visibilité illimitée</p>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full w-full"></div>
                    </div>
                    <p className="mt-3 text-xs text-white/70 italic">Votre profil est actuellement indexé sur Google et visible dans les annuaires.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <form action={async () => {
                      "use server";
                      const result = await cancelSubscription();
                      if (result.url) redirect(result.url);
                    }}>
                      <button className="bg-white text-kelen-green-700 font-bold py-3 rounded-xl hover:bg-stone-50 transition-colors shadow-sm">
                        Gérer mon abonnement
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low p-8 rounded-2xl border border-border hover:border-kelen-green-200 transition-all duration-300 shadow-sm">
                <h4 className="text-xl font-bold font-headline mb-2">Version Gratuite</h4>
                <p className="text-on-surface-variant text-sm mb-6">Visibilité interne pour maintenir votre présence digitale.</p>
                <div className="text-3xl font-bold mb-8">0 FCFA<span className="text-sm font-normal text-on-surface-variant/60"> / mois</span></div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CheckCircle className="text-kelen-green-600 text-lg" />
                    <span>Recherche par nom exact</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CheckCircle className="text-kelen-green-600 text-lg" />
                    <span>Maximum 3 projets</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant/40">
                    <XCircle className="text-lg" />
                    <span>Non indexé sur Google</span>
                  </li>
                </ul>
                <button className="w-full py-3 border border-border text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container transition-colors">
                  Passer à cette version
                </button>
              </div>

              <div className="bg-surface-container p-8 rounded-2xl border-2 border-kelen-green-500/20 shadow-sm relative">
                {subscription?.plan !== 'free' && (
                  <div className="absolute -top-3 right-8 bg-kelen-green-100 text-kelen-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-kelen-green-200">
                    Actif
                  </div>
                )}
                <h4 className="text-xl font-bold font-headline mb-2">Abonnement Premium</h4>
                <p className="text-on-surface-variant text-sm mb-6">Maximisez votre impact et votre SEO avec l&apos;offre complète.</p>
                <div className="text-3xl font-bold mb-8 text-kelen-green-600">3000 FCFA<span className="text-sm font-normal text-on-surface-variant/60"> / mois</span></div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CheckCircle className="text-kelen-green-600 text-lg" />
                    <span>Indexation Google (SEO)</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CheckCircle className="text-kelen-green-600 text-lg" />
                    <span>Projets illimités & Vidéos</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CheckCircle className="text-kelen-green-600 text-lg" />
                    <span>Visibilité dans les annuaires</span>
                  </li>
                </ul>
                <form action={async () => {
                  "use server";
                  const result = await createCheckoutSession("pro_africa");
                  if (result.url) redirect(result.url);
                }}>
                  <button className="w-full py-3 bg-gradient-to-r from-kelen-green-600 to-kelen-green-700 text-white rounded-xl font-bold shadow-md hover:opacity-95 transition-opacity">
                    {subscription?.plan !== 'free' ? 'Plan Actuel' : 'S\'abonner maintenant'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <section className="bg-surface-container-low p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-lg">Facturation</h3>
                <History className="text-on-surface-variant/40" />
              </div>
              <div className="space-y-4">
                <div className="text-center py-6 text-on-surface-variant/40 text-sm italic">
                  Aucune facture disponible pour le moment.
                </div>
              </div>
            </section>

            <section className="bg-stone-900 text-white p-6 rounded-2xl shadow-xl">
              <div className="flex gap-4">
                <Lightbulb className="text-kelen-yellow-500 text-2xl" />
                <div>
                  <h4 className="font-bold mb-1">Astuce Visibilité</h4>
                  <p className="text-sm text-stone-400 leadng-relaxed">Les profils avec une photo de couverture professionnelle reçoivent 40% de vues supplémentaires en moyenne.</p>
                  <Link className="inline-block mt-4 text-xs font-bold text-kelen-green-500 hover:text-kelen-green-400 transition-colors uppercase tracking-widest" href="/pro/profil">Optimiser mon profil</Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      <footer className="mt-20 py-10 px-8 border-t border-stone-100 text-center text-xs text-stone-400">
        <p>© 2025 Kelen Platforms. Build trust, build Africa.</p>
      </footer>
    </main>
  );
}
