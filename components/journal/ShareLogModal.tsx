'use client';

import { useState, useEffect } from 'react';
import { X, Mail, MessageCircle, Smartphone, Copy, Check, User } from 'lucide-react';
import { shareLog } from '@/lib/actions/log-shares';
import { toast } from 'sonner';

interface ShareLogModalProps {
  logId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultPhone?: string;
  recipientLabel?: string;
}

export default function ShareLogModal({ logId, isOpen, onClose, defaultEmail, defaultPhone, recipientLabel }: ShareLogModalProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Update when defaults change
  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
    if (defaultPhone) setPhone(defaultPhone);
  }, [defaultEmail, defaultPhone, isOpen]);

  if (!isOpen) return null;

  const handleShare = async (method: 'email' | 'whatsapp' | 'sms') => {
    setIsSubmitting(true);

    const result = await shareLog(logId, {
      method,
      recipientEmail: email || undefined,
      recipientPhone: phone || undefined,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setShareUrl(result.shareUrl);

    // Open WhatsApp or SMS if applicable
    if (method === 'whatsapp' && phone) {
      const message = encodeURIComponent(
        `Nouveau rapport de chantier. Voir le rapport:\n${result.shareUrl}`
      );
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    } else if (method === 'sms' && phone) {
      const message = encodeURIComponent(
        `Nouveau rapport de chantier: ${result.shareUrl}`
      );
      window.open(`sms:${phone}?body=${message}`, '_blank');
    }

    toast.success('Lien de partage créé');
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Lien copié');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Partager le rapport"
    >
      <div
        className="bg-background rounded-[2rem] p-6 sm:p-8 w-full max-w-md space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Partager ce rapport</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Recipient label */}
        {recipientLabel && (
          <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 rounded-xl">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-on-surface">{recipientLabel}</span>
          </div>
        )}

        {/* Share methods */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleShare('email')}
            disabled={isSubmitting}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <Mail className="w-6 h-6 text-on-surface-variant" />
            <span className="text-xs font-medium text-on-surface">Email</span>
          </button>
          <button
            type="button"
            onClick={() => handleShare('whatsapp')}
            disabled={isSubmitting}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-6 h-6 text-green-500" />
            <span className="text-xs font-medium text-on-surface">WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => handleShare('sms')}
            disabled={isSubmitting}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <Smartphone className="w-6 h-6 text-on-surface-variant" />
            <span className="text-xs font-medium text-on-surface">SMS</span>
          </button>
        </div>

        {/* Recipient inputs */}
        <div className="space-y-3">
          <div>
            <label htmlFor="share-email" className="sr-only">Email du destinataire</label>
            <input
              id="share-email"
              type="email"
              placeholder="email@exemple.com (optionnel)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
            />
          </div>
          <div>
            <label htmlFor="share-phone" className="sr-only">Téléphone du destinataire</label>
            <input
              id="share-phone"
              type="tel"
              placeholder="+221 77 000 00 01 (optionnel)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>

        {/* Share URL */}
        {shareUrl && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-on-surface-variant">Lien de partage :</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-xl">
              <code className="flex-1 text-xs text-on-surface-variant truncate" title={shareUrl}>
                {shareUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                aria-label="Copier le lien"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
