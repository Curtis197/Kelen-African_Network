import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/shared/SearchBar";
import { Search, ShieldCheck, FolderPlus, ArrowRight } from "lucide-react";

export default function SearchHubPage() {
  return (
    <>
      {/* ===== SEARCH HERO ===== */}
      <section className="relative overflow-hidden bg-white">
        {/* Subtle decorative accent */}
        <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-kelen-green-50 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-kelen-yellow-50 opacity-50 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Construisez en Afrique en toute{" "}
              <span className="text-kelen-green-500">confiance</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground">
              Vérifiez l&apos;historique des professionnels du bâtiment,
              consultez les preuves de leurs réalisations et démarrez votre projet sereinement.
            </p>

            <div className="mx-auto mt-10 max-w-2xl">
              <div className="rounded-2xl bg-white p-2 shadow-xl shadow-kelen-green-900/5 ring-1 ring-border">
                <Suspense fallback={<div className="h-12 w-full animate-pulse bg-muted rounded-xl" />}>
                  <SearchBar size="lg" placeholder="Chercher un maçon, un architecte, une entreprise..." />
                </Suspense>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 inline-flex bg-kelen-green-50 text-kelen-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4" /> Entièrement vérifié
                </span>
                <span>Plus de 500+ professionnels documentés</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUICK ACTIONS ===== */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Start a project */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-10 shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute right-0 top-0 -mr-8 -mt-8 rounded-full bg-kelen-green-50 p-16 transition-transform group-hover:scale-110">
                <FolderPlus className="h-16 w-16 text-kelen-green-200" />
              </div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-foreground">Préparer un projet</h3>
                <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">
                  Centralisez vos documents, définissez votre budget, et suivez
                  l&apos;avancée de vos travaux avec les professionnels Kelen.
                </p>
                <div className="mt-8">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-kelen-green-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-kelen-green-600"
                  >
                    Démarrer maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Verification System */}
            <div className="group relative overflow-hidden rounded-3xl bg-kelen-yellow-50 p-10 shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute right-0 top-0 -mr-8 -mt-8 rounded-full bg-white p-16 transition-transform group-hover:scale-110">
                <Search className="h-16 w-16 text-kelen-yellow-100" />
              </div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-kelen-yellow-900">Notre système</h3>
                <p className="mt-4 max-w-sm leading-relaxed text-kelen-yellow-800/80">
                  Découvrez comment nous enquêtons et vérifions méticuleusement chaque contrat, photo et délai avant publication.
                </p>
                <div className="mt-8">
                  <Link
                    href="/a-propos"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-kelen-yellow-700 shadow-sm transition-colors hover:bg-stone-50"
                  >
                    Découvrir notre méthode
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
