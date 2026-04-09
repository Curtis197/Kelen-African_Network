'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { verifyInvitation } from '@/lib/actions/pro-project-clients';
import { CheckCircle, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    if (user) setUserEmail(user.email || null);
    return !!user;
  }, []);

  const verifyToken = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await verifyInvitation(token);

    if (result.success && result.client) {
      setVerified(true);
      setClientName(result.client.client_name);
      setProjectName(result.projectName || null);

      // Check if user is already logged in
      const loggedIn = await checkAuth();

      // If logged in with matching email, auto-link
      if (loggedIn && userEmail === result.client.client_email) {
        router.push(`/projets/${result.client.pro_project_id}/journal`);
      }
    } else {
      setError(result.error || 'Invitation invalide');
    }

    setLoading(false);
  }, [token, checkAuth, userEmail, router]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 mx-auto mb-4 text-primary" />
          <p className="text-on-surface-variant">Vérification de l'invitation...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-low rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold text-on-surface">Invitation invalide</h1>
          <p className="text-on-surface-variant">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-low rounded-2xl p-8 space-y-6">
        {/* Success icon */}
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        </div>

        {/* Welcome message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">
            Bienvenue{clientName ? `, ${clientName}` : ''} !
          </h1>
          {projectName && (
            <p className="text-on-surface-variant">
              Votre invitation pour le projet <strong>{projectName}</strong> a été vérifiée.
            </p>
          )}
        </div>

        {/* Next steps */}
        <div className="bg-surface-container rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-on-surface">Prochaines étapes :</h2>

          {isLoggedIn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Connecté en tant que {userEmail}</span>
              </div>
              <Link
                href="/projets"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Mail className="w-5 h-5" />
                Voir mes projets
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Créez un compte ou connectez-vous pour accéder au journal de votre projet.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href={`/auth/signup?invite=${token}`}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Créer un compte
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/auth/login?invite=${token}`}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-surface-container-high text-on-surface rounded-xl font-semibold hover:bg-surface-container transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-center text-on-surface-variant">
          Une fois connecté, vous pourrez consulter les rapports d'avancement, les photos du chantier et échanger avec votre professionnel.
        </p>
      </div>
    </main>
  );
}
