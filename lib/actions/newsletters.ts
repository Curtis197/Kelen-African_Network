"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

export interface NewsletterContact {
  email: string;
  name: string;
}

export interface SentNewsletter {
  id: string;
  subject: string;
  body: string;
  recipient_count: number;
  sent_at: string;
}

/** Returns deduplicated client contacts for the authenticated pro. */
export async function getNewsletterContacts(): Promise<NewsletterContact[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!pro) return [];

  const { data: clients } = await supabase
    .from("pro_project_clients")
    .select("client_email, client_name")
    .eq("created_by_pro_id", pro.id)
    .not("client_email", "is", null);

  if (!clients) return [];

  // Deduplicate by email
  const seen = new Set<string>();
  return clients.reduce<NewsletterContact[]>((acc, c) => {
    if (c.client_email && !seen.has(c.client_email)) {
      seen.add(c.client_email);
      acc.push({ email: c.client_email, name: c.client_name || c.client_email });
    }
    return acc;
  }, []);
}

/** Returns past newsletters sent by the authenticated pro. */
export async function getSentNewsletters(): Promise<SentNewsletter[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!pro) return [];

  const { data } = await supabase
    .from("pro_newsletters")
    .select("id, subject, body, recipient_count, sent_at")
    .eq("pro_id", pro.id)
    .order("sent_at", { ascending: false })
    .limit(20);

  return data || [];
}

/** Sends a newsletter to all (or selected) contacts and records it. */
export async function sendNewsletter(
  subject: string,
  body: string,
  recipientEmails: string[]
): Promise<{ success: boolean; sent: number; error?: string }> {
  if (!subject.trim() || !body.trim()) {
    return { success: false, sent: 0, error: "Sujet et contenu requis." };
  }
  if (recipientEmails.length === 0) {
    return { success: false, sent: 0, error: "Aucun destinataire sélectionné." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, sent: 0, error: "Non authentifié." };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, slug")
    .eq("user_id", user.id)
    .single();
  if (!pro) return { success: false, sent: 0, error: "Profil introuvable." };

  const profileUrl = `${BASE_URL}/professionnels/${pro.slug}`;
  const senderName = pro.business_name || "Un professionnel Kelen";

  const htmlBody = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#006c49;padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:22px;color:#fff;">Message de ${senderName}</h1>
      </div>
      <div style="padding:32px 24px;">
        <div style="white-space:pre-wrap;line-height:1.7;font-size:15px;color:#333;">${body}</div>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
        <p style="font-size:13px;color:#999;margin:0;">
          Vous recevez cet email car vous avez collaboré avec
          <a href="${profileUrl}" style="color:#006c49;">${senderName}</a> via Kelen.
        </p>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999;">
        Propulsé par <a href="${BASE_URL}" style="color:#006c49;text-decoration:none;">Kelen</a>
      </div>
    </div>
  `;

  let sent = 0;

  if (!resend) {
    // Dev mode "” skip actual send, record as sent
    sent = recipientEmails.length;
  } else {
    // Send in batches of 50 (Resend batch limit)
    const chunks: string[][] = [];
    for (let i = 0; i < recipientEmails.length; i += 50) {
      chunks.push(recipientEmails.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      try {
        await resend.emails.send({
          from: `${senderName} via Kelen <newsletter@kelen.africa>`,
          to: chunk,
          subject,
          html: htmlBody,
          replyTo: user.email,
        });
        sent += chunk.length;
      } catch (err) {
      }
    }
  }

  // Record in DB
  await supabase.from("pro_newsletters").insert({
    pro_id: pro.id,
    subject,
    body,
    recipient_count: sent,
  });

  revalidatePath("/pro/newsletter");
  return { success: true, sent };
}
