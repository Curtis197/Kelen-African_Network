// lib/actions/domain.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { checkDomainAvailability, purchaseDomain } from "@/lib/domain/registrar";
import { addDomainToVercel } from "@/lib/domain/vercel-domains";
import { revalidatePath } from "next/cache";

async function getPaidProfessional() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: pro, error } = await supabase
    .from("professionals")
    .select("id, slug, status, owner_name, email, city, country, phone")
    .eq("user_id", user.id)
    .single();

  if (!pro) throw new Error("Profil non trouvé");
  if (pro.status !== "gold" && pro.status !== "silver") {
    throw new Error("Fonctionnalité réservée aux membres Gold et Silver");
  }

  return { supabase, pro };
}

export async function searchDomain(query: string) {
  const cleaned = query
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const tlds = [".com", ".africa", ".net"];
  const results = await Promise.all(
    tlds.map(tld => checkDomainAvailability(`${cleaned}${tld}`))
  );

  return results;
}

export async function activateDomain(domain: string) {
  const { supabase, pro } = await getPaidProfessional();

  const availability = await checkDomainAvailability(domain);
  if (!availability.available) throw new Error("Ce domaine n'est plus disponible.");

  const { error: pendingError } = await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: pro.id,
        custom_domain: domain,
        domain_status: "pending_purchase",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    );

  const nameParts = (pro.owner_name || "").split(" ");
  const purchase = await purchaseDomain(domain, {
    firstName: nameParts[0] || "Pro",
    lastName: nameParts.slice(1).join(" ") || "Kelen",
    email: pro.email,
    phone: pro.phone || "",
    address: "1 Rue Principale",
    city: pro.city || "Abidjan",
    country: pro.country || "CI",
  });

  if (!purchase.success) {
    await supabase
      .from("professional_portfolio")
      .update({ domain_status: "failed" })
      .eq("professional_id", pro.id);
    throw new Error(purchase.errorMessage || "Erreur lors de l'achat du domaine");
  }

  const vercel = await addDomainToVercel(domain);
  if (!vercel.success) {
    await supabase
      .from("professional_portfolio")
      .update({ domain_status: "failed" })
      .eq("professional_id", pro.id);
    throw new Error(vercel.errorMessage || "Erreur lors de l'activation Vercel");
  }

  const { error: activateError } = await supabase
    .from("professional_portfolio")
    .update({
      domain_status: vercel.verified ? "active" : "pending_dns",
      domain_purchased_at: new Date().toISOString(),
    })
    .eq("professional_id", pro.id);

  revalidatePath("/pro/site");
  return { success: true, domain, verified: vercel.verified };
}

export async function disconnectDomain() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: pro, error: proError } = await supabase
    .from("professionals")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (!pro) throw new Error("Profil non trouvé");

  const { error } = await supabase
    .from("professional_portfolio")
    .update({
      custom_domain: null,
      domain_status: null,
      updated_at: new Date().toISOString(),
    })
    .eq("professional_id", pro.id);

  if (error) throw new Error(error.message);

  revalidatePath("/pro/site");
  return { success: true };
}
