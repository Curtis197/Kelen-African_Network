import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — Kelen",
  description: "Découvrez comment Kelen protège et traite vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 prose prose-stone max-w-none">
      <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
      
      <section className="mt-8">
        <h2 className="text-xl font-semibold">1. Collecte des données</h2>
        <p className="mt-2 text-muted-foreground">
          Nous collectons les informations nécessaires à la vérification des professionnels 
          (nom, adresse mail, pièces justificatives de projets) pour assurer la transparence du service.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">2. Utilisation des données</h2>
        <p className="mt-2 text-muted-foreground">
          Vos données sont utilisées pour créer votre profil, gérer les recommandations 
          et assurer la sécurité du système de confiance Kelen. Nous ne vendons jamais vos données à des tiers.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">3. Sécurité</h2>
        <p className="mt-2 text-muted-foreground">
          Nous utilisons des protocoles de sécurité standards (chiffrement SSL, 
          accès restreints) pour protéger vos informations contre tout accès non autorisé.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">4. Vos droits</h2>
        <p className="mt-2 text-muted-foreground">
          Conformément au RGPD et aux législations locales, vous disposez d&apos;un droit d&apos;accès, 
          de rectification et de suppression de vos données personnelles.
        </p>
      </section>

      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-xs text-muted-foreground italic">
          Dernière mise à jour : 25 mars 2024
        </p>
      </div>
    </div>
  );
}
