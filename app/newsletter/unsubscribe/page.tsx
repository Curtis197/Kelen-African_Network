import Link from "next/link";
import { CheckCircle2, XCircle, Mail } from "lucide-react";
import { unsubscribeByToken } from "@/lib/actions/newsletter";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = { title: "Désinscription newsletter | Kelen", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ResultCard success={false} message="Lien de désinscription invalide." />;
  }

  const result = await unsubscribeByToken(token);

  if (!result.success) {
    return <ResultCard success={false} message={result.error ?? "Une erreur est survenue."} />;
  }

  return (
    <ResultCard
      success
      message={`Vous avez bien été désinscrit(e) de la newsletter${result.businessName ? ` de ${result.businessName}` : ""}. Vous ne recevrez plus d'emails de leur part.`}
    />
  );
}

function ResultCard({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-surface-container-low rounded-2xl border border-border p-10 text-center shadow-sm">
        <div className="mb-6">
          {success ? (
            <CheckCircle2 className="w-12 h-12 text-kelen-green-600 mx-auto" />
          ) : (
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          )}
        </div>
        <h1 className="text-xl font-bold font-headline text-on-surface mb-3">
          {success ? "Désinscription confirmée" : "Lien invalide"}
        </h1>
        <p className="text-on-surface-variant text-sm mb-8">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-kelen-green-600 hover:text-kelen-green-700 font-medium transition-colors"
        >
          <Mail className="w-4 h-4" />
          Retour à l&apos;accueil Kelen
        </Link>
      </div>
    </div>
  );
}
