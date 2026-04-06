import { FileText } from 'lucide-react';

interface LogEmptyStateProps {
  onCreateFirst?: () => void;
}

export default function LogEmptyState({ onCreateFirst }: LogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-on-surface-variant/60" />
      </div>
      <h3 className="text-lg font-semibold text-on-surface mb-2">
        Aucun rapport pour le moment
      </h3>
      <p className="text-sm text-on-surface-variant max-w-sm mb-6">
        Commencez à documenter l&apos;avancement de ce chantier pour garder une trace vérifiable de chaque étape.
      </p>
      {onCreateFirst && (
        <button
          onClick={onCreateFirst}
          className="px-6 py-3 bg-primary text-on-primary rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Créer le premier rapport
        </button>
      )}
    </div>
  );
}
