'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, MessageCircle, Eye } from 'lucide-react';
import { approveLog, contestLog, resolveLog } from '@/lib/actions/log-comments';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { LogStatus } from '@/lib/types/daily-logs';

interface LogActionsProps {
  logId: string;
  projectId: string;
  authorId: string;
  currentStatus: LogStatus;
  onStatusChange: () => void;
}

export default function LogActions({ logId, projectId, authorId, currentStatus, onStatusChange }: LogActionsProps) {
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showContestForm, setShowContestForm] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthor, setIsAuthor] = useState<boolean | null>(null);

  // Check if current user is the author
  useEffect(() => {
    const checkAuthorship = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthor(user?.id === authorId);
    };
    checkAuthorship();
  }, [authorId]);

  const handleApprove = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }

    setIsSubmitting(true);
    const result = await approveLog(logId, comment);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rapport approuvé');
      setComment('');
      setShowApproveForm(false);
      onStatusChange();
    }
  };

  const handleContest = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez expliquer la raison de la contestation');
      return;
    }

    setIsSubmitting(true);
    const result = await contestLog(logId, comment);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rapport contesté');
      setComment('');
      setShowContestForm(false);
      onStatusChange();
    }
  };

  const handleResolve = async () => {
    if (!comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }

    setIsSubmitting(true);
    const result = await resolveLog(logId, comment);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Contestation résolue');
      setComment('');
      onStatusChange();
    }
  };

  // If already approved or resolved, show minimal UI
  if (currentStatus === 'approved') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span>Rapport approuvé</span>
      </div>
    );
  }

  if (currentStatus === 'resolved') {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <CheckCircle className="w-4 h-4" />
        <span>Contestation résolue</span>
      </div>
    );
  }

  // Show loading state while checking authorship
  if (isAuthor === null) {
    return <div className="animate-pulse h-10 bg-surface-container rounded-xl" />;
  }

  // If current user is the author, show info message instead of approve/contest buttons
  if (isAuthor) {
    return (
      <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container rounded-xl px-5 py-4">
        <Eye className="w-4 h-4" />
        <span>Vous êtes l'auteur de ce rapport. Le client pourra l'approuver ou le contester.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => { setShowApproveForm(true); setShowContestForm(false); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          <CheckCircle className="w-4 h-4" />
          Approuver
        </button>
        <button
          type="button"
          onClick={() => { setShowContestForm(true); setShowApproveForm(false); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          <AlertTriangle className="w-4 h-4" />
          Contester
        </button>
      </div>

      {/* Comment form */}
      {(showApproveForm || showContestForm) && (
        <div className="bg-surface-container-low rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
            <MessageCircle className="w-4 h-4" />
            {showApproveForm ? "Commentaire d'approbation" : 'Raison de la contestation'}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={showApproveForm ? 'Ex: Travail conforme aux attentes...' : 'Ex: Les finitions ne sont pas conformes au devis...'}
            rows={3}
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
            aria-label="Commentaire"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={showApproveForm ? handleApprove : handleContest}
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors disabled:opacity-50 ${
                showApproveForm
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isSubmitting ? 'Envoi...' : showApproveForm ? 'Approuver' : 'Contester'}
            </button>
            <button
              type="button"
              onClick={() => { setShowApproveForm(false); setShowContestForm(false); setComment(''); }}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
