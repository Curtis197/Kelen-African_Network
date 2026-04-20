import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/forms/ProductForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajouter un produit — Kelen Pro",
  description: "Ajoutez un produit à votre profil public Kelen.",
};

export default async function AddProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/pro/profil");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <Link
          href="/pro/realisations?tab=produits"
          className="mb-4 flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux produits
        </Link>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Nouveau produit
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Ajoutez un produit à votre profil public. Les visiteurs de votre profil pourront le découvrir et vous contacter.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <ProductForm professionalId={professional.id} />
      </div>
    </div>
  );
}
