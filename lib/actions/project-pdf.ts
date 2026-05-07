"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateProjectPdf(projectId: string): Promise<{ success: boolean; html?: string; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("user_projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    return { success: false, error: "Projet non trouvé" };
  }


  // Fetch user
  const { data: userData } = await supabase
    .from("users")
    .select("display_name, country")
    .eq("id", user.id)
    .single();

  // Fetch steps
  const { data: steps } = await supabase
    .from("project_steps")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  // Fetch team professionals
  const { data: teamData } = await supabase
    .from("project_professionals")
    .select(`
      *,
      professionals(business_name, category, profile_picture_url, slug)
    `)
    .eq("project_id", projectId)
    .order("rank_order", { ascending: true });

  // Fetch project images
  const { data: images } = await supabase
    .from("user_project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });


  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { EUR: 'â‚¬', XOF: 'CFA', USD: '$' };
    const symbol = symbols[currency] || currency;
    return `${amount.toLocaleString()} ${symbol}`;
  };

  // Get step status label
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return '<span class="timeline-status status-complete">âœ" Terminé</span>';
      case 'in_progress': return '<span class="timeline-status status-progress">âŸ³ En cours</span>';
      case 'pending': return '<span class="timeline-status status-pending">â³ À venir</span>';
      default: return `<span class="timeline-status status-pending">${status}</span>`;
    }
  };

  // Build HTML from template
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title} - Kelen</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --primary: #111827; --secondary: #4b5563; --muted: #6b7280; --accent: #3b82f6; --bg-light: #f9fafb; --border: #e5e7eb; --page-width: 210mm; --page-height: 297mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #e5e5e5; color: var(--primary); line-height: 1.5; font-size: 10pt; }
    .page { width: var(--page-width); min-height: var(--page-height); margin: 0 auto 2rem; background: #fff; padding: 15mm; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; }
    .page-header { font-size: 1.6rem; font-weight: 700; margin-bottom: 1.5rem; padding-bottom: 0.8rem; border-bottom: 2px solid var(--primary); }
    .page-header span { display: block; font-size: 0.8rem; font-weight: 400; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 0.2rem; }
    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0; }
    .cover-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('${images?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&w=1600&q=80'}') center/cover no-repeat; }
    .cover-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%); }
    .cover-content { position: relative; z-index: 2; margin-top: -2rem; }
    .project-title { font-size: 2.8rem; font-weight: 700; color: #ffffff; margin-bottom: 2rem; letter-spacing: -0.02em; line-height: 1.1; }
    .client-card { background: #ffffff; padding: 1.2rem 1.8rem; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); display: inline-block; text-align: left; min-width: 260px; }
    .client-card .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 0.3rem; }
    .client-card .name { font-size: 1.5rem; font-weight: 600; color: var(--primary); margin-bottom: 0.2rem; }
    .client-card .location { font-size: 0.95rem; color: var(--secondary); }
    .cover-footer { position: absolute; bottom: 15mm; left: 0; right: 0; text-align: center; z-index: 2; color: rgba(255,255,255,0.85); font-size: 0.85rem; }
    .cover-footer .brand { display: block; font-size: 1.1rem; font-weight: 600; letter-spacing: 2px; margin-bottom: 0.2rem; color: #ffffff; }
    .details-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2.5rem; }
    .info-block { margin-bottom: 2rem; }
    .info-block h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.6rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; }
    .info-block p { color: var(--secondary); line-height: 1.7; font-size: 0.95rem; }
    .budget-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; background: var(--bg-light); border-radius: 6px; overflow: hidden; border: 1px solid var(--border); }
    .budget-table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid var(--border); }
    .budget-table tr:last-child td { border-bottom: none; }
    .budget-label { color: var(--secondary); }
    .budget-value { font-weight: 600; text-align: right; }
    .timeline { position: relative; padding-left: 1.5rem; margin-top: 0.5rem; }
    .timeline::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--border); }
    .timeline-item { position: relative; padding-bottom: 1.8rem; page-break-inside: avoid; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-item::before { content: ''; position: absolute; left: -1.85rem; top: 0.35rem; width: 10px; height: 10px; background: var(--accent); border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 2px var(--border); }
    .timeline-date { font-size: 0.8rem; color: var(--muted); font-weight: 500; margin-bottom: 0.2rem; }
    .timeline-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.3rem; }
    .timeline-desc { font-size: 0.9rem; color: var(--secondary); line-height: 1.5; margin-bottom: 0.4rem; }
    .timeline-status { display: inline-block; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 600; }
    .status-complete { background: #d1fae5; color: #059669; }
    .status-progress { background: #dbeafe; color: #2563eb; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .gallery-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 0.8rem; }
    .gallery-item { position: relative; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gallery-caption { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.75)); color: #ffffff; padding: 1.2rem 0.6rem 0.5rem; font-size: 0.85rem; font-weight: 500; }
    .pros-intro { color: var(--secondary); margin-bottom: 2rem; font-size: 0.95rem; max-width: 85%; line-height: 1.6; }
    .pros-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.2rem; }
    .pro-card { display: flex; flex-direction: column; background: var(--bg-light); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; position: relative; page-break-inside: avoid; }
    .pro-image { height: 120px; background: #d1d5db; overflow: hidden; }
    .pro-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .pro-details { padding: 1rem; flex: 1; display: flex; flex-direction: column; }
    .pro-name { font-weight: 600; font-size: 1rem; margin-bottom: 0.2rem; }
    .pro-role { font-size: 0.85rem; color: var(--accent); font-weight: 500; margin-bottom: 0.3rem; }
    .pro-company { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.8rem; flex: 1; }
    .pro-link { display: inline-flex; align-items: center; font-size: 0.8rem; color: var(--primary); text-decoration: none; font-weight: 600; padding-top: 0.4rem; border-top: 1px solid var(--border); margin-top: auto; }
    .pro-link::after { content: "←’"; margin-left: 0.3rem; }
    .back-cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 20mm; }
    .back-content .brand-large { font-size: 2rem; font-weight: 700; letter-spacing: 3px; margin-bottom: 1.5rem; }
    .back-message { font-size: 1.8rem; font-weight: 600; margin-bottom: 0.8rem; line-height: 1.3; }
    .back-sub { font-size: 1rem; opacity: 0.85; max-width: 450px; margin: 0 auto 2.5rem; line-height: 1.5; }
    @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; page-break-after: always; } .page:last-child { page-break-after: auto; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  <section class="page cover">
    <div class="cover-bg"></div>
    <div class="cover-overlay"></div>
    <div class="cover-content">
      <h1 class="project-title">${project.title}</h1>
      <div class="client-card">
        <div class="label">Client</div>
        <div class="name">${userData?.display_name || 'Client Kelen'}</div>
        <div class="location">${project.location_formatted || project.location || 'N/A'}</div>
      </div>
    </div>
    <div class="cover-footer"><span class="brand">KELEN</span><span>Documentation Projet</span></div>
  </section>

  <section class="page">
    <div class="page-header">Vue d'ensemble <span>Description & Budget</span></div>
    <div class="details-grid">
      <div>
        <div class="info-block">
          <h3>ðŸ"‹ Description du projet</h3>
          <p>${project.description || 'Aucune description fournie.'}</p>
        </div>
        <div class="info-block">
          <h3>ðŸ" Localisation & Portée</h3>
          <p>${project.location_formatted || project.location || 'N/A'}</p>
        </div>
      </div>
      <div>
        <div class="info-block">
          <h3>ðŸ’° Résumé budgétaire</h3>
          <table class="budget-table">
            <tr><td class="budget-label">Budget total</td><td class="budget-value">${formatCurrency(project.budget_total || 0, project.budget_currency || 'EUR')}</td></tr>
            <tr><td class="budget-label">Catégorie</td><td class="budget-value">${project.category || 'Non défini'}</td></tr>
            <tr><td class="budget-label">Date de début</td><td class="budget-value">${project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : 'N/A'}</td></tr>
            <tr><td class="budget-label">Date de fin</td><td class="budget-value">${project.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR') : 'N/A'}</td></tr>
          </table>
        </div>
      </div>
    </div>
  </section>

  ${steps && steps.length > 0 ? `
  <section class="page">
    <div class="page-header">Calendrier du projet <span>Étapes & Progrès</span></div>
    <div class="timeline">
      ${steps.map((step: any) => `
      <div class="timeline-item">
        <div class="timeline-date">${step.start_date ? new Date(step.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date non définie'}</div>
        <div class="timeline-title">${step.name}</div>
        <div class="timeline-desc">${step.description || ''}</div>
        ${getStatusBadge(step.status || 'pending')}
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  ${images && images.length > 0 ? `
  <section class="page">
    <div class="page-header">Galerie du projet <span>Progrès & Livrables</span></div>
    <div class="gallery-grid">
      ${images.slice(0, 6).map((img: any, i: number) => `
      <div class="gallery-item">
        <img src="${img.url}" alt="Image projet ${i + 1}">
        <div class="gallery-caption">${img.is_main ? 'Image principale' : `Image ${i + 1}`}</div>
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  ${teamData && teamData.length > 0 ? `
  <section class="page">
    <div class="page-header">Professionnels impliqués <span>Équipe projet</span></div>
    <p class="pros-intro">Tous les professionnels vérifiés connectés via la plateforme Kelen.</p>
    <div class="pros-grid">
      ${teamData.map((tp: any) => `
      <div class="pro-card">
        <div class="pro-image">
          <img src="${tp.professionals?.profile_picture_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}" alt="${tp.professionals?.business_name || 'Pro'}">
        </div>
        <div class="pro-details">
          <div class="pro-name">${tp.professionals?.business_name || 'Professionnel'}</div>
          <div class="pro-role">${tp.professionals?.category || 'N/A'}</div>
          <div class="pro-company">Vérifié Kelen</div>
          <a href="https://kelen.africa/professionnels/${tp.professionals?.slug || ''}" class="pro-link">Voir le profil</a>
        </div>
      </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <section class="page back-cover">
    <div class="back-content">
      <div class="brand-large">KELEN</div>
      <h2 class="back-message">Ce projet a été réalisé sur la plateforme Kelen.</h2>
      <p class="back-sub">Connecter les clients avec des professionnels vérifiés pour donner vie à vos projets. Transparent, documenté et livré.</p>
    </div>
  </section>
</body>
</html>`;

  return { success: true, html };
}
