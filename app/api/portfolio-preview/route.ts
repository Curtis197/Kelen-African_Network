// app/api/portfolio-preview/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCssVars } from "@/lib/portfolio/style-tokens";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  let styleOverride: Partial<StyleAnswers> = {};
  try {
    const raw = searchParams.get("style");
    if (raw) styleOverride = JSON.parse(decodeURIComponent(raw));
  } catch {
    // ignore bad JSON
  }

  if (!slug) {
    return new NextResponse("Missing slug", { status: 400 });
  }

  const supabase = await createClient();

  const { data: pro, error } = await supabase
    .from("professionals")
    .select("*, professional_portfolio(*)")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return new NextResponse("Professional not found", { status: 404 });
  }

  const portfolio = (pro.professional_portfolio as any[])?.[0] ?? null;

  // Fetch realizations, services, products in parallel
  const [realizationsRes, servicesRes, productsRes] = await Promise.all([
    supabase
      .from("professional_realizations")
      .select("id, title, description, location, year, category, photo_urls, is_featured")
      .eq("professional_id", pro.id)
      .order("is_featured", { ascending: false })
      .order("order_index", { ascending: true })
      .limit(6),
    supabase
      .from("professional_services")
      .select("id, title, description, price, currency, duration, category, is_featured")
      .eq("professional_id", pro.id)
      .order("is_featured", { ascending: false })
      .order("order_index", { ascending: true })
      .limit(6),
    supabase
      .from("professional_products")
      .select("id, title, description, price, currency, availability, category, is_featured")
      .eq("professional_id", pro.id)
      .order("is_featured", { ascending: false })
      .order("order_index", { ascending: true })
      .limit(6),
  ]);

  const realizations = realizationsRes.data ?? [];
  const services = servicesRes.data ?? [];
  const products = productsRes.data ?? [];

  // Section visibility (default true when not set)
  const showAbout       = portfolio?.show_about_section       !== false;
  const showRealizations = portfolio?.show_realizations_section !== false;
  const showServices    = portfolio?.show_services_section    !== false;
  const showProducts    = portfolio?.show_products_section    !== false;

  const tokens: Partial<StyleAnswers> = {
    ...(portfolio?.style_tokens ?? {}),
    ...styleOverride,
  };

  const cssVars = buildCssVars(tokens);
  const cssVarString = Object.entries(cssVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  const heroImage =
    portfolio?.hero_image_url ||
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80";

  // ── Helpers ───────────────────────────────────────────────────────────────

  function formatPrice(price: number | null, currency = "XOF") {
    if (!price) return "";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
  }

  function realizationCard(r: any) {
    const img = r.photo_urls?.[0];
    return `
      <div class="card">
        ${img ? `<div class="card-img-wrap"><img src="${escapeHtml(img)}" alt="${escapeHtml(r.title)}" class="card-img" /></div>` : `<div class="card-img-wrap card-img-placeholder"></div>`}
        <div class="card-body">
          <p class="card-tag">${escapeHtml(r.category || r.year?.toString() || "")}</p>
          <h3 class="card-title">${escapeHtml(r.title)}</h3>
          ${r.description ? `<p class="card-desc">${escapeHtml(r.description)}</p>` : ""}
          ${r.location ? `<p class="card-meta">📍 ${escapeHtml(r.location)}</p>` : ""}
        </div>
      </div>`;
  }

  function serviceCard(s: any) {
    return `
      <div class="card">
        <div class="card-body">
          <p class="card-tag">${escapeHtml(s.category || "")}</p>
          <h3 class="card-title">${escapeHtml(s.title)}</h3>
          ${s.description ? `<p class="card-desc">${escapeHtml(s.description)}</p>` : ""}
          <div class="card-footer">
            ${s.price ? `<span class="card-price">${formatPrice(s.price, s.currency)}</span>` : ""}
            ${s.duration ? `<span class="card-meta">${escapeHtml(s.duration)}</span>` : ""}
          </div>
        </div>
      </div>`;
  }

  function productCard(p: any) {
    const avail = p.availability === "out_of_stock" ? "Rupture de stock" : p.availability === "limited" ? "Stock limité" : "";
    return `
      <div class="card">
        <div class="card-body">
          <p class="card-tag">${escapeHtml(p.category || "")}</p>
          <h3 class="card-title">${escapeHtml(p.title)}</h3>
          ${p.description ? `<p class="card-desc">${escapeHtml(p.description)}</p>` : ""}
          <div class="card-footer">
            ${p.price ? `<span class="card-price">${formatPrice(p.price, p.currency)}</span>` : ""}
            ${avail ? `<span class="badge-stock">${avail}</span>` : ""}
          </div>
        </div>
      </div>`;
  }

  // ── HTML ──────────────────────────────────────────────────────────────────

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aperçu — ${escapeHtml(pro.business_name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
${cssVarString}
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--portfolio-bg, #ffffff);
      color: var(--portfolio-on-bg, #1a1a1a);
    }

    /* ── Hero ── */
    .hero {
      position: relative;
      height: var(--portfolio-hero-height, 80vh);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .hero-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: var(--portfolio-overlay, rgba(0,0,0,0.35));
    }
    .hero-card {
      position: relative; z-index: 10;
      background: var(--portfolio-surface, #f8f8f6);
      border-radius: var(--portfolio-card-radius, 12px);
      padding: 3rem;
      max-width: 700px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .hero-name {
      font-size: 2.5rem;
      font-weight: 900;
      line-height: 1.1;
      color: var(--portfolio-on-surface, #1a1a1a);
      margin-bottom: 0.5rem;
    }
    .hero-category {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--portfolio-on-surface, #1a1a1a);
      opacity: 0.7;
      margin-bottom: 0.75rem;
    }
    .hero-subtitle {
      font-size: 1rem;
      color: var(--portfolio-on-surface, #1a1a1a);
      opacity: 0.6;
      margin-bottom: 1.5rem;
    }
    .hero-cta {
      display: inline-block;
      background: var(--portfolio-accent, #009639);
      color: #fff;
      padding: 0.875rem 2rem;
      border-radius: var(--portfolio-card-radius, 8px);
      font-weight: 700;
      text-decoration: none;
      font-size: 0.95rem;
    }

    /* ── Sections ── */
    .section {
      padding: var(--portfolio-section-padding, 5rem) 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .section-alt {
      background: var(--portfolio-surface, #f8f8f6);
    }
    .section-alt .section { }
    .section-wrap-alt {
      background: var(--portfolio-surface, #f8f8f6);
      padding: var(--portfolio-section-padding, 5rem) 2rem;
    }
    .section-wrap-alt .section-inner {
      max-width: 1100px;
      margin: 0 auto;
    }
    .section-title {
      font-size: 1.75rem;
      font-weight: 900;
      margin-bottom: 0.5rem;
      color: var(--portfolio-on-bg, #1a1a1a);
    }
    .section-subtitle {
      font-size: 1rem;
      color: var(--portfolio-on-bg, #1a1a1a);
      opacity: 0.55;
      margin-bottom: 2rem;
    }

    /* ── About ── */
    .about-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }
    @media (max-width: 640px) { .about-grid { grid-template-columns: 1fr; } }
    .about-img {
      width: 100%;
      aspect-ratio: 4/3;
      object-fit: cover;
      border-radius: var(--portfolio-card-radius, 12px);
    }
    .about-text {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--portfolio-on-bg, #1a1a1a);
      opacity: 0.75;
    }

    /* ── Cards grid ── */
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: var(--portfolio-surface, #f8f8f6);
      border-radius: var(--portfolio-card-radius, 12px);
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
    }
    .card-img-wrap {
      width: 100%;
      aspect-ratio: 16/9;
      overflow: hidden;
      background: rgba(0,0,0,0.05);
    }
    .card-img-placeholder { }
    .card-img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }
    .card-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      flex: 1;
    }
    .card-tag {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--portfolio-accent, #009639);
    }
    .card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--portfolio-on-surface, #1a1a1a);
      line-height: 1.3;
    }
    .card-desc {
      font-size: 0.875rem;
      color: var(--portfolio-on-surface, #1a1a1a);
      opacity: 0.6;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: auto;
      padding-top: 0.75rem;
    }
    .card-price {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--portfolio-accent, #009639);
    }
    .card-meta {
      font-size: 0.8rem;
      color: var(--portfolio-on-surface, #1a1a1a);
      opacity: 0.5;
    }
    .badge-stock {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 99px;
      background: rgba(0,0,0,0.07);
      color: var(--portfolio-on-surface, #1a1a1a);
    }

    /* ── Empty state ── */
    .empty {
      grid-column: 1 / -1;
      padding: 3rem;
      text-align: center;
      opacity: 0.35;
      font-size: 0.9rem;
    }

    /* ── Preview badge ── */
    .preview-badge {
      position: fixed; bottom: 1rem; right: 1rem;
      background: #009639;
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      z-index: 9999;
      opacity: 0.9;
    }
  </style>
</head>
<body>

  <!-- Hero -->
  <section class="hero">
    <img class="hero-img" src="${heroImage}" alt="" />
    <div class="hero-overlay"></div>
    <div class="hero-card">
      <h1 class="hero-name">${escapeHtml(pro.business_name)}</h1>
      <p class="hero-category">${escapeHtml(pro.category || "")}</p>
      ${portfolio?.hero_subtitle ? `<p class="hero-subtitle">${escapeHtml(portfolio.hero_subtitle)}</p>` : ""}
      <a class="hero-cta" href="#">Consulter l'expert</a>
    </div>
  </section>

  <!-- About -->
  ${showAbout && portfolio?.about_text ? `
  <div class="section-wrap-alt">
    <div class="section-inner section">
      <h2 class="section-title">À propos</h2>
      ${portfolio.about_image_url ? `
      <div class="about-grid">
        <img src="${escapeHtml(portfolio.about_image_url)}" alt="À propos" class="about-img" />
        <p class="about-text">${escapeHtml(portfolio.about_text)}</p>
      </div>` : `<p class="about-text">${escapeHtml(portfolio.about_text)}</p>`}
    </div>
  </div>` : ""}

  <!-- Réalisations -->
  ${showRealizations ? `
  <div class="section">
    <h2 class="section-title">Réalisations</h2>
    <p class="section-subtitle">Quelques projets réalisés</p>
    <div class="cards">
      ${realizations.length > 0
        ? realizations.map(realizationCard).join("")
        : `<p class="empty">Aucune réalisation ajoutée pour l'instant.</p>`}
    </div>
  </div>` : ""}

  <!-- Services -->
  ${showServices ? `
  <div class="section-wrap-alt">
    <div class="section-inner section">
      <h2 class="section-title">Services</h2>
      <p class="section-subtitle">Mes prestations disponibles</p>
      <div class="cards">
        ${services.length > 0
          ? services.map(serviceCard).join("")
          : `<p class="empty">Aucun service ajouté pour l'instant.</p>`}
      </div>
    </div>
  </div>` : ""}

  <!-- Produits -->
  ${showProducts ? `
  <div class="section">
    <h2 class="section-title">Produits</h2>
    <p class="section-subtitle">Produits disponibles à la vente</p>
    <div class="cards">
      ${products.length > 0
        ? products.map(productCard).join("")
        : `<p class="empty">Aucun produit ajouté pour l'instant.</p>`}
    </div>
  </div>` : ""}

  <div class="preview-badge">Aperçu</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
