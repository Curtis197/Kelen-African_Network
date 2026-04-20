"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { sendNewsletterBatch } from "@/lib/utils/newsletter-email";
import type {
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterAttachment,
  SubscribeResult,
  SendCampaignResult,
} from "@/lib/types/newsletter";

function log(action: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, ...data }));
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getProfessionalId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return data?.id || null;
}

const subscribeSchema = z.object({
  professionalId: z.string().uuid(),
  email: z.string().email("Email invalide"),
  name: z.string().max(100).optional(),
});

const campaignSchema = z.object({
  subject: z.string().min(1, "Le sujet est requis").max(200),
  bodyHtml: z.string().min(1, "Le contenu est requis").max(100_000),
});

const ALLOWED_HTML_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li',
  'a', 'h2', 'h3', 'blockquote', 'span',
];

export async function subscribeToNewsletter(
  professionalId: string,
  email: string,
  name?: string
): Promise<SubscribeResult> {
  const parsed = subscribeSchema.safeParse({ professionalId, email, name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_newsletter")
    .upsert(
      {
        professional_id: parsed.data.professionalId,
        email: parsed.data.email,
        name: parsed.data.name ?? null,
        is_active: true,
        unsubscribed_at: null,
        source: 'public_profile',
      },
      { onConflict: "professional_id,email", ignoreDuplicates: true }
    );

  if (error) {
    log("newsletter.subscribe.error", { error: error.message, code: error.code });
    return { success: false, error: "Une erreur est survenue. Veuillez réessayer." };
  }

  log("newsletter.subscribe.ok", { professionalId, email });
  return { success: true };
}

export async function unsubscribeByToken(
  token: string
): Promise<{ success: boolean; error?: string; businessName?: string }> {
  if (!token || token.length < 10) {
    return { success: false, error: "Lien invalide." };
  }

  const admin = getAdminClient();

  const { data: subscriber, error: findErr } = await admin
    .from("client_newsletter")
    .select("id, is_active, professional_id")
    .eq("unsubscribe_token", token)
    .single();

  if (findErr || !subscriber) {
    return { success: false, error: "Lien de désinscription invalide ou expiré." };
  }

  if (!subscriber.is_active) {
    return { success: false, error: "Vous êtes déjà désinscrit(e)." };
  }

  await admin
    .from("client_newsletter")
    .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriber.id);

  const { data: pro } = await admin
    .from("professionals")
    .select("business_name")
    .eq("id", subscriber.professional_id)
    .single();

  log("newsletter.unsubscribe.ok", { token: token.slice(0, 8) + "..." });
  return { success: true, businessName: pro?.business_name };
}

export async function getNewsletterData(proId: string): Promise<{
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
}> {
  const supabase = await createClient();

  const [{ data: subscribers }, { data: campaigns }] = await Promise.all([
    supabase
      .from("client_newsletter")
      .select("*")
      .eq("professional_id", proId)
      .eq("is_active", true)
      .order("subscribed_at", { ascending: false }),
    supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("professional_id", proId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    subscribers: (subscribers as NewsletterSubscriber[]) ?? [],
    campaigns: (campaigns as NewsletterCampaign[]) ?? [],
  };
}

export async function deleteSubscriber(
  subscriberId: string
): Promise<{ success: boolean; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("client_newsletter")
    .select("professional_id")
    .eq("id", subscriberId)
    .single();

  if (!sub || sub.professional_id !== proId) {
    return { success: false, error: "Abonné introuvable" };
  }

  const { error } = await supabase
    .from("client_newsletter")
    .delete()
    .eq("id", subscriberId);

  if (error) return { success: false, error: error.message };

  log("newsletter.subscriber.deleted", { subscriberId, proId });
  revalidatePath("/pro/newsletter");
  return { success: true };
}

export async function sendCampaign(
  subject: string,
  bodyHtml: string,
  attachments: NewsletterAttachment[] = []
): Promise<SendCampaignResult> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, email")
    .eq("id", proId)
    .single();

  if (!pro) return { success: false, error: "Professionnel introuvable" };

  const parsed = campaignSchema.safeParse({ subject, bodyHtml });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const { data: recentCampaign } = await supabase
    .from("newsletter_campaigns")
    .select("sent_at")
    .eq("professional_id", proId)
    .not("sent_at", "is", null)
    .gte("sent_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle();

  if (recentCampaign) {
    const nextAvailable = new Date(
      new Date(recentCampaign.sent_at!).getTime() + 24 * 60 * 60 * 1000
    ).toISOString();
    return { success: false, error: "Une campagne a déjà été envoyée aujourd'hui.", rateLimitedUntil: nextAvailable };
  }

  const { data: subscribers } = await supabase
    .from("client_newsletter")
    .select("email, unsubscribe_token")
    .eq("professional_id", proId)
    .eq("is_active", true);

  if (!subscribers || subscribers.length === 0) {
    return { success: false, error: "Aucun abonné actif. Partagez votre profil pour commencer." };
  }

  const sanitizedHtml = DOMPurify.sanitize(parsed.data.bodyHtml, {
    ALLOWED_TAGS: ALLOWED_HTML_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  const { data: campaign, error: insertErr } = await supabase
    .from("newsletter_campaigns")
    .insert({
      professional_id: proId,
      subject: parsed.data.subject,
      body_html: sanitizedHtml,
      status: "sending",
      recipient_count: 0,
      attachments_json: attachments.length > 0 ? JSON.stringify(attachments) : null,
    })
    .select("id")
    .single();

  if (insertErr || !campaign) {
    return { success: false, error: "Erreur lors de la création de la campagne." };
  }

  const { successCount } = await sendNewsletterBatch(subscribers, {
    businessName: pro.business_name,
    replyTo: pro.email,
    subject: parsed.data.subject,
    bodyHtml: sanitizedHtml,
    attachments,
  });

  const finalStatus = successCount > 0 ? "sent" : "failed";
  await supabase
    .from("newsletter_campaigns")
    .update({ status: finalStatus, sent_at: new Date().toISOString(), recipient_count: successCount })
    .eq("id", campaign.id);

  log("newsletter.campaign.sent", { campaignId: campaign.id, successCount, proId });
  revalidatePath("/pro/newsletter");

  if (successCount === 0) {
    return { success: false, error: "Aucun email n'a pu être envoyé. Réessayez." };
  }

  return { success: true, recipientCount: successCount };
}
