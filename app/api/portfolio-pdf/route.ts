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

  if (id) return singleRealizationPdf(supabase, id);
  if (professionalId) return fullPortfolioPdf(supabase, professionalId, user.id);

  return new NextResponse("Paramètre manquant: id ou professional_id requis", { status: 400 });
}

// ── Single realization ────────────────────────────────────────────────────────

async function singleRealizationPdf(supabase: any, id: string) {
  const { data: r } = await supabase
    .from("professional_realizations")
    .select("*, images:realization_images(*), documents:realization_documents(id, name, url)")
    .eq("id", id)
    .single();

  if (!r) return new NextResponse("Réalisation introuvable", { status: 404 });

  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, category, city, country")
    .eq("id", r.professional_id)
    .single();

  const images: Array<{ url: string; is_main: boolean }> = r.images ?? [];
  const mainImage = images.find(i => i.is_main)?.url ?? images[0]?.url ?? null;
  const gallery = images.filter(i => i.url !== mainImage);

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
    .select("id, business_name, owner_name, category, city, country, description, brand_primary, brand_secondary")
    .eq("id", professionalId)
    .eq("user_id", userId)
    .single();

  if (!pro) return new NextResponse("Accès refusé", { status: 403 });

  // Fetch portfolio config (cover + about)
  const { data: portfolioConfig } = await supabase
    .from("professional_portfolio")
    .select("cover_title, hero_image_url, hero_subtitle, about_text, about_image_url")
    .eq("professional_id", professionalId)
    .maybeSingle();

  // Fetch selected content in parallel
  const [
    { data: realizationRows },
    { data: serviceRows },
    { data: productRows },
    { data: reviewsCache },
  ] = await Promise.all([
    supabase
      .from("professional_realizations")
      .select("*, images:realization_images(*)")
      .eq("professional_id", professionalId)
      .eq("is_pdf_included", true)
      .order("completion_date", { ascending: false }),

    supabase
      .from("professional_services")
      .select("id, title, description, price, category")
      .eq("professional_id", professionalId)
      .eq("is_pdf_included", true),

    supabase
      .from("professional_products")
      .select("id, title, description, price, category")
      .eq("professional_id", professionalId)
      .eq("is_pdf_included", true),

    supabase
      .from("pro_google_reviews_cache")
      .select("rating, total_reviews, reviews, featured_review_ids")
      .eq("pro_id", professionalId)
      .maybeSingle(),
  ]);

  const realizations = realizationRows ?? [];
  const services = serviceRows ?? [];
  const products = productRows ?? [];

  const proName = portfolioConfig?.cover_title || pro.business_name || pro.owner_name;
  const location = [pro.city, pro.country].filter(Boolean).join(", ");

  // Cover image: portfolio hero > first realization image
  const coverImage =
    portfolioConfig?.hero_image_url ??
    realizations.flatMap((r: any) => r.images ?? []).find((i: any) => i.is_main)?.url ??
    realizations.flatMap((r: any) => r.images ?? [])[0]?.url ??
    null;

  // About text: portfolio about > pro description
  const aboutText = portfolioConfig?.about_text || pro.description || null;
  const aboutImageUrl = portfolioConfig?.about_image_url ?? null;

  // Build realization sections
  const realizationSections = realizations.map((r: any) => {
    const images: Array<{ url: string; is_main: boolean }> = r.images ?? [];
    const mainImage = images.find(i => i.is_main)?.url ?? images[0]?.url ?? null;
    const gallery = images.filter(i => i.url !== mainImage).slice(0, 5);
    const date = r.completion_date
      ? new Date(r.completion_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : r.year ? String(r.year) : null;
    const price = r.price
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: r.currency || "XOF", maximumFractionDigits: 0 }).format(r.price)
      : null;
    return renderPortfolioSection({ r, mainImage, gallery, date, price });
  }).join("");

  const totalItems = realizations.length + services.length + products.length;

  // Featured Google reviews for the PDF
  const allReviews: any[] = reviewsCache?.reviews ?? [];
  const featuredIds: string[] = reviewsCache?.featured_review_ids ?? [];
  const featuredReviews = featuredIds.length > 0
    ? allReviews.filter((r: any) => featuredIds.includes(r.author_name ?? ""))
    : [];
  const reviewRating: number | null = reviewsCache?.rating ?? null;
  const totalReviews: number = reviewsCache?.total_reviews ?? 0;

  const body = `
    <!-- Cover -->
    <div class="cover">
      ${coverImage ? `<img class="cover-img" src="${escHtml(coverImage)}" alt="cover" />` : ""}
      <div class="cover-overlay"></div>
      <div class="cover-content">
        <p class="cover-eyebrow">${escHtml(pro.category ?? "Portfolio")}</p>
        <h1 class="cover-title">${escHtml(proName)}</h1>
        ${portfolioConfig?.hero_subtitle ? `<p class="cover-tagline">${escHtml(portfolioConfig.hero_subtitle)}</p>` : ""}
        ${location ? `<p class="cover-location">📍 ${escHtml(location)}</p>` : ""}
        <div class="cover-badge">${totalItems} élément${totalItems !== 1 ? "s" : ""}</div>
      </div>
      <div class="cover-footer"><span class="brand">KELEN</span> · Portfolio professionnel</div>
    </div>

    ${aboutText || aboutImageUrl ? `
    <div class="page about-page">
      <div class="section-header">À propos</div>
      ${aboutImageUrl ? `<div class="about-image-wrap"><img src="${escHtml(aboutImageUrl)}" alt="À propos" class="about-image" /></div>` : ""}
      ${aboutText ? `<p class="about-text">${escHtml(aboutText)}</p>` : ""}
    </div>` : ""}

    ${realizationSections}

    ${services.length > 0 ? `
    <div class="page page-break">
      <div class="section-header">Services</div>
      <div class="card-grid">
        ${services.map((s: any) => `
          <div class="card">
            <h3 class="card-title">${escHtml(s.title)}</h3>
            ${s.category ? `<span class="card-tag">${escHtml(s.category)}</span>` : ""}
            ${s.description ? `<p class="card-desc">${escHtml(s.description)}</p>` : ""}
            ${s.price ? `<p class="card-price">À partir de ${escHtml(String(s.price))}</p>` : ""}
          </div>`).join("")}
      </div>
    </div>` : ""}

    ${products.length > 0 ? `
    <div class="page page-break">
      <div class="section-header">Produits</div>
      <div class="card-grid">
        ${products.map((p: any) => `
          <div class="card">
            <h3 class="card-title">${escHtml(p.title)}</h3>
            ${p.category ? `<span class="card-tag">${escHtml(p.category)}</span>` : ""}
            ${p.description ? `<p class="card-desc">${escHtml(p.description)}</p>` : ""}
            ${p.price ? `<p class="card-price">${escHtml(String(p.price))}</p>` : ""}
          </div>`).join("")}
      </div>
    </div>` : ""}

    ${featuredReviews.length > 0 ? `
    <!-- Google Reviews -->
    <div class="page page-break">
      <div class="section-header">Avis Google vérifiés</div>
      ${reviewRating ? `
      <div class="review-header">
        <span class="review-rating">${reviewRating.toFixed(1)}</span>
        <div>
          <div class="review-stars">${[1,2,3,4,5].map(s => `<span class="${s <= Math.round(reviewRating) ? 'star-filled' : 'star-empty'}">★</span>`).join("")}</div>
          <p class="review-count">${totalReviews} avis Google</p>
        </div>
      </div>` : ""}
      <div class="review-grid">
        ${featuredReviews.map((r: any) => `
          <div class="review-card">
            <div class="review-top">
              <div class="reviewer-avatar">${escHtml((r.author_name ?? "?").charAt(0).toUpperCase())}</div>
              <div class="reviewer-info">
                <p class="reviewer-name">${escHtml(r.author_name ?? "Anonyme")}</p>
                <p class="reviewer-date">${escHtml(r.relative_time_description ?? "")}</p>
              </div>
              <div class="review-stars-sm">${[1,2,3,4,5].map(s => `<span class="${s <= (r.rating ?? 0) ? 'star-filled' : 'star-empty'}">★</span>`).join("")}</div>
            </div>
            ${r.text ? `<p class="review-text">${escHtml(r.text)}</p>` : ""}
          </div>`).join("")}
      </div>
    </div>` : ""}

    <!-- Back cover -->
    <div class="back-cover">
      <div class="brand-lg">KELEN</div>
      <h2 class="back-title">Portfolio vérifié</h2>
      <p class="back-sub">Ce portfolio a été généré depuis la plateforme Kelen, réseau de professionnels de confiance en Afrique.</p>
    </div>
  `;

  const brand = pro.brand_primary
    ? { primary: pro.brand_primary, secondary: pro.brand_secondary ?? pro.brand_primary }
    : null;
  const html = buildHtml(`Portfolio — ${proName}`, body, brand);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function renderSingleRealization({ r, pro, mainImage, gallery, date, price }: any) {
  return `
    <div class="cover">
      ${mainImage ? `<img class="cover-img" src="${escHtml(mainImage)}" alt="${escHtml(r.title)}" />` : ""}
      <div class="cover-overlay"></div>
      <div class="cover-content">
        ${r.category ? `<p class="cover-eyebrow">${escHtml(r.category)}</p>` : ""}
        <h1 class="cover-title">${escHtml(r.title)}</h1>
        ${pro ? `<p class="cover-location">${escHtml(pro.business_name ?? "")} · ${escHtml(pro.category ?? "")}</p>` : ""}
      </div>
      <div class="cover-footer"><span class="brand">KELEN</span> · Portfolio professionnel</div>
    </div>

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

function buildHtml(title: string, body: string, brand?: { primary: string; secondary: string } | null): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --green: ${brand?.primary ?? '#009639'};
      --green-dark: ${brand?.secondary ?? '#006c49'};
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
    .cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 55%, transparent 100%); }
    .cover-content { position: relative; z-index: 2; padding: 0 12mm 24mm; color: #fff; }
    .cover-eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; opacity: 0.65; margin-bottom: 0.6rem; }
    .cover-title { font-size: 3rem; font-weight: 900; line-height: 1.1; margin-bottom: 0.5rem; }
    .cover-tagline { font-size: 1.05rem; opacity: 0.85; margin-bottom: 0.5rem; font-style: italic; }
    .cover-location { font-size: 0.9rem; opacity: 0.75; margin-bottom: 1.25rem; }
    .cover-badge { display: inline-block; background: var(--green); color: #fff; padding: 0.4rem 1.1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
    .cover-footer { position: absolute; top: 10mm; right: 10mm; z-index: 2; color: rgba(255,255,255,0.8); font-size: 0.8rem; }
    .brand { font-weight: 900; letter-spacing: 2px; }

    /* ── About page ── */
    .about-page { padding: 14mm; }
    .about-image-wrap { width: 100%; height: 72mm; overflow: hidden; border-radius: 10px; margin-bottom: 1.5rem; }
    .about-image { width: 100%; height: 100%; object-fit: cover; }
    .about-text { font-size: 1rem; color: var(--muted); line-height: 1.85; white-space: pre-wrap; }

    /* ── Content pages ── */
    .page { padding: 14mm; }
    .page-break { page-break-before: always; }
    .section-header {
      font-size: 1.4rem; font-weight: 800; color: var(--text);
      margin-bottom: 1.5rem; padding-bottom: 0.75rem;
      border-bottom: 3px solid var(--green);
    }
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
    .realization-hero { width: 100%; height: 68mm; overflow: hidden; margin-bottom: 1.25rem; border-radius: 8px; }
    .realization-hero img { width: 100%; height: 100%; object-fit: cover; }
    .realization-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; }

    /* ── Photo grids ── */
    .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1.25rem; }
    .photo-grid.mini { grid-template-columns: repeat(3, 1fr); }
    .photo-item { border-radius: 8px; overflow: hidden; aspect-ratio: 4/3; background: var(--surface); }
    .photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* ── Services / Products card grid ── */
    .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .card {
      border: 1px solid var(--border); border-radius: 10px;
      padding: 1rem 1.1rem; background: var(--surface);
    }
    .card-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.3rem; color: var(--text); }
    .card-tag {
      display: inline-block; font-size: 0.7rem; font-weight: 600;
      color: var(--green); background: #e8f7ee; border-radius: 999px;
      padding: 0.15rem 0.6rem; margin-bottom: 0.5rem;
    }
    .card-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.6; margin-bottom: 0.5rem; }
    .card-price { font-size: 0.9rem; font-weight: 700; color: var(--green); margin-top: 0.5rem; }

    /* ── Google Reviews ── */
    .review-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.9rem 1.1rem; }
    .review-rating { font-size: 2.2rem; font-weight: 900; color: #f59e0b; }
    .review-stars { display: flex; font-size: 1.1rem; }
    .review-count { font-size: 0.8rem; color: var(--muted); margin-top: 0.2rem; }
    .star-filled { color: #f59e0b; }
    .star-empty { color: #d1d5db; }
    .review-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }
    .review-card { border: 1px solid var(--border); border-radius: 10px; padding: 0.9rem 1rem; background: var(--surface); }
    .review-top { display: flex; align-items: flex-start; gap: 0.6rem; margin-bottom: 0.6rem; }
    .reviewer-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--green); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
    .reviewer-info { flex: 1; min-width: 0; }
    .reviewer-name { font-size: 0.82rem; font-weight: 700; color: var(--text); }
    .reviewer-date { font-size: 0.7rem; color: var(--muted); margin-top: 0.1rem; }
    .review-stars-sm { display: flex; font-size: 0.75rem; flex-shrink: 0; }
    .review-text { font-size: 0.8rem; color: var(--muted); line-height: 1.6; }

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
        margin: 0; box-shadow: none;
        page-break-after: always;
        width: 100%; min-height: 100vh;
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
    window.addEventListener('load', () => { setTimeout(() => window.print(), 1200); });
  </script>
</body>
</html>`;
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
