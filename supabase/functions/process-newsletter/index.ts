import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@6";

const BASE_URL = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://kelen.africa";
const CRON_SECRET = Deno.env.get("NEWSLETTER_CRON_SECRET");

function getClients() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
  return { supabase, resend };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueRow {
  queue_id: string;
  campaign_id: string;
  subscriber_id: string;
  subject: string;
  body_html: string;
  attachments_json: string | null;
  professional_id: string;
  business_name: string;
  pro_email: string;
  subscriber_email: string;
  unsubscribe_token: string;
  subscriber_name: string | null;
}

interface Attachment {
  name: string;
  url: string;
}

// ─── Email builders ───────────────────────────────────────────────────────────

function buildIndividualHtml(
  bodyHtml: string,
  unsubscribeUrl: string,
  businessName: string
): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#006c49;padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:20px;color:white;">${businessName}</h1>
      </div>
      <div style="padding:32px 24px;">${bodyHtml}</div>
      <div style="background:#f5f5f5;padding:16px 24px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
          Vous recevez cet email car vous vous êtes inscrit(e) à la newsletter de <strong>${businessName}</strong>.
          <br/>
          <a href="${unsubscribeUrl}" style="color:#006c49;text-decoration:underline;">Se désabonner</a>
          &nbsp;·&nbsp;
          <a href="${BASE_URL}" style="color:#006c49;text-decoration:none;">kelen.africa</a>
        </p>
      </div>
    </div>`;
}

function buildDigestHtml(
  campaigns: Array<{ businessName: string; subject: string; bodyHtml: string; unsubscribeUrl: string }>
): string {
  const sections = campaigns
    .map(
      (c) => `
      <div style="margin-bottom:40px;padding-bottom:40px;border-bottom:1px solid #e5e7eb;">
        <div style="border-left:4px solid #006c49;padding-left:14px;margin-bottom:16px;">
          <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">
            ${c.businessName}
          </p>
          <h2 style="margin:4px 0 0;font-size:18px;color:#1a1a1a;">${c.subject}</h2>
        </div>
        ${c.bodyHtml}
        <p style="margin-top:12px;font-size:12px;">
          <a href="${c.unsubscribeUrl}" style="color:#9ca3af;">Se désabonner de ${c.businessName}</a>
        </p>
      </div>`
    )
    .join("");

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#006c49;padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:20px;color:white;">Vos actualités professionnelles</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:13px;">kelen.africa</p>
      </div>
      <div style="padding:32px 24px;">${sections}</div>
      <div style="background:#f5f5f5;padding:16px 24px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
          Vous recevez cet email car vous êtes abonné(e) à des newsletters sur
          <a href="${BASE_URL}" style="color:#006c49;">kelen.africa</a>.
        </p>
      </div>
    </div>`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Auth: x-cron-secret header (set by pg_cron via app.newsletter_cron_secret)
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { supabase, resend } = getClients();

  // Claim a batch of pending queue items atomically
  const { data: rows, error: claimErr } = await supabase.rpc(
    "claim_newsletter_queue",
    { batch_size: 500 }
  );

  if (claimErr) {
    console.error("[newsletter] claim error:", claimErr.message);
    return new Response(JSON.stringify({ error: claimErr.message }), { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  // Group by subscriber email
  const byEmail = new Map<string, QueueRow[]>();
  for (const row of rows as QueueRow[]) {
    const existing = byEmail.get(row.subscriber_email) ?? [];
    existing.push(row);
    byEmail.set(row.subscriber_email, existing);
  }

  const sentIds: string[] = [];
  const failedIds: string[] = [];

  for (const [email, group] of byEmail) {
    try {
      if (group.length === 1) {
        // ── Individual branded email ──────────────────────────────────────
        const r = group[0];
        const unsubscribeUrl = `${BASE_URL}/newsletter/unsubscribe?token=${r.unsubscribe_token}`;
        const attachments: Attachment[] = r.attachments_json
          ? JSON.parse(r.attachments_json)
          : [];

        await resend.emails.send({
          from: `${r.business_name} <newsletter@kelen.africa>`,
          replyTo: r.pro_email,
          to: [email],
          subject: r.subject,
          html: buildIndividualHtml(r.body_html, unsubscribeUrl, r.business_name),
          attachments: attachments.map((a) => ({ filename: a.name, path: a.url })),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
      } else {
        // ── Digest: multiple pros → one email ─────────────────────────────
        const campaigns = group.map((r) => ({
          businessName: r.business_name,
          subject: r.subject,
          bodyHtml: r.body_html,
          unsubscribeUrl: `${BASE_URL}/newsletter/unsubscribe?token=${r.unsubscribe_token}`,
        }));

        const proNames = [...new Set(group.map((r) => r.business_name))];
        const subject =
          proNames.length <= 2
            ? `Actualités de ${proNames.join(" & ")}`
            : `${proNames.length} actualités de vos professionnels`;

        await resend.emails.send({
          from: `Kelen <newsletter@kelen.africa>`,
          to: [email],
          subject,
          html: buildDigestHtml(campaigns),
        });
      }

      sentIds.push(...group.map((r) => r.queue_id));
    } catch (err) {
      console.error(`[newsletter] send to ${email} failed:`, err);
      failedIds.push(...group.map((r) => r.queue_id));
    }
  }

  // Bulk update statuses
  const now = new Date().toISOString();

  if (sentIds.length > 0) {
    await supabase
      .from("newsletter_send_queue")
      .update({ status: "sent", sent_at: now })
      .in("id", sentIds);
  }

  if (failedIds.length > 0) {
    await supabase
      .from("newsletter_send_queue")
      .update({ status: "failed", error: "send_error" })
      .in("id", failedIds);
  }

  // Update campaign statuses based on their queue completion
  const campaignIds = [...new Set((rows as QueueRow[]).map((r) => r.campaign_id))];
  for (const campaignId of campaignIds) {
    const { data: remaining } = await supabase
      .from("newsletter_send_queue")
      .select("status")
      .eq("campaign_id", campaignId)
      .in("status", ["pending", "sending"]);

    if (!remaining || remaining.length === 0) {
      const { data: counts } = await supabase
        .from("newsletter_send_queue")
        .select("status")
        .eq("campaign_id", campaignId);

      const sentCount = counts?.filter((r) => r.status === "sent").length ?? 0;
      const allFailed = counts?.every((r) => r.status === "failed") ?? false;

      await supabase
        .from("newsletter_campaigns")
        .update({
          status: allFailed ? "failed" : "sent",
          sent_at: now,
          recipient_count: sentCount,
        })
        .eq("id", campaignId);
    }
  }

  console.log(`[newsletter] processed ${rows.length} items: ${sentIds.length} sent, ${failedIds.length} failed`);
  return new Response(
    JSON.stringify({ processed: rows.length, sent: sentIds.length, failed: failedIds.length }),
    { status: 200 }
  );
});
