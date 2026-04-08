import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin, Calendar, DollarSign, User, FileText, Coins, Image, CalendarDays } from "lucide-react";
import type { ProProject } from "@/lib/types/pro-projects";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getProjectJournalStats } from "@/lib/actions/journal-stats";

interface ProProjectDetailProps {
  project: ProProject;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: "En cours",
  completed: "Terminé",
  paused: "En pause",
  cancelled: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export async function ProProjectDetail({ project }: ProProjectDetailProps) {
  const journalStats = await getProjectJournalStats(project.id, true);

  const formatMoney = (amount: number, currency: string) => {
    if (currency === "XOF") return `${amount.toLocaleString('fr-FR')} ${currency}`;
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/pro/projets"
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Retour aux projets"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
              {project.is_public && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Portfolio
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/pro/projets/${project.id}/journal`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" />
            Journal
          </Link>
          <Link
            href={`/pro/projets/${project.id}/edit`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-surface-container text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors"
          >
            Modifier
          </Link>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-surface-container-low rounded-2xl p-6">
          <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-low rounded-2xl p-5">
          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            Lieu
          </span>
          <p className="text-sm font-semibold text-on-surface">
            {project.location || "—"}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-5">
          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Dates
          </span>
          <p className="text-sm font-semibold text-on-surface">
            {project.start_date ? format(new Date(project.start_date), "d MMM yyyy", { locale: fr }) : "—"}
            {project.end_date ? ` → ${format(new Date(project.end_date), "d MMM yyyy", { locale: fr })}` : ""}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-5">
          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Budget
          </span>
          <p className="text-sm font-semibold text-on-surface">
            {project.budget ? `${project.budget.toLocaleString('fr-FR')} ${project.currency}` : "—"}
          </p>
        </div>

        {project.client_name && (
          <div className="bg-surface-container-low rounded-2xl p-5">
            <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" />
              Client
            </span>
            <p className="text-sm font-semibold text-on-surface">{project.client_name}</p>
            {project.client_email && (
              <p className="text-xs text-on-surface-variant mt-1">{project.client_email}</p>
            )}
          </div>
        )}

        {project.actual_end_date && (
          <div className="bg-surface-container-low rounded-2xl p-5">
            <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Fin réelle
            </span>
            <p className="text-sm font-semibold text-on-surface">
              {format(new Date(project.actual_end_date), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        )}

        {project.completion_notes && (
          <div className="bg-surface-container-low rounded-2xl p-5 sm:col-span-2">
            <span className="text-xs font-medium text-on-surface-variant mb-2 block">
              Notes de fin
            </span>
            <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
              {project.completion_notes}
            </p>
          </div>
        )}
      </div>

      {/* Journal Stats */}
      <div className="bg-surface-container-low rounded-2xl p-6">
        <h3 className="text-base font-bold text-on-surface mb-4">Résumé du journal</h3>
        {journalStats.logCount > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">{journalStats.logCount}</p>
              <p className="text-xs text-on-surface-variant mt-1">Rapports</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-lg font-bold text-on-surface">{formatMoney(journalStats.totalSpent, journalStats.currency)}</p>
              <p className="text-xs text-on-surface-variant mt-1">Dépenses totales</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">{journalStats.photoCount}</p>
              <p className="text-xs text-on-surface-variant mt-1">Photos</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-on-surface">{journalStats.daysWorked}</p>
              <p className="text-xs text-on-surface-variant mt-1">Jours travaillés</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto text-on-surface-variant/40 mb-3" />
            <p className="text-sm text-on-surface-variant mb-2">Aucun rapport publié</p>
            <p className="text-xs text-on-surface-variant/60">
              Les statistiques apparaîtront après la création de rapports
            </p>
            <Link
              href={`/pro/projets/${project.id}/journal/nouveau`}
              className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              Créer le premier rapport
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
