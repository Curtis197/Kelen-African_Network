import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getNewsletterData } from "@/lib/actions/newsletter";
import { NewsletterDashboard } from "@/components/newsletter/NewsletterDashboard";

export const metadata = { title: "Newsletter | Kelen Pro" };

export default async function NewsletterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/pro/connexion");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name")
    .eq("user_id", user.id)
    .single();

  if (!pro) return redirect("/pro/dashboard");

  const { subscribers, campaigns } = await getNewsletterData(pro.id);

  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold font-headline text-on-surface mb-2">Newsletter</h1>
          <p className="text-on-surface-variant">
            Gérez vos abonnés et envoyez des campagnes email à vos clients.
          </p>
        </div>

        <NewsletterDashboard subscribers={subscribers} campaigns={campaigns} professionalId={pro.id} />
      </div>
    </main>
  );
}
