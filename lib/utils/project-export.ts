import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ExportProjectData, ExportStepData, ExportLogData } from '@/lib/actions/export-data';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
  cancelled: 'Annulé',
  approved: 'Approuvé',
  contested: 'Contesté',
  resolved: 'Résolu',
};

function formatMoney(amount: number, currency: string): string {
  if (currency === 'XOF') return `${amount.toLocaleString('fr-FR')} ${currency}`;
  return `${amount.toFixed(2)} ${currency}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── PDF Export ─────────────────────────────────────────────

export function downloadProjectPdf(data: ExportProjectData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const accentColor: [number, number, number] = [0, 108, 73]; // Kelen green #006c49

  // ── Cover Page ──
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Kelen', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport de Projet', pageWidth / 2, 42, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 52, { align: 'center' });

  // Project info section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 20, 80);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const infoLines: string[] = [];
  if (data.category) infoLines.push(`Catégorie: ${data.category}`);
  if (data.location) infoLines.push(`Lieu: ${data.location}`);
  if (data.client_name) infoLines.push(`Client: ${data.client_name}`);
  infoLines.push(`Statut: ${STATUS_LABELS[data.status] || data.status}`);
  if (data.budget) infoLines.push(`Budget: ${formatMoney(data.budget, data.currency)}`);
  if (data.start_date) infoLines.push(`Début: ${formatDate(data.start_date)}`);

  infoLines.forEach((line, i) => {
    doc.text(line, 20, 92 + i * 7);
  });

  if (data.description) {
    const descY = 92 + infoLines.length * 7 + 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitDesc = doc.splitTextToSize(data.description, pageWidth - 40);
    doc.text(splitDesc, 20, descY);
  }

  // ── Steps Table ──
  const stepsStartY = data.description
    ? 92 + (data.description.length > 100 ? 6 : 3) + (data.description.length > 200 ? 3 : 0)
    : 110;

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, stepsStartY - 8, pageWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Roadmap de Réalisation', 20, stepsStartY - 1);

  autoTable(doc, {
    startY: stepsStartY + 4,
    head: [['Étape', 'Statut', 'Budget', 'Dépense', 'Experts']],
    body: data.steps.map(s => [
      s.title,
      STATUS_LABELS[s.status] || s.status,
      s.budget ? formatMoney(s.budget, data.currency) : '—',
      s.expenditure ? formatMoney(s.expenditure, data.currency) : '—',
      s.pros.length > 0 ? s.pros.join(', ') : '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: accentColor },
    styles: { fontSize: 9 },
  });

  // ── Journal Logs Table ──
  if (data.logs.length > 0) {
    const logsStartY = (doc as any).lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (logsStartY > 250) {
      doc.addPage();
      autoTable(doc, {
        startY: 20,
        head: [['Date', 'Titre', 'Auteur', 'Dépenses', 'Photos', 'Statut']],
        body: data.logs.map(l => [
          formatDate(l.log_date),
          l.title.length > 30 ? l.title.substring(0, 30) + '…' : l.title,
          l.author_role === 'professional' ? 'Pro' : 'Client',
          l.money_spent > 0 ? formatMoney(l.money_spent, l.money_currency) : '—',
          l.photo_count > 0 ? `${l.photo_count}` : '—',
          STATUS_LABELS[l.status] || l.status,
        ]),
        theme: 'striped',
        headStyles: { fillColor: accentColor },
        styles: { fontSize: 8 },
      });
    } else {
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, logsStartY - 8, pageWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Journal du Chantier', 20, logsStartY - 1);

      autoTable(doc, {
        startY: logsStartY + 4,
        head: [['Date', 'Titre', 'Auteur', 'Dépenses', 'Photos', 'Statut']],
        body: data.logs.map(l => [
          formatDate(l.log_date),
          l.title.length > 30 ? l.title.substring(0, 30) + '…' : l.title,
          l.author_role === 'professional' ? 'Pro' : 'Client',
          l.money_spent > 0 ? formatMoney(l.money_spent, l.money_currency) : '—',
          l.photo_count > 0 ? `${l.photo_count}` : '—',
          STATUS_LABELS[l.status] || l.status,
        ]),
        theme: 'striped',
        headStyles: { fillColor: accentColor },
        styles: { fontSize: 8 },
      });
    }
  }

  // ── Spending Summary ──
  const totalBudget = data.steps.reduce((sum, s) => sum + (s.budget || 0), 0);
  const totalSpent = data.logs.reduce((sum, l) => sum + (l.money_spent || 0), 0);

  const summaryY = (doc as any).lastAutoTable.finalY + 15;
  if (summaryY > 250) {
    doc.addPage();
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 12, pageWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé Financier', 20, 19);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Budget total alloué: ${totalBudget > 0 ? formatMoney(totalBudget, data.currency) : '—'}`, 20, 32);
    doc.text(`Dépenses totales: ${formatMoney(totalSpent, data.currency)}`, 20, 40);
    if (totalBudget > 0) {
      doc.text(`Restant: ${formatMoney(totalBudget - totalSpent, data.currency)}`, 20, 48);
    }
  } else {
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, summaryY - 8, pageWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé Financier', 20, summaryY - 1);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Budget total alloué: ${totalBudget > 0 ? formatMoney(totalBudget, data.currency) : '—'}`, 20, summaryY + 12);
    doc.text(`Dépenses totales: ${formatMoney(totalSpent, data.currency)}`, 20, summaryY + 20);
    if (totalBudget > 0) {
      doc.text(`Restant: ${formatMoney(totalBudget - totalSpent, data.currency)}`, 20, summaryY + 28);
    }
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Propulsé par Kelen — kelen.africa — Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  doc.save(`kelen-projet-${data.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

// ── Excel Export ───────────────────────────────────────────

export function downloadProjectExcel(data: ExportProjectData): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Project Overview ──
  const overviewData = [
    ['Projet', data.title],
    ['Catégorie', data.category || '—'],
    ['Lieu', data.location || '—'],
    ['Client', data.client_name || '—'],
    ['Statut', STATUS_LABELS[data.status] || data.status],
    ['Budget', data.budget ? `${data.budget} ${data.currency}` : '—'],
    ['Date de début', data.start_date ? formatDate(data.start_date) : '—'],
    ['Date de fin', data.end_date ? formatDate(data.end_date) : '—'],
    ['Description', data.description || '—'],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Résumé');

  // ── Sheet 2: Project Steps ──
  const stepsHeader = [['Étape', 'Statut', 'Budget', 'Dépense', 'Experts', 'Ordre']];
  const stepsRows = data.steps.map(s => [
    s.title,
    STATUS_LABELS[s.status] || s.status,
    s.budget || 0,
    s.expenditure || 0,
    s.pros.join(', ') || '—',
    s.order_index + 1,
  ]);
  const wsSteps = XLSX.utils.aoa_to_sheet([...stepsHeader, ...stepsRows]);
  wsSteps['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 35 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, wsSteps, 'Étapes');

  // ── Sheet 3: Journal Logs ──
  const logsHeader = [['Date', 'Titre', 'Description', 'Dépenses', 'Devise', 'Problèmes', 'Prochaines étapes', 'Auteur', 'Photos', 'Statut']];
  const logsRows = data.logs.map(l => [
    formatDate(l.log_date),
    l.title,
    l.description,
    l.money_spent || 0,
    l.money_currency,
    l.issues || '—',
    l.next_steps || '—',
    l.author_role === 'professional' ? 'Professionnel' : 'Client',
    l.photo_count,
    STATUS_LABELS[l.status] || l.status,
  ]);
  const wsLogs = XLSX.utils.aoa_to_sheet([...logsHeader, ...logsRows]);
  wsLogs['!cols'] = [
    { wch: 12 }, { wch: 30 }, { wch: 50 }, { wch: 15 },
    { wch: 8 }, { wch: 35 }, { wch: 35 }, { wch: 15 },
    { wch: 8 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Journal');

  // ── Sheet 4: Spending Summary ──
  const totalBudget = data.steps.reduce((sum, s) => sum + (s.budget || 0), 0);
  const totalSpent = data.logs.reduce((sum, l) => sum + (l.money_spent || 0), 0);

  const spendingData = [
    ['Résumé Financier', ''],
    ['Budget total alloué', totalBudget],
    ['Dépenses totales', totalSpent],
    ['Restant', totalBudget - totalSpent],
    ['Devise', data.currency],
    ['Nombre d\'étapes', data.steps.length],
    ['Nombre de rapports', data.logs.length],
    ['Total photos', data.logs.reduce((sum, l) => sum + l.photo_count, 0)],
  ];
  const wsSpending = XLSX.utils.aoa_to_sheet(spendingData);
  wsSpending['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSpending, 'Finances');

  // Download
  const fileName = `kelen-projet-${data.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
