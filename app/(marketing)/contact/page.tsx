'use client';
import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      
<div className="max-w-7xl mx-auto">

<div className="mb-16 max-w-2xl">
<span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold tracking-wider uppercase mb-6">Support Client</span>
<h1 className="text-5xl md:text-6xl font-extrabold text-on-surface font-headline tracking-tighter mb-6">Contactez-nous</h1>
<p className="text-xl text-on-surface-variant font-body leading-relaxed">Une question sur un professionnel ? Un problème avec votre compte ? Notre équipe diplomatique est à votre disposition.</p>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

<div className="lg:col-span-5 space-y-6">

<div className="tonal-card p-8 rounded-2xl flex items-start gap-6 border border-outline-variant/10">
<div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-primary text-3xl">mail</span>
</div>
<div>
<h3 className="text-lg font-bold font-headline mb-1">Par Email</h3>
<p className="text-on-surface-variant mb-4 font-body">Une réponse garantie sous 24h.</p>
<Link className="text-primary font-semibold font-body hover:underline transition-all" href="mailto:contact@kelen.com">contact@kelen.com</Link>
</div>
</div>

<div className="tonal-card p-8 rounded-2xl flex items-start gap-6 border border-outline-variant/10">
<div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-primary text-3xl">chat</span>
</div>
<div>
<h3 className="text-lg font-bold font-headline mb-1">WhatsApp Support</h3>
<p className="text-on-surface-variant mb-4 font-body">Chattez en direct avec un conseiller.</p>
<Link className="text-primary font-semibold font-body hover:underline transition-all" href="/">Démarrer une discussion</Link>
</div>
</div>

<div className="tonal-card p-8 rounded-2xl flex items-start gap-6 border border-outline-variant/10">
<div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-primary text-3xl">help</span>
</div>
<div>
<h3 className="text-lg font-bold font-headline mb-1">FAQ Link</h3>
<p className="text-on-surface-variant mb-4 font-body">Trouvez vos réponses instantanément.</p>
<Link className="text-primary font-semibold font-body hover:underline transition-all" href="/">Consulter le centre d'aide</Link>
</div>
</div>

<div className="mt-12 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">
<img alt="Professional meeting" className="w-full h-48 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1mGz6ImkWM0tMtjisCFDZRM1_EYWQUq11t-wiG2ss_tCSSrpeFCKQiTkEVizQ89IsMFub-klNSHwrCbAz8HbRfyFVVhbGVtHus7dkwKMrrndrs2jIxMk8H5aurJtCSdIBcjoxCdG6CRNvOyhc1o251eeWiDWgOhW1wP1JBDrRgvzfuLavmx-Rz3lj8INzJ0zs8ynySeHOjt5dwObZmM0yZZvIOYYxQpXsfu3C__XyV7d4y7jJQ1KGGwLy-rAi8CqbxMO54ur3Ezs"/>
</div>
</div>

<div className="lg:col-span-7">
<div className="bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-xl shadow-on-surface/5 border border-outline-variant/5">
<form action="#" className="space-y-8">
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
<div className="space-y-2">
<label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">Full Name</label>
<input className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all outline-none text-on-surface font-body" placeholder="Jean Dupont" type="text"/>
</div>
<div className="space-y-2">
<label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">Email</label>
<input className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all outline-none text-on-surface font-body" placeholder="jean@example.com" type="email"/>
</div>
</div>
<div className="space-y-2">
<label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">Subject</label>
<div className="relative">
<select className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all outline-none text-on-surface font-body appearance-none">
<option>Support Technique</option>
<option>Questions Commerciales</option>
<option>Partenariats</option>
</select>
<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
<span className="material-symbols-outlined">expand_more</span>
</div>
</div>
</div>
<div className="space-y-2">
<label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">Message</label>
<textarea className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all outline-none text-on-surface font-body resize-none" placeholder="Comment pouvons-nous vous aider ?" rows={5}></textarea>
</div>
<div className="pt-4">
<button className="primary-gradient-btn w-full py-5 rounded-2xl text-white font-bold font-headline text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300" type="submit">
                                    Envoyer le message
                                </button>
<p className="text-center text-xs text-on-surface-variant mt-6 opacity-60 font-body">En envoyant ce formulaire, vous acceptez notre politique de confidentialité.</p>
</div>
</form>
</div>
</div>
</div>
</div>

    </main>
  );
}
