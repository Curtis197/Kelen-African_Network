import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier le produit â€" Kelen Pro",
};

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
  }

  if (!user) {
    redirect("/pro/connexion");
  }

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profError) {
  }

  if (!professional) {
    redirect("/pro/profil");
  }

  // Fetch the product with images, verify ownership
  const { data: product, error: productError } = await supabase
    .from("professional_products")
    .select("*, product_images(*)")
    .eq("id", id)
    .eq("professional_id", professional.id)
    .single();

  if (productError) {
    notFound();
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Modifier : {product.title}
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Mettez à jour les informations et les médias de votre produit.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <ProductForm professionalId={professional.id} initialData={product} />
      </div>
    </div>
  );
}
