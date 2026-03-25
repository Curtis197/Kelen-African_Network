import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      

<header className="docked full-width top-0 sticky z-50 bg-stone-50/70 dark:bg-stone-900/70 backdrop-blur-xl border-b border-stone-200/10 dark:border-stone-800/10 shadow-sm dark:shadow-none flex justify-between items-center w-full px-8 py-3">
<div className="flex items-center gap-8">
<div className="md:hidden">
<span className="text-xl font-bold tracking-tight text-[#10b77f]">Diaspora</span>
</div>
<div className="hidden lg:flex items-center gap-6">
<Link className="text-stone-600 dark:text-stone-400 font-medium hover:text-[#10b77f] transition-colors duration-200" href="/">Support</Link>
<Link className="text-stone-600 dark:text-stone-400 font-medium hover:text-[#10b77f] transition-colors duration-200" href="/">Enterprise</Link>
</div>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-stone-600 hover:text-[#10b77f] transition-colors">
<span className="material-symbols-outlined">notifications</span>
</button>
<button className="p-2 text-stone-600 hover:text-[#10b77f] transition-colors">
<span className="material-symbols-outlined">settings</span>
</button>
<div className="h-8 w-8 rounded-full overflow-hidden border-2 border-primary-container">
<img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2ylP1PqRRrWDpS3bcSTWolXV2vu1-S3U0uTiN9NBW3cH0HRyvLjQfWst8ZTp-OLaN9xzXc3kD7LPMXE4eXgHWOtjeY8hcFH6-xzqK9GtWFRddrsxGk8CxzRVBRDooM6B2HsmM7ODa4XD48crsSm5JNCMtX9TFFLcbT6LzJnesVVDnLfN1_cvE68nRVCrLWEAhQgyJdMlRgGf9sWBZ4bss7FjQXlR9UFgjqCSzGF3hctwhLV-Sv3XlzpD4Z4gSPHlokSNlywTHNfs"/>
</div>
</div>
</header>
<div className="p-8 max-w-6xl mx-auto">

<div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
<div>
<h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Abonnement &amp; Visibilité</h2>
<p className="text-on-surface-variant max-w-lg">Gérez vos performances de visibilité et suivez vos transactions en toute transparence.</p>
</div>
<button className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-semibold hover:bg-surface-container-highest transition-colors">
<span className="material-symbols-outlined text-[20px]">credit_card</span>
<span>Gérer mon moyen de paiement</span>
</button>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

<div className="lg:col-span-8 flex flex-col gap-8">

<section className="premium-gradient rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">

<div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
<div className="relative z-10">
<div className="flex justify-between items-start mb-12">
<div>
<span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 inline-block">Statut Abonnement</span>
<h3 className="text-3xl font-bold font-headline">Premium Kelen</h3>
</div>
<div className="text-right">
<p className="text-white/80 text-sm mb-1 font-medium">Prochain renouvellement</p>
<p className="font-bold">14 Oct. 2024</p>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
<div>
<div className="flex justify-between items-end mb-3">
<p className="text-5xl font-extrabold font-headline">Actif</p>
<p className="text-white/80 font-medium mb-1">Visibilité illimitée</p>
</div>
<div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
<div className="h-full bg-white rounded-full w-full"></div>
</div>
<p className="mt-3 text-xs text-white/70 italic">Votre profil est actuellement indexé sur Google et visible dans les annuaires.</p>
</div>
<div className="flex flex-col gap-3">
<button className="bg-white text-primary font-bold py-3 rounded-xl hover:bg-stone-50 transition-colors shadow-sm">
                                        Gérer mon abonnement
                                    </button>
</div>
</div>
</div>
</section>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="bg-surface-container-lowest p-8 rounded-2xl border border-transparent hover:border-outline-variant/20 transition-all duration-300">
<h4 className="text-xl font-bold font-headline mb-2">Version Gratuite</h4>
<p className="text-on-surface-variant text-sm mb-6">Visibilité interne pour maintenir votre présence digitale.</p>
<div className="text-3xl font-bold mb-8">0 FCFA<span className="text-sm font-normal text-on-surface-variant"> / mois</span></div>
<ul className="space-y-4 mb-8">
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#10b77f] text-lg">check_circle</span>
<span>Recherche par nom exact</span>
</li>
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#10b77f] text-lg">check_circle</span>
<span>Maximum 3 projets</span>
</li>
<li className="flex items-center gap-3 text-sm text-stone-400">
<span className="material-symbols-outlined text-lg">cancel</span>
<span>Non indexé sur Google</span>
</li>
</ul>
<button className="w-full py-3 border border-outline-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-low transition-colors">
                                Passer à cette version
                            </button>
</div>

<div className="bg-surface-container-low p-8 rounded-2xl border-2 border-primary/20 relative">
<div className="absolute -top-3 right-8 bg-secondary-container text-on-secondary-container text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                                Actif
                            </div>
<h4 className="text-xl font-bold font-headline mb-2">Abonnement Premium</h4>
<p className="text-on-surface-variant text-sm mb-6">Maximisez votre impact et votre SEO avec l'offre complète.</p>
<div className="text-3xl font-bold mb-8 text-primary">3000 FCFA<span className="text-sm font-normal text-on-surface-variant"> / mois</span></div>
<ul className="space-y-4 mb-8">
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#10b77f] text-lg">check_circle</span>
<span>Indexation Google (SEO)</span>
</li>
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#10b77f] text-lg">check_circle</span>
<span>Projets illimités & Vidéos</span>
</li>
<li className="flex items-center gap-3 text-sm">
<span className="material-symbols-outlined text-[#10b77f] text-lg">check_circle</span>
<span>Visibilité dans les annuaires</span>
</li>
</ul>
<button className="w-full py-3 premium-gradient text-white rounded-xl font-bold shadow-md hover:opacity-95 transition-opacity">
                                Plan Actuel
                            </button>
</div>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-8">

<section className="bg-surface-container-lowest p-6 rounded-2xl">
<div className="flex items-center justify-between mb-6">
<h3 className="font-headline font-bold text-lg">Historique de facturation</h3>
<span className="material-symbols-outlined text-on-surface-variant">history</span>
</div>
<div className="space-y-2">

<div className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-primary">receipt_long</span>
</div>
<div>
<p className="font-bold text-sm">Abonnement Premium</p>
<p className="text-xs text-on-surface-variant">01 Sept. 2024</p>
</div>
</div>
<div className="text-right flex flex-col items-end gap-1">
<span className="text-sm font-bold">15,00 €</span>
<span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Payée</span>
</div>
<button className="ml-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
<span className="material-symbols-outlined text-on-surface-variant text-xl">download</span>
</button>
</div>

<div className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-container-low transition-colors group">
<div className="flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-primary">receipt_long</span>
</div>
<div>
<p className="font-bold text-sm">Abonnement Premium</p>
<p className="text-xs text-on-surface-variant">01 Août 2024</p>
</div>
</div>
<div className="text-right flex flex-col items-end gap-1">
<span className="text-sm font-bold">15,00 €</span>
<span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Payée</span>
</div>
<button className="ml-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
<span className="material-symbols-outlined text-on-surface-variant text-xl">download</span>
</button>
</div>
</div>
<button className="w-full mt-6 py-2 text-sm font-semibold text-primary hover:underline transition-all">
                            Voir toutes les factures
                        </button>
</section>

<section className="bg-secondary-fixed text-on-secondary-fixed p-6 rounded-2xl border-none">
<div className="flex gap-4">
<span className="material-symbols-outlined text-2xl">lightbulb</span>
<div>
<h4 className="font-bold mb-1">Astuce Visibilité</h4>
<p className="text-sm opacity-80">Les profils avec une photo de couverture professionnelle reçoivent 40% de vues supplémentaires en moyenne.</p>
<Link className="inline-block mt-4 text-xs font-bold underline decoration-2 underline-offset-4 uppercase tracking-tighter" href="/">Optimiser mon profil</Link>
</div>
</div>
</section>

<section className="p-6 rounded-2xl border border-outline-variant/30 flex flex-col items-center text-center">
<img alt="Support" className="w-24 h-24 mb-4 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHn-53ZiE9yo0eVHvfOXJs89XPrdQKps-IRhkpxxtU22aNidloPThJd288e4v5JRT5c_tVGD1ntAUpItlfeoRWF1aUmOBaUUBib4M2UxL5aHdx7u97LF74IBKpS5gFuYlaoI1kkhQWlWD7GMLBeaNEi9O-K2G4w14RufCIJxDOC2S09uMkZYdjritv6MVC7Voq7Sg-sIcJJa7DAe3DEltufMZtP18FxIYfZJT9HM7_XdNzM337VfQesNgK43fmJ2KD4MaDxMDTFR4"/>
<h4 className="font-headline font-bold text-lg mb-2">Besoin d'aide ?</h4>
<p className="text-sm text-on-surface-variant mb-6">Une question sur votre abonnement ou une facture ? Nos experts sont là.</p>
<button className="bg-surface-container-highest text-on-surface w-full py-3 rounded-xl font-bold hover:bg-surface-dim transition-colors">
                            Contacter le Support
                        </button>
</section>
</div>
</div>
</div>

<footer className="mt-20 py-10 px-8 border-t border-outline-variant/10 text-center text-xs text-on-surface-variant">
<p>© 2024 Kelen Africa. Tous droits réservés.</p>
</footer>

    </main>
  );
}
