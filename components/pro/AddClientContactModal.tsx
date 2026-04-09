'use client';

import { useState } from 'react';
import { X, Mail, Send, CheckCircle } from 'lucide-react';
import { createClientContact } from '@/lib/actions/pro-project-clients';
import { toast } from 'sonner';

interface AddClientContactModalProps {
  proProjectId: string;
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export default function AddClientContactModal({ 
  proProjectId, 
  isOpen, 
  onClose, 
  onClientAdded 
}: AddClientContactModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [sendInvitation, setSendInvitation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await createClientContact({
      proProjectId,
      clientName,
      clientEmail,
      clientPhone: clientPhone || undefined,
      sendInvitation,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      setSuccess(true);
      toast.success('Contact client ajouté');
      
      if (sendInvitation) {
        toast.success(`Invitation envoyée à ${clientEmail}`);
      }

      setTimeout(() => {
        onClientAdded();
        onClose();
        setSuccess(false);
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setSendInvitation(true);
      }, 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un contact client"
    >
      <div
        className="bg-background dark:bg-surface-container-low rounded-[2rem] p-6 sm:p-8 w-full max-w-md space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Ajouter un contact client</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <p className="text-on-surface font-medium">Contact ajouté avec succès !</p>
            {sendInvitation && (
              <p className="text-sm text-on-surface-variant">
                L'invitation a été envoyée à {clientEmail}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client name */}
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-on-surface mb-2">
                Nom du client *
              </label>
              <input
                id="client-name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Jean Dupont"
                required
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="client-email" className="block text-sm font-medium text-on-surface mb-2">
                Email *
              </label>
              <input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@exemple.com"
                required
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="client-phone" className="block text-sm font-medium text-on-surface mb-2">
                Téléphone (optionnel)
              </label>
              <input
                id="client-phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+221 77 000 00 01"
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Send invitation checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvitation}
                onChange={(e) => setSendInvitation(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <div className="text-sm">
                <div className="font-medium text-on-surface flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Envoyer une invitation par email
                </div>
                <p className="text-on-surface-variant mt-1">
                  Le client recevra un lien pour créer son compte et accéder au journal
                </p>
              </div>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !clientName || !clientEmail}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold disabled:opacity-50 transition-opacity"
            >
              <Send className="w-4 h-4" />
              {sendInvitation ? 'Ajouter et inviter' : 'Ajouter le contact'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
