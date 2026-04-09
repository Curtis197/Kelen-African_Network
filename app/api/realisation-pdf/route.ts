import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const realisationId = searchParams.get("id");

  if (!realisationId) {
    return new NextResponse("Missing id parameter", { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the realisation (project_document)
  const { data: doc, error: docError } = await supabase
    .from("project_documents")
    .select("*")
    .eq("id", realisationId)
    .single();

  if (docError || !doc) {
    return new NextResponse("Réalisation non trouvée", { status: 404 });
  }

  // Fetch professional info
  const { data: professional } = await supabase
    .from("professionals")
    .select("display_name, category")
    .eq("id", doc.professional_id)
    .single();

  // Generate signed URLs for photos
  const photoUrls: string[] = [];
  if (doc.photo_urls && doc.photo_urls.length > 0) {
    for (const url of doc.photo_urls) {
      // Check if it's a Supabase storage path or already a full URL
      if (url.includes("supabase.co/storage")) {
        photoUrls.push(url);
      } else {
        // Try to get signed URL if it's a storage path
        const { data } = await supabase.storage
          .from("realisations")
          .createSignedUrl(url, 3600);
        if (data?.signedUrl) {
          photoUrls.push(data.signedUrl);
        } else {
          photoUrls.push(url); // Fallback to original
        }
      }
    }
  }

  // Format data
  const title = doc.project_title || "Réalisation";
  const description = doc.project_description || "Aucune description fournie.";
  const date = doc.project_date
    ? new Date(doc.project_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const location = doc.project_location || null;
  const budget = doc.project_amount
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: doc.project_currency || "XOF" }).format(doc.project_amount)
    : null;

  // Generate HTML
  const photosHtml = photoUrls
    .map((url) => `
      <div class="photo-card">
        <img src="${url}" alt="Photo de chantier" onerror="this.parentElement.style.display='none'" />
      </div>
    `)
    .join("");

  const html = `<!DOCTYPE html>
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
      --primary: #1A1A1A;
      --secondary: #78716C;
      --border: #E7E5E4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: var(--primary); line-height: 1.6; }
    .cover {
      background: linear-gradient(160deg, var(--kelen-green-dark) 0%, var(--kelen-green) 50%, var(--kelen-green-light) 100%);
      color: white; padding: 80px 40px; text-align: center; min-height: 60vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
    }
    .cover h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; letter-spacing: -0.02em; }
    .cover .subtitle { font-size: 1.3rem; opacity: 0.9; margin-bottom: 2rem; }
    .cover .meta { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem; }
    .cover .meta-item { background: rgba(255,255,255,0.15); padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.9rem; }
    .content { padding: 60px 40px; max-width: 900px; margin: 0 auto; }
    .content h2 { font-size: 2rem; margin-bottom: 1.5rem; color: var(--kelen-green); font-weight: 600; }
    .content .description { font-size: 1.1rem; color: var(--secondary); line-height: 1.8; margin-bottom: 3rem; white-space: pre-wrap; }
    .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; margin-top: 2rem; page-break-inside: avoid; }
    .photo-card { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: #f5f5f4; aspect-ratio: 16/10; }
    .photo-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .footer {
      margin-top: 4rem; padding: 2rem; border-top: 1px solid var(--border);
      text-align: center; color: var(--secondary); font-size: 0.9rem;
    }
    .footer strong { color: var(--kelen-green); font-size: 1.1rem; display: block; margin-bottom: 0.5rem; }
    .back {
      display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
      background: var(--primary); color: white; padding: 80px 40px; min-height: 50vh;
    }
    .back h2 { font-size: 2rem; margin-bottom: 1rem; font-weight: 600; line-height: 1.3; }
    .back p { max-width: 600px; margin-bottom: 1rem; opacity: 0.9; line-height: 1.6; font-size: 1.1rem; }
    .back .logo { margin-top: 2rem; font-size: 1.8rem; font-weight: 700; letter-spacing: 3px; }
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    @page { size: A4; margin: 15mm; }
  </style>
</head>
<body>
  <!-- COVER -->
  <div class="cover">
    <h1>${title}</h1>
    <p class="subtitle">${professional?.display_name || "Professionnel"} • ${professional?.category || "Expert"}</p>
    <div class="meta">
      ${date ? `<div class="meta-item">📅 ${date}</div>` : ""}
      ${location ? `<div class="meta-item">📍 ${location}</div>` : ""}
      ${budget ? `<div class="meta-item">💰 ${budget}</div>` : ""}
    </div>
  </div>

  <!-- CONTENT -->
  <div class="content">
    <h2>À propos de ce projet</h2>
    <p class="description">${description}</p>

    ${photosHtml ? `
    <div class="page-break">
      <h2>Documentation Photo</h2>
      <div class="photos">
        ${photosHtml}
      </div>
    </div>
    ` : ""}

    <div class="footer">
      <strong>KELEN</strong>
      Réseau de professionnels de confiance<br />
      kelen.co
    </div>
  </div>

  <!-- BACK COVER -->
  <div class="back page-break">
    <h2>Savoir-faire Documenté.<br />Confiance Vérifiée.</h2>
    <p>Cette réalisation fait partie du portfolio vérifié de ${professional?.display_name || "notre professionnel"}. Chaque projet est documenté avec des preuves photographiques et des informations transparentes.</p>
    <p style="margin-top: 2rem; font-size: 0.95rem; opacity: 0.8;">
      <strong>Conservez ce document pour vos archives.</strong><br />
      Il sert de référence pour la qualité du travail accompli.
    </p>
    <div class="logo">KELEN</div>
    <div style="margin-top: 0.5rem; opacity: 0.7; font-size: 0.9rem;">kelen.co • Réseau de professionnels de confiance</div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
