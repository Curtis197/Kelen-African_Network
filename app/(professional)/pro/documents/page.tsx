import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      

<header className="bg-[#f9f9f8]/70 backdrop-blur-xl border-b border-[#bbcabf]/15 sticky top-0 z-50">
<div className="flex justify-between items-center w-full px-6 py-3">
<div className="flex items-center gap-8">
<h1 className="text-xl font-bold tracking-tight text-on-surface font-headline">Digital Diplomat</h1>
<div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-1.5 border border-outline-variant/10">
<span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
<input className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant/50" placeholder="Rechercher un document..." type="text"/>
</div>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors duration-200">
<span className="material-symbols-outlined">notifications</span>
</button>
<button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors duration-200">
<span className="material-symbols-outlined">settings</span>
</button>
<div className="h-8 w-px bg-outline-variant/20 mx-1"></div>
<div className="flex items-center gap-3 pl-2">
<div className="text-right hidden sm:block">
<p className="text-xs font-bold font-headline">Jean Dupont</p>
<p className="text-[10px] text-primary font-semibold uppercase tracking-wider">PRO KELEN</p>
</div>
<img alt="User profile avatar" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpWcbbqOmTY4Gk1WXTaf9mWJs6ZE8psrujUNxMQro0RZaT-62-iE7SlomzYsrwXZofnUfQEpWaklicszIYjU5OeTLAIxiY3z3IO1UOUiWx9pHncsBsUM1JOhn8izeYgVu-PLdf-sDG4deNyi_xyyZFqQVKwH9Pfznsqs1-YHMj56eabAxJ4h8jcGZTweoLJ6VBqvQM_podGjvNZ-Eyv5_YXgo8UmmK_p1v8N8RQVjClodfbXaDgauOch5p2CQJnRh8Ree_LMTwojM"/>
</div>
</div>
</div>
</header>

<div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">

<section className="space-y-4">
<div className="flex items-end justify-between">
<div className="space-y-2">
<span className="text-primary font-bold tracking-[0.2em] text-[10px] uppercase bg-primary-fixed/30 px-3 py-1 rounded-full">Certification &amp; Conformité</span>
<h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight">Mes Documents Légaux</h1>
<p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
                            Fournissez vos documents <span className="text-on-surface font-semibold underline decoration-primary/30 underline-offset-4">Contrats, PV de livraison, RC Pro</span> pour renforcer votre statut Kelen et accéder à des opportunités premium.
                        </p>
</div>
<div className="hidden lg:block">
<div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center gap-6">
<div className="text-center">
<p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Score Profil</p>
<div className="text-2xl font-black font-headline text-primary">85%</div>
</div>
<div className="w-12 h-12 rounded-full border-4 border-surface-container-highest border-t-primary rotate-45"></div>
</div>
</div>
</div>
</section>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

<div className="lg:col-span-5 space-y-6">
<div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/15">
<h3 className="font-headline font-bold text-xl mb-6 flex items-center gap-2">
<span className="material-symbols-outlined text-primary">cloud_upload</span>
                            Nouveau versement
                        </h3>
<div className="group relative flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 rounded-3xl p-12 bg-surface-container-low/30 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 cursor-pointer">
<div className="w-20 h-20 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
<span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
</div>
<p className="text-on-surface font-headline font-bold text-center mb-2">Glissez-déposez vos fichiers ici</p>
<p className="text-on-surface-variant text-sm text-center">ou cliquez pour parcourir votre ordinateur</p>
<input className="absolute inset-0 opacity-0 cursor-pointer" type="file"/>
<div className="mt-8 flex gap-3">
<span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">PDF</span>
<span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">JPG</span>
<span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Max 10Mo</span>
</div>
</div>
<div className="mt-8 p-4 bg-secondary-container/20 rounded-xl border border-secondary-container/30 flex gap-4">
<span className="material-symbols-outlined text-secondary">info</span>
<p className="text-xs text-on-secondary-container leading-relaxed">
<strong>Note importante :</strong> Assurez-vous que tous les documents sont lisibles et à jour pour éviter tout délai dans la validation de votre compte.
                            </p>
</div>
</div>
</div>

<div className="lg:col-span-7 space-y-6">
<div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant/15 overflow-hidden">
<div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
<h3 className="font-headline font-bold text-xl">Documents Soumis</h3>
<button className="text-sm font-bold text-primary hover:underline transition-all">Tout télécharger</button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low/50">
<th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Document</th>
<th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Type</th>
<th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Statut</th>
<th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/10">

<tr className="hover:bg-surface-container-low/30 transition-colors group">
<td className="px-8 py-5">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
<span className="material-symbols-outlined text-xl">picture_as_pdf</span>
</div>
<div>
<p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">KBT_Registration_2023.pdf</p>
<p className="text-[10px] text-on-surface-variant">Modifié le 12 Oct 2023</p>
</div>
</div>
</td>
<td className="px-6 py-5">
<span className="text-xs font-medium text-on-surface-variant">Kbis</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
<span className="w-1.5 h-1.5 rounded-full bg-on-secondary-container animate-pulse"></span>
                                                En cours de vérification
                                            </span>
</td>
<td className="px-8 py-5 text-right">
<div className="flex items-center justify-end gap-2">
<button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-all">
<span className="material-symbols-outlined text-xl">visibility</span>
</button>
<button className="p-2 hover:bg-error/10 rounded-lg text-error transition-all">
<span className="material-symbols-outlined text-xl">delete</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/30 transition-colors group">
<td className="px-8 py-5">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary-fixed/30 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-xl">description</span>
</div>
<div>
<p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Assurance_RC_Pro_24.pdf</p>
<p className="text-[10px] text-on-surface-variant">Modifié le 05 Jan 2024</p>
</div>
</div>
</td>
<td className="px-6 py-5">
<span className="text-xs font-medium text-on-surface-variant">Assurance RC Pro</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary text-[11px] font-bold">
<span className="material-symbols-outlined text-xs">check_circle</span>
                                                Vérifié
                                            </span>
</td>
<td className="px-8 py-5 text-right">
<div className="flex items-center justify-end gap-2">
<button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-all">
<span className="material-symbols-outlined text-xl">visibility</span>
</button>
<button className="p-2 hover:bg-error/10 rounded-lg text-error transition-all">
<span className="material-symbols-outlined text-xl">delete</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/30 transition-colors group">
<td className="px-8 py-5">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined text-xl">id_card</span>
</div>
<div>
<p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">ID_Card_Front.jpg</p>
<p className="text-[10px] text-on-surface-variant">Modifié le 01 Oct 2023</p>
</div>
</div>
</td>
<td className="px-6 py-5">
<span className="text-xs font-medium text-on-surface-variant">Pièce d'identité</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-error text-[11px] font-bold">
<span className="material-symbols-outlined text-xs">cancel</span>
                                                Refusé
                                            </span>
</td>
<td className="px-8 py-5 text-right">
<div className="flex items-center justify-end gap-2">
<button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-all">
<span className="material-symbols-outlined text-xl">visibility</span>
</button>
<button className="p-2 hover:bg-error/10 rounded-lg text-error transition-all">
<span className="material-symbols-outlined text-xl">delete</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
<div className="p-6 bg-surface-container-low/20 text-center">
<button className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
<span className="material-symbols-outlined text-lg">history</span>
                                Voir l'historique complet des documents
                            </button>
</div>
</div>

<div className="bg-primary-gradient p-8 rounded-[2rem] text-on-primary flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-primary/20">
<div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
<span className="material-symbols-outlined text-3xl" >verified_user</span>
</div>
<div className="text-center md:text-left">
<h4 className="font-headline font-bold text-lg leading-tight mb-1">Badge de Confiance Kelen</h4>
<p className="text-on-primary/80 text-sm">Une fois vos documents validés, vous obtiendrez le badge de partenaire certifié, augmentant votre visibilité de 40% auprès des investisseurs.</p>
</div>
<button className="mt-4 md:mt-0 px-6 py-3 bg-white text-primary font-bold rounded-xl text-sm whitespace-nowrap hover:bg-surface transition-colors">
                            En savoir plus
                        </button>
</div>
</div>
</div>
</div>

<footer className="mt-auto py-8 px-10 border-t border-outline-variant/10 text-on-surface-variant/60 text-xs flex flex-col md:flex-row justify-between gap-4">
<p>© 2024 Digital Diplomat - Plateforme de gestion Diaspora. Tous droits réservés.</p>
<div className="flex gap-6">
<Link className="hover:text-primary transition-colors" href="/">Politique de Confidentialité</Link>
<Link className="hover:text-primary transition-colors" href="/">Conditions Générales</Link>
<Link className="hover:text-primary transition-colors" href="/">Support</Link>
</div>
</footer>

    </main>
  );
}
