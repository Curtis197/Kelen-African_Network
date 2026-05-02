// app/api/catalogue-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get("professional_id");

  if (!professionalId) {
    return new NextResponse("Paramètre manquant: professional_id requis", { status: 400 });
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Non authentifié", { status: 401 });

  // Ownership check
  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, owner_name, category, city, country, description, brand_primary, brand_secondary")
    .eq("id", professionalId)
    .eq("user_id", user.id)
    .single();

  if (!pro) return new NextResponse("Accès refusé", { status: 403 });

  // Fetch services + images and products + images in parallel
  const [{ data: servicesRaw }, { data: productsRaw }] = await Promise.all([
    supabase
      .from("professional_services")
      .select("*, images:service_images(url, is_main, order_index)")
      .eq("professional_id", professionalId)
      .order("is_featured", { ascending: false })
      .order("order_index", { ascending: true }),
    supabase
      .from("professional_products")
      .select("*, images:product_images(url, is_main, order_index)")
      .eq("professional_id", professionalId)
      .order("is_featured", { ascending: false })
      .order("order_index", { ascending: true }),
  ]);

  const services = servicesRaw ?? [];
  const products = productsRaw ?? [];

  const proName = pro.business_name ?? pro.owner_name ?? "";
  const location = [pro.city, pro.country].filter(Boolean).join(", ");

  // Pick cover image from first service or product image
  const allImages = [
    ...services.flatMap((s: any) => s.images ?? []),
    ...products.flatMap((p: any) => p.images ?? []),
  ];
  const coverImage = allImages.find((i: any) => i.is_main)?.url ?? allImages[0]?.url ?? null;

  // ── Render sections ──────────────────────────────────────────────────────

  const servicesSection = services.length > 0
    ? `
    <div class="page">
      <div class="section-header">
        <span class="section-icon">🛠</span>
        Services
        <span class="section-count">${services.length} disponible${services.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="cards-grid">
        ${services.map((s: any) => renderServiceCard(s)).join("")}
      </div>
    </div>`
    : "";

  const productsSection = products.length > 0
    ? `
    <div class="page">
      <div class="section-header">
        <span class="section-icon">📦</span>
        Produits
        <span class="section-count">${products.length} disponible${products.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="cards-grid">
        ${products.map((p: any) => renderProductCard(p)).join("")}
      </div>
    </div>`
    : "";

  if (!servicesSection && !productsSection) {
    return new NextResponse(
      buildHtml(`Catalogue — ${proName}`, `
        <div class="cover">
          <div class="cover-overlay" style="background:#1a1a2e"></div>
          <div class="cover-content">
            <p class="cover-eyebrow">Catalogue</p>
            <h1 class="cover-title">${escHtml(proName)}</h1>
            <p style="opacity:.6;margin-top:1rem;">Aucun service ou produit enregistré pour l'instant.</p>
          </div>
          <div class="cover-footer"><span class="brand">KELEN</span> · Catalogue professionnel</div>
        </div>
      `),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const totalItems = services.length + products.length;

  const body = `
    <!-- Cover -->
    <div class="cover">
      ${coverImage ? `<img class="cover-img" src="${escHtml(coverImage)}" alt="" />` : ""}
      <div class="cover-overlay"></div>
      <div class="cover-content">
        <p class="cover-eyebrow">${escHtml(pro.category ?? "Catalogue")}</p>
        <h1 class="cover-title">${escHtml(proName)}</h1>
        ${location ? `<p class="cover-location">📍 ${escHtml(location)}</p>` : ""}
        <div class="cover-badges">
          ${services.length > 0 ? `<div class="cover-badge">${services.length} service${services.length !== 1 ? "s" : ""}</div>` : ""}
          ${products.length > 0 ? `<div class="cover-badge">${products.length} produit${products.length !== 1 ? "s" : ""}</div>` : ""}
        </div>
      </div>
      <div class="cover-footer"><span class="brand">KELEN</span> · Catalogue professionnel</div>
    </div>

    ${servicesSection}
    ${productsSection}

    <!-- Back cover -->
    <div class="back-cover">
      <div class="brand-lg">KELEN</div>
      <h2 class="back-title">${totalItems} offre${totalItems !== 1 ? "s" : ""} disponible${totalItems !== 1 ? "s" : ""}</h2>
      <p class="back-sub">Ce catalogue a été généré depuis le profil vérifié de ${escHtml(proName)} sur la plateforme Kelen, réseau de professionnels de confiance en Afrique.</p>
    </div>
  `;

  const brand = pro.brand_primary
    ? { primary: pro.brand_primary, secondary: pro.brand_secondary ?? pro.brand_primary }
    : null;
  return new NextResponse(buildHtml(`Catalogue — ${proName}`, body, brand), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ── Card renderers ────────────────────────────────────────────────────────────

function renderServiceCard(s: any): string {
  const images: Array<{ url: string; is_main: boolean }> = s.images ?? [];
  const img = images.find((i) => i.is_main)?.url ?? images[0]?.url ?? null;

  const price = s.price
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: s.currency || "XOF",
        maximumFractionDigits: 0,
      }).format(s.price)
    : "Sur devis";

  return `
    <div class="card${s.is_featured ? " card-featured" : ""}">
      ${s.is_featured ? `<div class="card-badge">★ Mis en avant</div>` : ""}
      ${img
        ? `<div class="card-img-wrap"><img src="${escHtml(img)}" alt="${escHtml(s.title)}" onerror="this.parentElement.style.display='none'" /></div>`
        : `<div class="card-img-wrap card-img-placeholder"><span>🛠</span></div>`}
      <div class="card-body">
        ${s.category ? `<p class="card-tag">${escHtml(s.category)}</p>` : ""}
        <h3 class="card-title">${escHtml(s.title)}</h3>
        ${s.description ? `<p class="card-desc">${escHtml(s.description)}</p>` : ""}
        <div class="card-footer">
          <span class="card-price">${price}</span>
          ${s.duration ? `<span class="card-meta">⏱ ${escHtml(s.duration)}</span>` : ""}
        </div>
      </div>
    </div>`;
}

function renderProductCard(p: any): string {
  const images: Array<{ url: string; is_main: boolean }> = p.images ?? [];
  const img = images.find((i) => i.is_main)?.url ?? images[0]?.url ?? null;

  const price = p.price
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: p.currency || "XOF",
        maximumFractionDigits: 0,
      }).format(p.price)
    : null;

  const availLabel =
    p.availability === "out_of_stock"
      ? "Rupture de stock"
      : p.availability === "limited"
      ? "Stock limité"
      : null;

  return `
    <div class="card${p.is_featured ? " card-featured" : ""}">
      ${p.is_featured ? `<div class="card-badge">★ Mis en avant</div>` : ""}
      ${img
        ? `<div class="card-img-wrap"><img src="${escHtml(img)}" alt="${escHtml(p.title)}" onerror="this.parentElement.style.display='none'" /></div>`
        : `<div class="card-img-wrap card-img-placeholder"><span>📦</span></div>`}
      <div class="card-body">
        ${p.category ? `<p class="card-tag">${escHtml(p.category)}</p>` : ""}
        <h3 class="card-title">${escHtml(p.title)}</h3>
        ${p.description ? `<p class="card-desc">${escHtml(p.description)}</p>` : ""}
        <div class="card-footer">
          ${price ? `<span class="card-price">${price}</span>` : ""}
          ${availLabel ? `<span class="card-avail ${p.availability === "out_of_stock" ? "avail-out" : "avail-limited"}">${availLabel}</span>` : ""}
        </div>
      </div>
    </div>`;
}

// ── HTML shell ────────────────────────────────────────────────────────────────

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
    .cover-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%);
    }
    .cover-content { position: relative; z-index: 2; padding: 0 12mm 22mm; color: #fff; }
    .cover-eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.65; margin-bottom: 0.5rem; }
    .cover-title { font-size: 3rem; font-weight: 900; line-height: 1.05; margin-bottom: 0.75rem; }
    .cover-location { font-size: 1rem; opacity: 0.75; margin-bottom: 1.25rem; }
    .cover-badges { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    .cover-badge { background: var(--green); color: #fff; padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
    .cover-footer { position: absolute; top: 10mm; right: 10mm; z-index: 2; color: rgba(255,255,255,0.8); font-size: 0.8rem; }
    .brand { font-weight: 900; letter-spacing: 2px; }

    /* ── Content page ── */
    .page { padding: 12mm; }
    .section-header {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 1.5rem; font-weight: 900; color: var(--text);
      margin-bottom: 1.5rem; padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--green);
    }
    .section-icon { font-size: 1.2rem; }
    .section-count {
      margin-left: auto;
      font-size: 0.8rem; font-weight: 600;
      color: var(--muted);
      background: var(--surface); border: 1px solid var(--border);
      padding: 0.2rem 0.75rem; border-radius: 999px;
    }

    /* ── Cards grid ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.8rem;
    }
    .card {
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
      display: flex;
      flex-direction: column;
      position: relative;
      page-break-inside: avoid;
    }
    .card-featured { border-color: var(--green); box-shadow: 0 0 0 1px var(--green); }
    .card-badge {
      position: absolute; top: 0.4rem; left: 0.4rem; z-index: 2;
      background: var(--green); color: #fff;
      font-size: 0.6rem; font-weight: 700;
      padding: 0.2rem 0.5rem; border-radius: 999px;
    }
    .card-img-wrap {
      width: 100%; aspect-ratio: 4/3;
      overflow: hidden; background: var(--surface);
      display: flex; align-items: center; justify-content: center;
    }
    .card-img-placeholder { font-size: 2rem; color: var(--border); }
    .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .card-body { padding: 0.6rem 0.7rem; display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
    .card-tag {
      font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--green);
    }
    .card-title { font-size: 0.85rem; font-weight: 700; color: var(--text); line-height: 1.3; }
    .card-desc {
      font-size: 0.75rem; color: var(--muted); line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .card-footer {
      display: flex; align-items: center; gap: 0.5rem;
      margin-top: auto; padding-top: 0.5rem;
      border-top: 1px solid var(--border);
    }
    .card-price { font-size: 0.85rem; font-weight: 700; color: var(--green); }
    .card-meta { font-size: 0.7rem; color: var(--muted); margin-left: auto; }
    .card-avail {
      font-size: 0.65rem; font-weight: 600;
      padding: 0.15rem 0.4rem; border-radius: 999px; margin-left: auto;
    }
    .avail-limited { background: #fef3c7; color: #d97706; }
    .avail-out { background: #fee2e2; color: #dc2626; }

    /* ── Back cover ── */
    .back-cover {
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      text-align: center; padding: 20mm;
      background: linear-gradient(135deg, #0f172a 0%, var(--green-dark) 100%);
      color: #fff;
    }
    .brand-lg { font-size: 2.5rem; font-weight: 900; letter-spacing: 4px; margin-bottom: 2rem; }
    .back-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 1rem; }
    .back-sub { max-width: 420px; opacity: 0.75; line-height: 1.7; font-size: 0.95rem; }

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
    window.addEventListener('load', () => {
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
