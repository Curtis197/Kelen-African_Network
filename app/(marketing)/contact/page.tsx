'use client';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-kelen-green-50 text-kelen-green-700 text-xs font-semibold tracking-wider uppercase mb-6">Support Client</span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground tracking-tighter mb-6">Contactez-nous</h1>
          <p className="text-xl text-muted-foreground font-body leading-relaxed">Une question sur un professionnel ? Un problème avec votre compte ? Notre équipe est à votre disposition.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-border bg-stone-50 p-8 flex items-start gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-white border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">✉️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Par Email</h3>
                <p className="text-muted-foreground mb-4 text-sm">Une réponse garantie sous 24h.</p>
                <Link className="text-kelen-green-600 font-semibold hover:underline transition-all" href="mailto:contact@kelen.com">contact@kelen.com</Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-stone-50 p-8 flex items-start gap-6 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-white border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Support Kelen</h3>
                <p className="text-muted-foreground mb-4 text-sm">Une assistance rapide et humaine.</p>
                <Link className="text-kelen-green-600 font-semibold hover:underline transition-all" href="/faq">Consulter la FAQ</Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-8 md:p-12 rounded-2xl border border-border shadow-lg">
              <form action="#" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-muted-foreground">Nom complet</label>
                    <input className="w-full bg-stone-50 border border-border rounded-xl py-4 px-6 focus:ring-2 focus:ring-kelen-green-500/20 focus:border-kelen-green-500 outline-none text-foreground transition-all" placeholder="Jean Dupont" type="text"/>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-muted-foreground">Email</label>
                    <input className="w-full bg-stone-50 border border-border rounded-xl py-4 px-6 focus:ring-2 focus:ring-kelen-green-500/20 focus:border-kelen-green-500 outline-none text-foreground transition-all" placeholder="jean@example.com" type="email"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-muted-foreground">Sujet</label>
                  <select className="w-full bg-stone-50 border border-border rounded-xl py-4 px-6 focus:ring-2 focus:ring-kelen-green-500/20 focus:border-kelen-green-500 outline-none text-foreground transition-all appearance-none">
                    <option>Support Technique</option>
                    <option>Vérification de professionnel</option>
                    <option>Questions Commerciales</option>
                    <option>Partenariats</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-muted-foreground">Message</label>
                  <textarea className="w-full bg-stone-50 border border-border rounded-xl py-4 px-6 focus:ring-2 focus:ring-kelen-green-500/20 focus:border-kelen-green-500 outline-none text-foreground transition-all resize-none" placeholder="Comment pouvons-nous vous aider ?" rows={5}></textarea>
                </div>
                <div className="pt-4">
                  <button className="w-full py-5 rounded-2xl bg-kelen-green-500 text-white font-bold text-lg shadow-lg hover:bg-kelen-green-600 transition-all" type="submit">
                    Envoyer le message
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">En envoyant ce formulaire, vous acceptez notre politique de confidentialité.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
