import type { Metadata } from "next";
import { Cookie, ArrowRight, Shield, AlertTriangle, Gavel, Server, Cloud, FileEdit } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Mentions Légales — Kelen",
  description: "Informations légales concernant l'éditeur et l'hébergeur du site Kelen.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="flex pt-16 min-h-screen">
      {/* SideNavBar - Desktop */}
      <aside className="hidden lg:flex flex-col gap-2 p-6 sticky top-16 h-[calc(100vh-4rem)] w-72 bg-surface-container-low">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gavel className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-on-surface leading-tight">Mentions Légales</h2>
              <p className="text-xs text-on-surface-variant font-medium">Dernière mise à jour: Mars 2026</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          <a
            className="flex items-center gap-3 px-4 py-3 bg-surface-container-lowest text-primary rounded-lg shadow-sm font-bold transition-all duration-200"
            href="#editeur"
          >
            <FileEdit />
            <span>Éditeur</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#hebergement"
          >
            <Server />
            <span>Hébergement</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#propriete"
          >
            <Gavel />
            <span>Propriété</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#donnees"
          >
            <Shield />
            <span>Données</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#cookies"
          >
            <Cookie />
            <span>Cookies</span>
          </a>
        </nav>
        <div className="mt-auto p-4 bg-primary rounded-xl text-on-primary shadow-lg shadow-primary/20">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-2 text-on-primary">Besoin d'aide ?</p>
          <p className="text-sm font-medium mb-4 text-on-primary">Contactez notre équipe juridique pour toute question.</p>
          <button className="w-full py-2 bg-on-primary/20 hover:bg-on-primary/30 transition-colors rounded-lg text-sm font-bold text-on-primary">
            Nous contacter
          </button>
        </div>
      </aside>

      {/* Content Canvas */}
      <section className="flex-1 bg-surface p-8 lg:p-16 max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="mb-20">
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            Gouvernance & Transparence
          </span>
          <h1 className="font-headline text-5xl lg:text-7xl font-bold text-on-surface mb-8 tracking-tight">
            Le cadre de votre <span className="text-primary">souveraineté numérique</span>.
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Kelen s'engage pour une transparence totale. Ce document détaille les aspects légaux régissant la plateforme Kelen et nos engagements envers la communauté des investisseurs et professionnels.
          </p>
        </div>

        {/* Content Sections with Asymmetric Layout */}
        <div className="space-y-32">
          {/* Section: Éditeur */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="editeur">
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <span className="inline-block p-3 rounded-2xl bg-surface-container-low text-primary mb-4">
                  <FileEdit className="text-3xl" />
                </span>
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-4 italic">Éditeur du site</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">Informations relatives à l&apos;identité de l&apos;entreprise et à la direction de la publication.</p>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-surface-container-lowest p-8 lg:p-12 rounded-xl shadow-xl shadow-on-surface/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest">Identité Sociale</label>
                    <p className="text-on-surface font-medium text-lg leading-relaxed">
                      Kelen Diaspora SAS<br />
                      Capital social de 50,000 €<br />
                      RCS Paris B 123 456 789
                    </p>
                  </div>
                  <div className="space-y-6">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest">Siège Social</label>
                    <p className="text-on-surface font-medium text-lg leading-relaxed">
                      15 Avenue de la République<br />
                      75011 Paris, France
                    </p>
                  </div>
                  <div className="space-y-6">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest">Direction</label>
                    <p className="text-on-surface font-medium text-lg leading-relaxed">
                      Directeur de publication :<br />
                      L&apos;Équipe Fondatrice Kelen
                    </p>
                  </div>
                  <div className="space-y-6">
                    <label className="block text-xs font-bold text-outline uppercase tracking-widest">Contact</label>
                    <p className="text-on-surface font-medium text-lg leading-relaxed">
                      legal@kelen-diaspora.com<br />
                      +33 (0) 1 88 88 00 00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Hébergement */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="hebergement">
            <div className="lg:col-span-8 order-2 lg:order-1">
              <div className="bg-surface-container-low p-1 rounded-xl">
                <div className="bg-surface-container-lowest p-8 lg:p-12 rounded-xl">
                  <h3 className="font-headline text-2xl font-bold mb-6">Infrastructure Cloud Souveraine</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-8">
                    Afin de garantir une sécurité maximale et la souveraineté des données de nos utilisateurs, le site est hébergé exclusivement sur des serveurs situés au sein de l&apos;Union Européenne.
                  </p>
                  <div className="flex items-center gap-6 p-6 bg-surface-container-low rounded-xl">
                    <div className="w-16 h-16 bg-surface-container-lowest rounded-lg flex items-center justify-center shadow-sm border border-outline-variant/10">
                      <Cloud className="text-4xl text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">Vercel Inc.</p>
                      <p className="text-sm text-on-surface-variant">650 California St, San Francisco, CA 94108, USA</p>
                      <a className="text-primary text-sm font-bold hover:underline" href="https://vercel.com" target="_blank" rel="noopener noreferrer">Accéder au site de l&apos;hébergeur</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 order-1 lg:order-2">
              <div className="sticky top-24 lg:text-right">
                <span className="inline-block p-3 rounded-2xl bg-surface-container-low text-secondary mb-4">
                  <Server className="text-3xl" />
                </span>
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-4 italic">Hébergement</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">Localisation et identification de notre partenaire d&apos;infrastructure.</p>
              </div>
            </div>
          </div>

          {/* Section: Propriété Intellectuelle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="propriete">
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <span className="inline-block p-3 rounded-2xl bg-surface-container-low text-error mb-4">
                  <Gavel className="text-3xl" />
                </span>
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-4 italic">Propriété</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">Protection des contenus, marques et designs de la plateforme.</p>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-surface-container-lowest p-8 lg:p-12 rounded-xl shadow-xl shadow-on-surface/5">
                <h3 className="font-headline text-2xl font-bold mb-6">Droits de reproduction</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  L&apos;ensemble des éléments constituant le site Kelen (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, etc.) ainsi que le site lui-même, relèvent des législations françaises et internationales sur le droit d&apos;auteur et la propriété intellectuelle.
                </p>
                <div className="mt-8 pt-8 border-t border-surface-container flex gap-4">
                  <AlertTriangle className="text-error" />
                  <p className="text-sm font-medium text-on-surface-variant">
                    Toute reproduction, représentation ou diffusion, totale ou partielle du contenu de ce site, sur quelque support ou par tout procédé que ce soit, est interdite sans autorisation préalable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Données & Cookies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="donnees">
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-xl shadow-on-surface/5 border-t-4 border-primary">
              <Shield className="text-primary text-4xl mb-6" />
              <h3 className="font-headline text-2xl font-bold mb-4">Données Personnelles</h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression des données vous concernant. Nous utilisons vos données uniquement pour le bon fonctionnement du service Kelen.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-on-surface font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  Délégué à la protection des données (DPO)
                </li>
                <li className="flex items-center gap-3 text-sm text-on-surface font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  Registre des traitements sécurisé
                </li>
              </ul>
              <button className="text-primary font-bold flex items-center gap-2 group">
                Politique de confidentialité
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="bg-on-surface p-10 rounded-xl shadow-xl text-surface" id="cookies">
              <Cookie className="text-secondary-container text-4xl mb-6 underline" />
              <h3 className="font-headline text-2xl font-bold mb-4">Politique des Cookies</h3>
              <p className="text-on-surface-variant leading-relaxed mb-6 opacity-80">
                Notre site utilise des cookies essentiels au fonctionnement technique et des outils d&apos;analyse anonymisés pour améliorer votre expérience utilisateur.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center pb-4 border-b border-surface-variant/10">
                  <span className="text-sm font-medium text-surface">Cookies Essentiels</span>
                  <span className="px-2 py-1 bg-surface/10 rounded text-[10px] font-bold uppercase tracking-widest text-primary-container">Actif</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-surface-variant/10">
                  <span className="text-sm font-medium text-surface">Analyses d&apos;audience</span>
                  <span className="px-2 py-1 bg-surface/10 rounded text-[10px] font-bold uppercase tracking-widest text-surface/50">Optionnel</span>
                </div>
              </div>
              <button className="w-full py-3 bg-surface text-on-surface rounded-lg font-bold hover:bg-surface-variant transition-colors">
                Gérer mes préférences
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
