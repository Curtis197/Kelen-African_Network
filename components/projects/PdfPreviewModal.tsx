"use client";

import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import type { ExportProjectData } from "@/lib/actions/export-data";
import { generateProjectPdfBlob } from "@/lib/utils/project-export";

interface PdfPreviewModalProps {
  data: ExportProjectData;
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfPreviewModal({ data, isOpen, onClose }: PdfPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Revoke previous URL to free memory
    if (blobUrl) URL.revokeObjectURL(blobUrl);

    const blob = generateProjectPdfBlob(data);
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `kelen-projet-${data.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-surface-container-low dark:bg-surface-container-low rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Aperçu du rapport PDF"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Aperçu du rapport PDF</h2>
            <p className="text-xs text-on-surface-variant">{data.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-surface-container transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {!blobUrl && !isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-on-surface-variant/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">Générer l'aperçu</h3>
              <p className="text-sm text-on-surface-variant mb-6 max-w-sm">
                Le rapport PDF sera généré avec les données actuelles du projet, les étapes et le journal.
              </p>
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Générer l'aperçu
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-sm text-on-surface-variant">Génération du rapport en cours...</p>
            </div>
          )}

          {blobUrl && (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title="Aperçu du rapport PDF"
            />
          )}
        </div>
      </div>
    </div>
  );
}
