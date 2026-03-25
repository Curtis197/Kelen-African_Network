import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales — Kelen",
  description: "Informations légales concernant l'éditeur et l'hébergeur du site Kelen.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 prose prose-stone max-w-none">
      <h1 className="text-3xl font-bold">Mentions Légales</h1>
      
      <section className="mt-8">
        <h2 className="text-xl font-semibold">1. Édition du site</h2>
        <p className="mt-2 text-muted-foreground">
          Le site <strong>Kelen</strong> est édité par Kelen SAS, société au capital de 10 000 euros, 
          dont le siège social est situé à Abidjan, Côte d&apos;Ivoire.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">2. Responsable de publication</h2>
        <p className="mt-2 text-muted-foreground">
          Directeur de la publication : Équipe Fondatrice Kelen. 
          Contact : management@kelen.com
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">3. Hébergement</h2>
        <p className="mt-2 text-muted-foreground">
          Le site est hébergé par Vercel Inc., situé au 650 California St, San Francisco, CA 94108, États-Unis.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">4. Propriété intellectuelle</h2>
        <p className="mt-2 text-muted-foreground">
          L&apos;ensemble de ce site relève de la législation internationale sur le droit d&apos;auteur et la propriété intellectuelle. 
          Tous les droits de reproduction sont réservés.
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
