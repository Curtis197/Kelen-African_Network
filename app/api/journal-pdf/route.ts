import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectLogs } from "@/lib/actions/daily-logs";
import { getLogComments } from "@/lib/actions/log-comments";
import { getMediaUrl } from "@/lib/actions/log-media";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const isProProject = searchParams.get("isPro") === "true";

  if (!projectId) {
    return new NextResponse("Missing projectId", { status: 400 });
  }

  const supabase = await createClient();

  // Fetch project info
  let projectData: any = null;
  let professionalData: any = null;

  if (isProProject) {
    const { data: proj } = await supabase
      .from("pro_projects")
      .select("*")
      .eq("id", projectId)
      .single();
    projectData = proj;

    if (proj?.professional_id) {
      const { data: prof } = await supabase
        .from("professionals")
        .select("display_name, category")
        .eq("id", proj.professional_id)
        .single();
      professionalData = prof;
    }
  }

  if (!projectData) {
    return new NextResponse("Project not found", { status: 404 });
  }

  // Fetch logs
  const logs = await getProjectLogs(projectId, isProProject);

  // Build logs with media URLs and comments
  const logsData = await Promise.all(
    logs.map(async (log) => {
      const mediaWithUrls = await Promise.all(
        (log.media || []).map(async (media) => {
          const signedUrl = await getMediaUrl(media.storage_path);
          return { ...media, signedUrl };
        })
      );

      const comments = await getLogComments(log.id);

      return {
        ...log,
        media: mediaWithUrls,
        comments,
      };
    })
  );

  // Calculate stats
  const totalEntries = logsData.length;
  const approvedCount = logsData.filter((l) => l.status === "approved" || l.status === "resolved").length;
  const contestedCount = logsData.filter((l) => l.status === "contested").length;
  const totalBudget = logsData.reduce((sum, log) => sum + Number(log.money_spent || 0), 0);

  // Format dates
  const sortedLogs = [...logsData].sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
  );
  const periodStart =
    sortedLogs.length > 0
      ? new Date(sortedLogs[0].log_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
      : "";
  const periodEnd =
    sortedLogs.length > 0
      ? new Date(sortedLogs[sortedLogs.length - 1].log_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
      : "";

  // Format currency
  const currency = projectData.currency || "XOF";
  const formatCurrency = (amount: number) => {
    if (currency === "XOF") return `${(amount / 1000).toFixed(0)}K XOF`;
    if (currency === "EUR") return `€${amount.toLocaleString("fr-FR")}`;
    if (currency === "USD") return `$${amount.toLocaleString("fr-FR")}`;
    return `${amount} ${currency}`;
  };

  // Build financial records
  const financialRecords = logsData
    .filter((log) => Number(log.money_spent) > 0)
    .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
    .map((log, idx, arr) => {
      const balance = arr.slice(0, idx + 1).reduce((s, l) => s + Number(l.money_spent), 0);
      return {
        date: new Date(log.log_date).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
        description: log.title,
        amount: formatCurrency(Number(log.money_spent)),
        balance: formatCurrency(balance),
        status: log.status === "approved" ? "paid" : log.status === "contested" ? "disputed" : "pending",
      };
    });

  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Journal de Projet - ${projectData.title || "Projet"} - Kelen</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --kelen-green: #006c49;
      --kelen-green-light: #009639;
      --kelen-green-dark: #004D1C;
      --kelen-yellow: #FCCF00;
      --kelen-red: #CE1126;
      --client-color: #006c49;
      --pro-color: #009639;
      --primary: #1A1A1A;
      --secondary: #78716C;
      --border: #E7E5E4;
      --bg-light: #F5F5F4;
      --page-width: 210mm;
      --page-height: 297mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #e5e5e5; color: var(--primary); line-height: 1.6; font-size: 10pt; }
    .page { width: var(--page-width); min-height: var(--page-height); margin: 0 auto 2rem; background: #fff; padding: 15mm; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; }
    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(160deg, var(--kelen-green-dark) 0%, var(--kelen-green) 50%, var(--kelen-green-light) 100%); color: white; padding: 20mm; }
    .cover-title { font-size: 3.2rem; font-weight: 700; margin-bottom: 0.4rem; line-height: 1.1; letter-spacing: -0.02em; }
    .cover-subtitle { font-size: 1.4rem; opacity: 0.9; margin-bottom: 3rem; font-weight: 400; letter-spacing: 0.5px; }
    .cover-info { background: #ffffff; padding: 1.5rem 2rem; border-radius: 8px; width: 100%; max-width: 460px; color: #1f2937; box-shadow: 0 10px 25px rgba(0,0,0,0.25); }
    .cover-info-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #e5e7eb; }
    .cover-info-row:last-child { border-bottom: none; }
    .cover-info-label { font-size: 0.85rem; color: #6b7280; }
    .cover-info-value { font-weight: 600; color: #111827; }
    .cover-footer { position: absolute; bottom: 15mm; text-align: center; width: 100%; color: rgba(255,255,255,0.7); font-size: 0.85rem; }
    .cover-footer strong { color: rgba(255,255,255,0.95); font-weight: 500; letter-spacing: 1px; }
    .summary-box { background: var(--bg-light); border: 1px solid var(--border); border-radius: 6px; padding: 1.5rem; margin-bottom: 2rem; page-break-inside: avoid; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1rem; }
    .stat-item { text-align: center; padding: 1rem; background: white; border-radius: 4px; border: 1px solid var(--border); }
    .stat-number { font-size: 1.8rem; font-weight: 700; color: var(--kelen-green); display: block; }
    .stat-label { font-size: 0.8rem; color: var(--secondary); margin-top: 0.25rem; }
    .journal-header { border-bottom: 2px solid var(--primary); padding-bottom: 0.8rem; margin-bottom: 1.5rem; }
    .journal-header h1 { font-size: 1.6rem; font-weight: 700; }
    .thread { display: flex; flex-direction: column; }
    .entry-wrapper { display: flex; padding: 1.2rem 0; border-bottom: 1px solid var(--border); page-break-inside: avoid; }
    .entry-wrapper:last-child { border-bottom: none; }
    .entry-wrapper.client { justify-content: flex-start; }
    .entry-wrapper.professional { justify-content: flex-end; }
    .entry-content { max-width: 78%; position: relative; }
    .entry-wrapper.client .entry-content { border-left: 3px solid var(--client-color); padding-left: 1rem; }
    .entry-wrapper.professional .entry-content { border-right: 3px solid var(--pro-color); padding-right: 1rem; }
    .entry-role { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem; }
    .client .entry-role { color: var(--client-color); }
    .professional .entry-role { color: var(--pro-color); text-align: right; }
    .entry-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.3rem; }
    .entry-text { color: var(--secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 0.5rem; }
    .entry-meta { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.8rem; }
    .professional .entry-meta { justify-content: flex-end; }
    .status-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; }
    .badge-read { background: #e8e8e7; color: #3c4a42; }
    .badge-approved { background: #D1FAE5; color: var(--kelen-green-dark); }
    .badge-contested { background: #FEE2E2; color: var(--kelen-red); }
    .badge-resolved { background: #D1FAE5; color: var(--kelen-green); }
    .action-items { margin-top: 0.5rem; font-size: 0.85rem; color: var(--secondary); }
    .action-items-title { font-weight: 600; margin-bottom: 0.2rem; font-size: 0.8rem; }
    .action-items ul { list-style: none; }
    .action-items li { padding: 0.15rem 0; padding-left: 0.8rem; position: relative; }
    .action-items li:before { content: "▸"; position: absolute; left: 0; color: var(--secondary); }
    .finance-section { margin-top: 2rem; page-break-inside: avoid; }
    .finance-header { font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .finance-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .finance-table th, .finance-table td { padding: 0.6rem; text-align: left; border-bottom: 1px solid var(--border); }
    .finance-table th { background: var(--bg-light); font-weight: 600; color: var(--secondary); font-size: 0.8rem; text-transform: uppercase; }
    .amount { font-weight: 600; text-align: right; }
    .balance { font-weight: 700; text-align: right; color: var(--kelen-green); }
    .status-paid { color: var(--kelen-green-dark); font-weight: 500; }
    .status-pending { color: var(--kelen-yellow); font-weight: 500; filter: brightness(0.7); }
    .status-disputed { color: var(--kelen-red); font-weight: 500; }
    .finance-summary { display: flex; justify-content: flex-end; gap: 2rem; margin-top: 1rem; padding: 0.8rem; background: var(--bg-light); border-radius: 4px; font-size: 0.9rem; }
    .finance-summary .total { font-weight: 700; }
    .photo-section { margin-top: 2rem; page-break-before: always; }
    .photo-header { font-size: 1.2rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; page-break-inside: avoid; }
    .photo-card { border: 1px solid var(--border); border-radius: 4px; overflow: hidden; background: white; }
    .photo-card img { width: 100%; height: 140px; object-fit: cover; display: block; }
    .photo-meta { padding: 0.75rem; }
    .photo-meta .title { font-weight: 600; margin-bottom: 0.4rem; font-size: 0.95rem; }
    .photo-meta .detail { font-size: 0.8rem; color: var(--secondary); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.4rem; }
    .photo-meta .detail span { font-weight: 500; }
    .signature-section { page-break-before: always; }
    .feedback-section { margin-bottom: 2.5rem; padding: 1.5rem; background: var(--bg-light); border: 1px solid var(--border); border-radius: 6px; page-break-inside: avoid; }
    .feedback-section h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1.2rem; color: var(--primary); }
    .feedback-row { margin-bottom: 1.2rem; }
    .feedback-q { display: block; font-size: 0.95rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--primary); }
    .feedback-options { display: flex; gap: 1.5rem; font-size: 0.9rem; color: var(--secondary); flex-wrap: wrap; }
    .checkbox { display: inline-flex; align-items: center; gap: 0.4rem; }
    .comment-lines { margin-top: 0.5rem; }
    .comment-line { border-bottom: 1px solid #d1d5db; height: 1.8rem; margin-bottom: 0.4rem; }
    .signature-header { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; text-align: center; }
    .signature-subtitle { text-align: center; color: var(--secondary); margin-bottom: 2.5rem; font-size: 0.95rem; max-width: 700px; margin-left: auto; margin-right: auto; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 1rem; page-break-inside: avoid; }
    .signature-block h4 { font-size: 1rem; font-weight: 600; margin-bottom: 1.2rem; color: var(--primary); border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; }
    .sig-field { margin-bottom: 1rem; }
    .sig-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem; }
    .sig-value { min-height: 1.4rem; border-bottom: 1px solid #9ca3af; }
    .sig-line { height: 2.5rem; border-bottom: 2px solid #374151; margin-top: 1.5rem; position: relative; }
    .sig-line::after { content: "Signature"; position: absolute; bottom: -1.1rem; left: 0; font-size: 0.7rem; color: #6b7280; }
    .sig-date { height: 1.2rem; border-bottom: 1px solid #d1d5db; margin-top: 1.2rem; }
    .sig-date-label { font-size: 0.7rem; color: #6b7280; margin-top: 0.1rem; }
    .disclaimer-box { margin-top: 3rem; padding: 1rem; background: var(--bg-light); border: 1px solid var(--border); border-radius: 4px; font-size: 0.8rem; color: var(--secondary); text-align: center; line-height: 1.5; page-break-inside: avoid; }
    .back { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: var(--primary); color: white; padding: 20mm; }
    .back h2 { font-size: 1.8rem; margin-bottom: 1rem; font-weight: 600; line-height: 1.3; }
    .back p { max-width: 500px; margin-bottom: 1rem; opacity: 0.9; line-height: 1.6; }
    .back-logo { margin-top: 2rem; font-size: 1.5rem; font-weight: 700; letter-spacing: 3px; }
    .back-link { margin-top: 0.5rem; opacity: 0.7; font-size: 0.9rem; }
    @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; page-break-after: always; } .page:last-child { page-break-after: auto; } .photo-section { page-break-before: always; } .signature-section { page-break-before: always; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  <!-- COVER PAGE -->
  <section class="page cover">
    <h1 class="cover-title">${professionalData?.display_name || "Professionnel"}</h1>
    <p class="cover-subtitle">${professionalData?.category || "Expert"}</p>
    <div class="cover-info">
      <div class="cover-info-row"><span class="cover-info-label">Client</span><span class="cover-info-value">${projectData.client_name || "Client"}</span></div>
      <div class="cover-info-row"><span class="cover-info-label">Projet</span><span class="cover-info-value">${projectData.title || "Projet"}</span></div>
      <div class="cover-info-row"><span class="cover-info-label">Lieu</span><span class="cover-info-value">${projectData.location || "—"}</span></div>
      <div class="cover-info-row"><span class="cover-info-label">Période</span><span class="cover-info-value">${periodStart}${periodEnd ? " - " + periodEnd : ""}</span></div>
      <div class="cover-info-row"><span class="cover-info-label">Document</span><span class="cover-info-value">Journal de Projet</span></div>
    </div>
    <div class="cover-footer"><strong>KELEN</strong><br>Réseau de professionnels de confiance • kelen.co</div>
  </section>

  <!-- SUMMARY & FINANCIAL PAGE -->
  <section class="page">
    <div class="journal-header"><h1>Résumé du Projet</h1></div>
    <div class="summary-box">
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-number">${totalEntries}</span><div class="stat-label">Rapports</div></div>
        <div class="stat-item"><span class="stat-number">${approvedCount}</span><div class="stat-label">Approuvés</div></div>
        <div class="stat-item"><span class="stat-number">${contestedCount}</span><div class="stat-label">Contestés</div></div>
        <div class="stat-item"><span class="stat-number">${formatCurrency(totalBudget)}</span><div class="stat-label">Budget Utilisé</div></div>
      </div>
    </div>
    ${financialRecords.length > 0 ? `
    <div class="finance-section">
      <div class="finance-header">💰 Suivi Financier</div>
      <table class="finance-table">
        <thead><tr><th>Date</th><th>Description</th><th class="amount">Montant</th><th class="amount">Solde</th><th>Statut</th></tr></thead>
        <tbody>
          ${financialRecords.map((r) => `
          <tr>
            <td>${r.date}</td>
            <td>${r.description}</td>
            <td class="amount">${r.amount}</td>
            <td class="balance">${r.balance}</td>
            <td class="status-${r.status}">${r.status === "paid" ? "Payé" : r.status === "pending" ? "En attente" : "Contesté"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <div class="finance-summary">
        <span>Total Contrat: <span class="total">${formatCurrency(projectData.budget || 0)}</span></span>
        <span>Restant: <span class="total" style="color: #009639;">${formatCurrency((projectData.budget || 0) - totalBudget)}</span></span>
      </div>
    </div>` : ""}
  </section>

  <!-- JOURNAL ENTRIES PAGE -->
  <section class="page">
    <div class="journal-header"><h1>Fil de Communication</h1></div>
    <div class="thread">
      ${logsData.map((log) => `
      <div class="entry-wrapper ${log.author_role}">
        <div class="entry-content">
          <div class="entry-role">${log.author_role === "professional" ? "Professionnel" : "Client"} • ${log.author_name || (log.author_role === "professional" ? professionalData?.display_name : projectData.client_name) || "—"}</div>
          <div class="entry-title">${log.title}</div>
          <div class="entry-text">${(log.description || "").substring(0, 300)}${(log.description || "").length > 300 ? "..." : ""}</div>
          <div class="entry-meta">
            <span>${new Date(log.log_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
            <span class="status-badge badge-${log.status === "approved" ? "approved" : log.status === "contested" ? "contested" : log.status === "resolved" ? "resolved" : "read"}">
              ${log.status === "approved" ? "✓ Approuvé" : log.status === "contested" ? "⚠ Contesté" : log.status === "resolved" ? "✓ Résolu" : "👁 Lu"}
            </span>
          </div>
          ${log.next_steps ? `
          <div class="action-items">
            <div class="action-items-title">Prochaines étapes:</div>
            <ul><li>${log.next_steps}</li></ul>
          </div>` : ""}
        </div>
      </div>`).join("")}
    </div>
  </section>

  <!-- PHOTO DOCUMENTATION PAGE -->
  ${logsData.some((l) => l.media && l.media.length > 0) ? `
  <section class="page photo-section">
    <div class="photo-header">📷 Documentation Photo</div>
    <div class="photo-grid">
      ${logsData
        .filter((l) => l.media && l.media.length > 0)
        .flatMap((l) =>
          l.media.map((m) => `
          <div class="photo-card">
            <img src="${m.signedUrl || ""}" alt="${m.file_name || "Photo"}" onerror="this.style.display='none'" />
            <div class="photo-meta">
              <div class="title">${m.caption || l.title}</div>
              ${l.gps_latitude && l.gps_longitude ? `<div class="detail">📍 ${l.gps_latitude.toFixed(4)}° N, ${l.gps_longitude.toFixed(4)}° E</div>` : ""}
              <div class="detail">🕒 ${m.exif_timestamp ? new Date(m.exif_timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : new Date(l.log_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
          </div>`).join("")
        )
        .join("")}
    </div>
  </section>` : ""}

  <!-- SIGNATURE & FEEDBACK PAGE -->
  <section class="page signature-section">
    <div class="feedback-section">
      <h3>Retour Client</h3>
      <div class="feedback-row">
        <span class="feedback-q">Ce projet est-il conforme à vos attentes ?</span>
        <div class="feedback-options">
          <span class="checkbox">☐ Oui</span>
          <span class="checkbox">☐ Partiellement</span>
          <span class="checkbox">☐ Non</span>
        </div>
      </div>
      <div class="feedback-row">
        <span class="feedback-q">Recommanderiez-vous ce professionnel ?</span>
        <div class="feedback-options">
          <span class="checkbox">☐ Oui</span>
          <span class="checkbox">☐ Non</span>
          <span class="checkbox">☐ Pas encore décidé</span>
        </div>
      </div>
      <div class="feedback-row">
        <span class="feedback-q">Commentaires supplémentaires (optionnel):</span>
        <div class="comment-lines">
          <div class="comment-line"></div>
          <div class="comment-line"></div>
          <div class="comment-line"></div>
          <div class="comment-line"></div>
        </div>
      </div>
    </div>

    <h2 class="signature-header">Accord & Signatures</h2>
    <p class="signature-subtitle">En signant ci-dessous, les deux parties confirment que ce journal reflète fidèlement les communications, décisions et livrables du projet.</p>

    <div class="signature-grid">
      <div class="signature-block">
        <h4>Client</h4>
        <div class="sig-field"><div class="sig-label">Nom</div><div class="sig-value">${projectData.client_name || "Client"}</div></div>
        <div class="sig-field"><div class="sig-label">Titre</div><div class="sig-value">Propriétaire</div></div>
        <div class="sig-line"></div>
        <div class="sig-date"></div>
        <div class="sig-date-label">Date</div>
      </div>
      <div class="signature-block">
        <h4>Professionnel</h4>
        <div class="sig-field"><div class="sig-label">Nom</div><div class="sig-value">${professionalData?.display_name || "Professionnel"}</div></div>
        <div class="sig-field"><div class="sig-label">Titre</div><div class="sig-value">${professionalData?.category || "Expert"}</div></div>
        <div class="sig-line"></div>
        <div class="sig-date"></div>
        <div class="sig-date-label">Date</div>
      </div>
    </div>

    <div class="disclaimer-box">
      <strong>Avertissement:</strong> Ce document sert de registre de projet et de reconnaissance mutuelle du travail accompli. Il ne constitue pas un amendement contractuel légal sauf si explicitement référencé et signé par les deux parties autorisées.
    </div>
  </section>

  <!-- BACK COVER -->
  <section class="page back">
    <h2>Communication Transparente.<br>Progrès Documenté.</h2>
    <p>Ce journal capture chaque moment important de votre projet. Du suivi budgétaire aux preuves photo en passant par les décisions, tout est documenté pour vos archives mutuelles.</p>
    <p style="margin-top: 2rem; font-size: 0.95rem; opacity: 0.8;">
      <strong>Conservez ce document pour vos archives.</strong><br>
      Il sert de preuve du travail accompli et des accords conclus.
    </p>
    <div class="back-logo">KELEN</div>
    <div class="back-link">kelen.co • Réseau de professionnels de confiance</div>
  </section>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
