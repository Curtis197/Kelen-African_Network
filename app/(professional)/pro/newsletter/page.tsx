import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getNewsletterContacts, getSentNewsletters } from "@/lib/actions/newsletters";
import { NewsletterComposer } from "@/components/pro/NewsletterComposer";
import { Mail, Users, Send, BarChart2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Newsletter — Kelen Pro",
};

export default async function NewsletterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name")
    .eq("user_id", user.id)
    .single();

  if (!pro) redirect("/pro/profil");

  const [contacts, sentNewsletters] = await Promise.all([
    getNewsletterContacts(),
    getSentNewsletters(),
  ]);

  const totalRecipients = sentNewsletters.reduce((sum, n) => sum + n.recipient_count, 0);

  const stats = [
    {
      label: "Contacts",
      value: contacts.length,
      icon: <Users className="w-4 h-4" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Envois effectués",
      value: sentNewsletters.length,
      icon: <Send className="w-4 h-4" />,
      color: "bg-kelen-green-50 text-kelen-green-600",
    },
    {
      label: "Total destinataires",
      value: totalRecipients,
      icon: <BarChart2 className="w-4 h-4" />,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-kelen-green-50 text-kelen-green-600 flex-shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Newsletter</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Envoyez des mises à jour à vos clients directement depuis votre dashboard.
          </p>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-4"
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {s.label}
              </p>
              <p className="text-2xl font-black text-on-surface leading-none mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Composer + history ────────────────────────────── */}
      <NewsletterComposer
        contacts={contacts}
        sentNewsletters={sentNewsletters}
        businessName={pro.business_name}
      />
    </div>
  );
}
