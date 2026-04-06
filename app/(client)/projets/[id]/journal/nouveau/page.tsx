'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LogForm from '@/components/journal/LogForm';

export default function NewLogPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface pt-12 pb-24">
      <div className="max-w-[800px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Retour au journal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
              Nouveau rapport
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Documenter l'avancement du chantier
            </p>
          </div>
        </div>

        {/* Form */}
        <LogForm projectId={projectId} projectCurrency="XOF" />
      </div>
    </main>
  );
}
