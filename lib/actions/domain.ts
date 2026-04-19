// lib/actions/domain.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { checkDomainAvailability, purchaseDomain } from "@/lib/domain/registrar";
import { addDomainToVercel } from "@/lib/domain/vercel-domains";
import { revalidatePath } from "next/cache";

async function getPaidProfessional() {
  console.log('[ACTION] getPaidProfessional: start');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: pro, error } = await supabase
    .from("professionals")
    .select("id, slug, status, owner_name, email, city, country, phone")
    .eq("user_id", user.id)
    .single();

  console.log('[DB] getPaidProfessional professionals query:', {
    hasData: !!pro,
    hasError: !!error,
    errorMessage: error?.message,
    errorCode: error?.code,
  });
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professionals, User:', user.id);
  }

  if (!pro) throw new Error("Profil non trouvé");
  if (pro.status !== "gold" && pro.status !== "silver") {
    throw new Error("Fonctionnalité réservée aux membres Gold et Silver");
  }

  console.log('[ACTION] getPaidProfessional: done', { proId: pro.id, status: pro.status });
  return { supabase, pro };
}

export async function searchDomain(query: string) {
  console.log('[ACTION] searchDomain: start', { query });

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

  console.log('[ACTION] searchDomain: done', { cleaned, results: results.map(r => ({ domain: r.domain, available: r.available })) });
  return results;
}

export async function activateDomain(domain: string) {
  console.log('[ACTION] activateDomain: start', { domain });
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

  console.log('[DB] activateDomain pending_purchase upsert:', {
    hasError: !!pendingError,
    errorMessage: pendingError?.message,
    errorCode: pendingError?.code,
  });
  if (pendingError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professional_portfolio, User:', pro.id);
  }

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

  console.log('[DB] activateDomain final status update:', {
    status: vercel.verified ? "active" : "pending_dns",
    hasError: !!activateError,
    errorMessage: activateError?.message,
  });

  revalidatePath("/pro/site");
  console.log('[ACTION] activateDomain: done', { domain, verified: vercel.verified });
  return { success: true, domain, verified: vercel.verified };
}
