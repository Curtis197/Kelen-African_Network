"use client";

/**
 * Generates and downloads a PDF from the journal via API route.
 */
export async function exportJournalToPDF(
  projectId: string,
  isProProject: boolean = true
): Promise<void> {
  const printWindow = window.open(`/api/journal-pdf?projectId=${projectId}&isPro=${isProProject}`, '_blank');
  
  if (!printWindow) {
    throw new Error('Pop-up bloqué. Autorisez les pop-ups pour exporter le PDF.');
  }

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };
}

/**
 * Generates and downloads a PDF for a portfolio/realisation via API route.
 */
export async function exportRealisationToPDF(realisationId: string): Promise<void> {
  const printWindow = window.open(`/api/realisation-pdf?id=${realisationId}`, '_blank');
  
  if (!printWindow) {
    throw new Error('Pop-up bloqué. Autorisez les pop-ups pour exporter le PDF.');
  }

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };
}
