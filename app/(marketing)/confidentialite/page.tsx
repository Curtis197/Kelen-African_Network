import type { Metadata } from "next";
import { Shield, CloudCheck, Key, Lock, Mail, Trash, Edit, Eye, MonitorSmartphone, LineChart, Landmark, User, ShieldCheck, Settings, Database, Info } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Politique de Confidentialité — Kelen",
  description: "Comment Kelen protège et gère vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <div className="flex pt-16 min-h-screen">
      {/* SideNavBar - Desktop */}
      <aside className="hidden lg:flex flex-col gap-2 p-6 sticky top-16 h-[calc(100vh-4rem)] w-72 bg-surface-container-low">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-on-surface leading-tight">Vie Privée</h2>
              <p className="text-xs text-on-surface-variant font-medium">Version 2.1 — Mars 2026</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          <a
            className="flex items-center gap-3 px-4 py-3 bg-surface-container-lowest text-primary rounded-lg shadow-sm font-bold transition-all duration-200"
            href="#introduction"
          >
            <Info />
            <span>Introduction</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#collecte"
          >
            <Database />
            <span>Collecte</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#utilisation"
          >
            <Settings />
            <span>Utilisation</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#droits"
          >
            <ShieldCheck />
            <span>Vos Droits</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 rounded-lg transition-all duration-200"
            href="#securite"
          >
            <Lock />
            <span>Sécurité</span>
          </a>
        </nav>
        <div className="mt-auto p-4 bg-surface-container-highest rounded-xl border border-outline-variant/20">
          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest mb-1">Protection des données</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Kelen respecte scrupuleusement le RGPD et les standards internationaux de protection de la vie privée.
          </p>
        </div>
      </aside>

      {/* Content Canvas */}
      <section className="flex-1 bg-surface p-8 lg:p-16 max-w-6xl mx-auto">
        {/* Banner info */}
        <div className="mb-12 inline-flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Engagement Kelen : Données 100% sécurisées</span>
        </div>

        {/* Hero Header */}
        <div className="mb-20">
          <h1 className="font-headline text-5xl lg:text-7xl font-bold text-on-surface mb-8 tracking-tight">
            Transparence sur vos <span className="text-primary italic underline decoration-primary/20 underline-offset-8">données</span>.
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Votre confiance est notre actif le plus précieux. Nous détaillons ici avec clarté comment nous traitons vos informations pour vous offrir la meilleure expérience d&apos;investissement et de conseil.
          </p>
        </div>

        {/* Dynamic Content Sections */}
        <div className="space-y-32">
          {/* Section: 01 Introduction */}
          <div className="relative" id="introduction">
            <span className="absolute -left-12 top-0 text-6xl font-headline font-black text-on-surface/5 select-none">01</span>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
              <div className="lg:col-span-12">
                <h2 className="font-headline text-4xl font-bold text-on-surface mb-6 italic">Préambule et Engagement</h2>
                <div className="prose prose-lg max-w-4xl text-on-surface-variant leading-loose">
                  <p>
                    La présente Politique de Confidentialité décrit les règles de collecte, de traitement et de conservation de vos données personnelles. Elle s&apos;applique à toute personne utilisant la plateforme Kelen, qu&apos;il s&apos;agisse d&apos;un investisseur de la diaspora, d&apos;un porteur de projet ou d&apos;un expert professionnel.
                  </p>
                  <p>
                    Kelen agit en tant que responsable de traitement au sens du Règlement Général sur la Protection des Données (RGPD). Nous ne vendons jamais vos données à des tiers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: 02 Collecte des données */}
          <div className="relative" id="collecte">
            <span className="absolute -left-12 top-0 text-6xl font-headline font-black text-on-surface/5 select-none">02</span>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
              <div className="lg:col-span-5">
                <h2 className="font-headline text-4xl font-bold text-on-surface mb-6 italic">Collecte des Données</h2>
                <p className="text-on-surface-variant leading-relaxed">
                  Nous collectons uniquement les données nécessaires à l&apos;exécution de nos services et à la sécurisation de vos transactions.
                </p>
                <div className="mt-8 p-6 bg-surface-container-low rounded-2xl border-l-4 border-primary">
                  <p className="text-sm font-bold text-primary mb-2 italic">Minimalisation des données</p>
                  <p className="text-xs text-on-surface-variant">Nous n&apos;approfondissons la collecte que lorsque cela est strictement requis par les procédures de conformité KYC/KYB.</p>
                </div>
              </div>
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-surface-container-lowest rounded-xl shadow-lg shadow-on-surface/5 border border-outline-variant/10">
                    <User className="text-primary mb-4" />
                    <h4 className="font-bold mb-2">Profil</h4>
                    <p className="text-sm text-on-surface-variant">Nom, prénom, email, téléphone, pays de résidence.</p>
                  </div>
                  <div className="p-6 bg-surface-container-lowest rounded-xl shadow-lg shadow-on-surface/5 border border-outline-variant/10">
                    <Landmark className="text-primary mb-4" />
                    <h4 className="font-bold mb-2">Conformité</h4>
                    <p className="text-sm text-on-surface-variant">Pièces d&apos;identité, justificatifs de domicile, informations fiscales.</p>
                  </div>
                  <div className="p-6 bg-surface-container-lowest rounded-xl shadow-lg shadow-on-surface/5 border border-outline-variant/10">
                    <LineChart className="text-primary mb-4" />
                    <h4 className="font-bold mb-2">Activité</h4>
                    <p className="text-sm text-on-surface-variant">Historique des investissements, projets suivis, interactions messagerie.</p>
                  </div>
                  <div className="p-6 bg-surface-container-lowest rounded-xl shadow-lg shadow-on-surface/5 border border-outline-variant/10">
                    <MonitorSmartphone className="text-primary mb-4" />
                    <h4 className="font-bold mb-2">Technique</h4>
                    <p className="text-sm text-on-surface-variant">Adresse IP, type de navigateur, données de navigation (via cookies).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: 03 Utilisation */}
          <div className="relative" id="utilisation">
            <span className="absolute -left-12 top-0 text-6xl font-headline font-black text-on-surface/5 select-none">03</span>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
              <div className="lg:col-span-12">
                <div className="bg-on-surface p-12 lg:p-16 rounded-3xl text-surface overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <h2 className="relative font-headline text-4xl font-bold mb-8 italic">Finalités du traitement</h2>
                  <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 text-surface/80">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-surface/10 rounded-xl flex items-center justify-center text-primary font-bold">1</div>
                      <h4 className="text-surface font-bold">Service Central</h4>
                      <p className="text-sm leading-relaxed">Gestion de votre compte, accès à la plateforme et mise en relation investisseurs/porteurs.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-surface/10 rounded-xl flex items-center justify-center text-primary font-bold">2</div>
                      <h4 className="text-surface font-bold">Transactionnel & Sécurité</h4>
                      <p className="text-sm leading-relaxed">Supervision des flux financiers, lutte contre la fraude et blanchiment d&apos;argent.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-surface/10 rounded-xl flex items-center justify-center text-primary font-bold">3</div>
                      <h4 className="text-surface font-bold">Expérience Personnalisée</h4>
                      <p className="text-sm leading-relaxed">Recommandations de projets ciblés et envoi de notifications pertinentes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: 04 Droits */}
          <div className="relative" id="droits">
            <span className="absolute -left-12 top-0 text-6xl font-headline font-black text-on-surface/5 select-none">04</span>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4 items-center">
              <div className="lg:col-span-7">
                <h2 className="font-headline text-4xl font-bold text-on-surface mb-6 italic">Maîtrisez vos Données</h2>
                <div className="space-y-6">
                  <div className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-on-primary">
                      <Eye className="text-sm" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Droit d&apos;accès et portabilité</h4>
                      <p className="text-sm text-on-surface-variant">Récupérez une copie de toutes vos données stockées chez nous en un clic.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-on-primary">
                      <Edit className="text-sm" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Droit de rectification</h4>
                      <p className="text-sm text-on-surface-variant">Modifiez vos informations à tout moment via votre tableau de bord.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-error group-hover:text-on-error group-hover:border-error">
                      <Trash className="text-sm" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Droit à l&apos;oubli</h4>
                      <p className="text-sm text-on-surface-variant">Supprimez définitivement votre compte et vos données personnelles associées.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="p-8 bg-surface-container-low rounded-3xl border border-outline-variant/10 text-center">
                  <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Mail className="text-primary text-4xl" />
                  </div>
                  <h4 className="font-headline text-xl font-bold mb-2">Exercer vos droits</h4>
                  <p className="text-sm text-on-surface-variant mb-6">Contactez notre Délégué à la Protection des Données :</p>
                  <a href="mailto:privacy@kelen-diaspora.com" className="inline-block px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    privacy@kelen-diaspora.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Section: 05 Sécurité */}
          <div className="relative" id="securite">
            <span className="absolute -left-12 top-0 text-6xl font-headline font-black text-on-surface/5 select-none">05</span>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
              <div className="lg:col-span-12">
                <div className="border border-outline-variant/30 rounded-3xl p-12 flex flex-col items-center text-center">
                  <span className="px-6 py-2 bg-secondary/10 text-secondary text-xs font-black uppercase tracking-[0.3em] rounded-full mb-8">Protocoles de Sécurité</span>
                  <div className="flex flex-wrap justify-center gap-12">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="text-4xl text-on-surface/30" />
                      <span className="text-xs font-bold text-on-surface-variant uppercase">Chiffrement AES-256</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Key className="text-4xl text-on-surface/30" />
                      <span className="text-xs font-bold text-on-surface-variant uppercase">Double Authentification</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <CloudCheck className="text-4xl text-on-surface/30" />
                      <span className="text-xs font-bold text-on-surface-variant uppercase">Backup temps-réel</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="text-4xl text-on-surface/30" />
                      <span className="text-xs font-bold text-on-surface-variant uppercase">Audit Trimestriel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer simple for the page */}
        <div className="mt-40 pt-16 border-t border-outline-variant/10 text-center pb-20">
          <p className="text-sm text-on-surface-variant italic mb-2">« Vos données sont votre souveraineté, Kelen en est le gardien. »</p>
          <p className="text-xs text-outline font-bold uppercase tracking-widest">© 2026 Kelen Platform — Protection des données</p>
        </div>
      </section>
    </div>
  );
}
