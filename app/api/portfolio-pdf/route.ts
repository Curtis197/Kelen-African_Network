// app/api/portfolio-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const professionalId = searchParams.get("professional_id");

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Non authentifié", { status: 401 });

  if (id) {
    return singleRealizationPdf(supabase, id);
  }
  if (professionalId) {
    return fullPortfolioPdf(supabase, professionalId, user.id);
  }

  return new NextResponse("Paramètre manquant: id ou professional_id requis", { status: 400 });
}

// ── Single realization ────────────────────────────────────────────────────────

async function singleRealizationPdf(supabase: any, id: string) {
  const { data: r } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*),
      documents:realization_documents(id, name, url)
    `)
    .eq("id", id)
    .single();

  if (!r) return new NextResponse("Réalisation introuvable", { status: 404 });

  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, category, city, country")
    .eq("id", r.professional_id)
    .single();

  const images: Array<{ url: string; is_main: boolean }> = r.images ?? [];
  const mainImage = images.find((i) => i.is_main)?.url ?? images[0]?.url ?? null;
  const gallery = images.filter((i) => i.url !== mainImage);

  const date = r.completion_date
    ? new Date(r.completion_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : r.year ? String(r.year) : null;

  const price = r.price
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: r.currency || "XOF", maximumFractionDigits: 0 }).format(r.price)
    : null;

  const html = buildHtml(
    `${r.title} — ${pro?.business_name ?? "Portfolio"}`,
    renderSingleRealization({ r, pro, mainImage, gallery, date, price }),
  );

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ── Full portfolio ────────────────────────────────────────────────────────────

async function fullPortfolioPdf(supabase: any, professionalId: string, userId: string) {
  // Ownership check
  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, owner_name, category, city, country, description")
    .eq("id", professionalId)
    .eq("user_id", userId)
    .single();

  if (!pro) return new NextResponse("Accès refusé", { status: 403 });

  const { data: rows } = await supabase
    .from("professional_realizations")
    .select(`*, images:realization_images(*)`)
    .eq("professional_id", professionalId)
    .order("is_featured", { ascending: false })
    .order("completion_date", { ascending: false });

  const realizations = rows ?? [];
  const proName = pro.business_name ?? pro.owner_name;
  const location = [pro.city, pro.country].filter(Boolean).join(", ");
  const coverImage = realizations.flatMap((r: any) => r.images ?? []).find((i: any) => i.is_main)?.url
    ?? realizations.flatMap((r: any) => r.images ?? [])[0]?.url ?? null;

  const sections = realizations.map((r: any) => {
    const images: Array<{ url: string; is_main: boolean }> = r.images ?? [];
    const mainImage = images.find((i) => i.is_main)?.url ?? images[0]?.url ?? null;
    const gallery = images.filter((i) => i.url !== mainImage).slice(0, 5);
    const date = r.completion_date
      ? new Date(r.completion_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : r.year ? String(r.year) : null;
    const price = r.price
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: r.currency || "XOF", maximumFractionDigits: 0 }).format(r.price)
      : null;
    return renderPortfolioSection({ r, mainImage, gallery, date, price });
  }).join("");

  const body = `
    <!-- Cover -->
    <div class="cover">
      ${coverImage ? `<img class="cover-img" src="${coverImage}" alt="cover" />` : ""}
      <div class="cover-overlay"></div>
      <div class="cover-content">
        <p class="cover-eyebrow">${escHtml(pro.category ?? "Portfolio")}</p>
        <h1 class="cover-title">${escHtml(proName)}</h1>
        ${location ? `<p class="cover-location">📍 ${escHtml(location)}</p>` : ""}
        <div class="cover-badge">${realizations.length} réalisation${realizations.length !== 1 ? "s" : ""}</div>
      </div>
      <div class="cover-footer"><span class="brand">KELEN</span> · Portfolio professionnel</div>
    </div>

    ${pro.description ? `
    <div class="page">
      <div class="section-header">À propos</div>
      <p class="about-text">${escHtml(pro.description)}</p>
    </div>` : ""}

    ${sections}

    <!-- Back cover -->
    <div class="back-cover">
      <div class="brand-lg">KELEN</div>
      <h2 class="back-title">Portfolio vérifié</h2>
      <p class="back-sub">Ce portfolio a été généré depuis la plateforme Kelen, réseau de professionnels de confiance en Afrique.</p>
    </div>
  `;

  const html = buildHtml(`Portfolio — ${proName}`, body);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function renderSingleRealization({ r, pro, mainImage, gallery, date, price }: any) {
  return `
    <!-- Cover -->
    <div class="cover">
      ${mainImage ? `<img class="cover-img" src="${mainImage}" alt="${escHtml(r.title)}" />` : ""}
      <div class="cover-overlay"></div>
      <div class="cover-content">
        ${r.category ? `<p class="cover-eyebrow">${escHtml(r.category)}</p>` : ""}
        <h1 class="cover-title">${escHtml(r.title)}</h1>
        ${pro ? `<p class="cover-location">${escHtml(pro.business_name ?? "")} · ${escHtml(pro.category ?? "")}</p>` : ""}
      </div>
      <div class="cover-footer"><span class="brand">KELEN</span> · Portfolio professionnel</div>
    </div>

    <!-- Details -->
    <div class="page">
      <div class="section-header">Présentation du projet</div>
      <div class="meta-row">
        ${date ? `<div class="meta-chip">📅 ${date}</div>` : ""}
        ${r.location ? `<div class="meta-chip">📍 ${escHtml(r.location)}</div>` : ""}
        ${price ? `<div class="meta-chip">💰 ${price}</div>` : ""}
        ${r.category ? `<div class="meta-chip">🏷 ${escHtml(r.category)}</div>` : ""}
      </div>
      ${r.description ? `<p class="description">${escHtml(r.description)}</p>` : ""}
    </div>

    ${gallery.length > 0 ? `
    <div class="page">
      <div class="section-header">Galerie photos</div>
      <div class="photo-grid">
        ${gallery.map((img: any) => `
          <div class="photo-item">
            <img src="${escHtml(img.url)}" alt="" onerror="this.parentElement.style.display='none'" />
          </div>`).join("")}
      </div>
    </div>` : ""}

    <!-- Back cover -->
    <div class="back-cover">
      <div class="brand-lg">KELEN</div>
      <h2 class="back-title">Réalisation documentée</h2>
      <p class="back-sub">Ce document fait partie du portfolio vérifié de ${escHtml(pro?.business_name ?? "ce professionnel")} sur la plateforme Kelen.</p>
    </div>
  `;
}

function renderPortfolioSection({ r, mainImage, gallery, date, price }: any) {
  return `
    <div class="page realization-section">
      ${r.is_featured ? `<span class="featured-badge">★ Portfolio</span>` : ""}
      ${mainImage ? `
        <div class="realization-hero">
          <img src="${escHtml(mainImage)}" alt="${escHtml(r.title)}" onerror="this.parentElement.style.display='none'" />
        </div>` : ""}
      <div class="realization-body">
        <h2 class="realization-title">${escHtml(r.title)}</h2>
        <div class="meta-row">
          ${date ? `<div class="meta-chip">📅 ${date}</div>` : ""}
          ${r.location ? `<div class="meta-chip">📍 ${escHtml(r.location)}</div>` : ""}
          ${price ? `<div class="meta-chip">💰 ${price}</div>` : ""}
          ${r.category ? `<div class="meta-chip">🏷 ${escHtml(r.category)}</div>` : ""}
        </div>
        ${r.description ? `<p class="description">${escHtml(r.description)}</p>` : ""}
        ${gallery.length > 0 ? `
          <div class="photo-grid mini">
            ${gallery.map((img: any) => `
              <div class="photo-item">
                <img src="${escHtml(img.url)}" alt="" onerror="this.parentElement.style.display='none'" />
              </div>`).join("")}
          </div>` : ""}
      </div>
    </div>
  `;
}

function buildHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --green: #009639;
      --green-dark: #006c49;
      --text: #1a1a2e;
      --muted: #6b7280;
      --border: #e5e7eb;
      --surface: #f9fafb;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; color: var(--text); background: #e5e7eb; font-size: 10pt; line-height: 1.6; }

    /* ── Pages ── */
    .cover, .page, .back-cover {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 2rem;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      position: relative;
      overflow: hidden;
    }

    /* ── Cover ── */
    .cover { display: flex; flex-direction: column; justify-content: flex-end; }
    .cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); }
    .cover-content { position: relative; z-index: 2; padding: 0 12mm 20mm; color: #fff; }
    .cover-eyebrow { font-size: 0.75rem; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.5rem; }
    .cover-title { font-size: 2.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 0.75rem; }
    .cover-location { font-size: 1rem; opacity: 0.8; margin-bottom: 1.25rem; }
    .cover-badge { display: inline-block; background: var(--green); color: #fff; padding: 0.4rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
    .cover-footer { position: absolute; top: 10mm; right: 10mm; z-index: 2; color: rgba(255,255,255,0.85); font-size: 0.8rem; }
    .brand { font-weight: 900; letter-spacing: 2px; }

    /* ── Content pages ── */
    .page { padding: 14mm; }
    .section-header {
      font-size: 1.4rem; font-weight: 800; color: var(--text);
      margin-bottom: 1.5rem; padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--green);
    }
    .about-text { font-size: 1rem; color: var(--muted); line-height: 1.8; }
    .description { font-size: 0.95rem; color: var(--muted); line-height: 1.75; margin-top: 1rem; white-space: pre-wrap; }

    /* ── Meta chips ── */
    .meta-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .meta-chip {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 999px; padding: 0.3rem 0.8rem;
      font-size: 0.8rem; font-weight: 500; color: var(--text);
    }

    /* ── Realization section ── */
    .realization-section { page-break-before: always; }
    .featured-badge {
      position: absolute; top: 14mm; right: 14mm;
      background: var(--green); color: #fff;
      font-size: 0.7rem; font-weight: 700;
      padding: 0.25rem 0.75rem; border-radius: 999px;
    }
    .realization-hero { width: 100%; height: 65mm; overflow: hidden; margin-bottom: 1.25rem; border-radius: 8px; }
    .realization-hero img { width: 100%; height: 100%; object-fit: cover; }
    .realization-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; }

    /* ── Photo grids ── */
    .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1.25rem; }
    .photo-grid.mini { grid-template-columns: repeat(3, 1fr); }
    .photo-item { border-radius: 8px; overflow: hidden; aspect-ratio: 4/3; background: var(--surface); }
    .photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* ── Back cover ── */
    .back-cover {
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      text-align: center; padding: 20mm;
      background: linear-gradient(135deg, #0f172a 0%, var(--green-dark) 100%);
      color: #fff;
    }
    .brand-lg { font-size: 2.5rem; font-weight: 900; letter-spacing: 4px; margin-bottom: 2rem; }
    .back-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 1rem; line-height: 1.3; }
    .back-sub { max-width: 420px; opacity: 0.8; line-height: 1.7; font-size: 0.95rem; }

    /* ── Print ── */
    @media print {
      body { background: #fff; }
      .cover, .page, .back-cover {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        width: 100%;
        min-height: 100vh;
      }
      .cover:last-child, .page:last-child, .back-cover:last-child { page-break-after: auto; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  ${body}
  <script>
    window.addEventListener('load', () => {
      // Give images time to load before printing
      setTimeout(() => window.print(), 1200);
    });
  </script>
</body>
</html>`;
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
