import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getNewsletterContacts, getSentNewsletters } from "@/lib/actions/newsletters";
import { NewsletterComposer } from "@/components/pro/NewsletterComposer";

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envoyez des mises à jour à vos clients directement depuis votre dashboard.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface-container-low p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contacts</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{contacts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-container-low p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Envois</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{sentNewsletters.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-container-low p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total destinataires</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {sentNewsletters.reduce((sum, n) => sum + n.recipient_count, 0)}
          </p>
        </div>
      </div>

      {/* Composer + history */}
      <NewsletterComposer
        contacts={contacts}
        sentNewsletters={sentNewsletters}
        businessName={pro.business_name}
      />
    </div>
  );
}
