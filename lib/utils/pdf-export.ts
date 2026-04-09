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
 * Generates and downloads a PDF for a portfolio/realisation.
 */
export async function exportRealisationToPDF(
  title: string,
  description: string | null,
  photos: string[],
  completionDate: string | null
): Promise<void> {
  // Create a minimal printable HTML for the realisation
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Pop-up bloqué. Autorisez les pop-ups pour exporter le PDF.');
  }

  const photosHtml = photos
    .map((url) => `<img src="${url}" style="width: 100%; max-width: 400px; border-radius: 8px; margin: 8px 0;" />`)
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${title} — Kelen</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        :root {
          --kelen-green: #006c49;
          --kelen-green-light: #009639;
          --kelen-green-dark: #004D1C;
          --kelen-yellow: #FCCF00;
          --kelen-red: #CE1126;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #1A1A1A; line-height: 1.6; }
        .cover {
          background: linear-gradient(160deg, var(--kelen-green-dark) 0%, var(--kelen-green) 50%, var(--kelen-green-light) 100%);
          color: white; padding: 60px 40px; text-align: center;
        }
        .cover h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .cover p { opacity: 0.9; font-size: 1.1rem; }
        .content { padding: 40px; max-width: 800px; margin: 0 auto; }
        .content h2 { font-size: 1.8rem; margin-bottom: 1rem; color: var(--kelen-green); }
        .content p { margin-bottom: 1.5rem; color: #78716C; }
        .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 2rem; }
        .footer {
          margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #E7E5E4;
          text-align: center; color: #78716C; font-size: 0.85rem;
        }
        .footer strong { color: var(--kelen-green); }
        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4; margin: 20mm; }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>${title}</h1>
        <p>Réalisation Kelen${completionDate ? ` • Terminé le ${completionDate}` : ''}</p>
      </div>
      <div class="content">
        <h2>À propos de ce projet</h2>
        <p>${description || 'Aucune description fournie.'}</p>
        ${photosHtml ? `<div class="photos">${photosHtml}</div>` : ''}
        <div class="footer">
          <strong>KELEN</strong> — Réseau de professionnels de confiance<br />
          kelen.co
        </div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
