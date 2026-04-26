// app/api/flyer-print/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

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

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, category, city, country, phone, whatsapp, email, description, slug, services_offered")
    .eq("id", professionalId)
    .eq("user_id", user.id)
    .single();

  if (!pro) return new NextResponse("Accès refusé", { status: 403 });

  const [{ data: portfolio }, { data: realizationRows }] = await Promise.all([
    supabase
      .from("professional_portfolio")
      .select("hero_image_url")
      .eq("professional_id", professionalId)
      .maybeSingle(),
    supabase
      .from("professional_realizations")
      .select("id, title, images:realization_images(url, is_main)")
      .eq("professional_id", professionalId)
      .order("completion_date", { ascending: false })
      .limit(3),
  ]);

  const heroImage = portfolio?.hero_image_url ?? null;
  const location = [pro.city, pro.country].filter(Boolean).join(", ");
  const profileUrl = `https://kelen.com/${pro.slug}`;
  const shortDesc = pro.description ? pro.description.slice(0, 200) : null;
  const topServices: string[] = (pro.services_offered ?? []).slice(0, 3);

  // Pull main image from each realization
  const realizationPhotos: string[] = (realizationRows ?? [])
    .map((r: any) => {
      const imgs: Array<{ url: string; is_main: boolean }> = r.images ?? [];
      return imgs.find(i => i.is_main)?.url ?? imgs[0]?.url ?? null;
    })
    .filter(Boolean) as string[];

  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: 300,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  const html = buildFlyerHtml({ pro, heroImage, location, profileUrl, shortDesc, topServices, realizationPhotos, qrDataUrl });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function buildFlyerHtml({ pro, heroImage, location, profileUrl, shortDesc, topServices, realizationPhotos, qrDataUrl }: {
  pro: { business_name: string; category: string; phone: string; whatsapp: string | null };
  heroImage: string | null;
  location: string;
  profileUrl: string;
  shortDesc: string | null;
  topServices: string[];
  realizationPhotos: string[];
  qrDataUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Flyer A5 — ${escHtml(pro.business_name)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #e5e7eb;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16mm;
    }

    .flyer {
      width: 148mm;
      height: 210mm;
      overflow: hidden;
      position: relative;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.14);
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .flyer-header {
      width: 100%;
      height: 70mm;
      position: relative;
      flex-shrink: 0;
      background: #009639;
    }
    .flyer-header-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .flyer-header-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
    }
    .flyer-header-content {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 4mm 5mm;
      color: #fff;
    }
    .flyer-name {
      font-size: 10pt;
      font-weight: 900;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .flyer-meta {
      font-size: 7pt;
      opacity: 0.82;
      margin-top: 1mm;
      font-weight: 500;
    }
    .flyer-kelen {
      position: absolute; top: 3mm; right: 4mm;
      font-size: 6pt; font-weight: 900;
      color: rgba(255,255,255,0.7);
      letter-spacing: 2px;
    }

    /* ── Body ── */
    .flyer-body {
      flex: 1;
      padding: 4mm 5mm;
      display: flex;
      flex-direction: column;
      gap: 3.5mm;
      overflow: hidden;
    }

    .flyer-desc {
      font-size: 7pt;
      color: #374151;
      line-height: 1.6;
    }

    .section-label {
      font-size: 6pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #009639;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 1mm;
      margin-bottom: 1.5mm;
    }

    .services-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }
    .services-list li {
      font-size: 7pt;
      color: #1a1a2e;
      font-weight: 500;
      padding-left: 3mm;
      position: relative;
    }
    .services-list li::before {
      content: "•";
      position: absolute; left: 0;
      color: #009639;
      font-weight: 700;
    }

    .photos-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2mm;
    }
    .photos-strip-item {
      aspect-ratio: 1;
      border-radius: 2mm;
      overflow: hidden;
      background: #f3f4f6;
    }
    .photos-strip-item img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
    }

    /* ── Footer ── */
    .flyer-footer {
      border-top: 1px solid #e5e7eb;
      padding: 3mm 5mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 3mm;
      flex-shrink: 0;
    }
    .flyer-contacts {
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }
    .flyer-contact {
      font-size: 7pt;
      color: #1a1a2e;
      font-weight: 600;
    }
    .flyer-qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
    }
    .flyer-qr-wrap img {
      width: 20mm; height: 20mm;
    }
    .flyer-qr-brand {
      font-size: 5pt;
      font-weight: 900;
      color: #009639;
      letter-spacing: 2px;
    }

    /* ── Print instructions (screen only) ── */
    .print-instructions {
      margin-top: 8mm;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 4mm 6mm;
      font-size: 8pt;
      color: #374151;
      line-height: 1.7;
      max-width: 148mm;
    }
    .print-instructions h3 { font-size: 9pt; font-weight: 700; margin-bottom: 1.5mm; color: #1a1a2e; }

    @media print {
      body { background: #fff; padding: 0; }
      .flyer { box-shadow: none; page-break-after: always; }
      .print-instructions { display: none; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @page { size: A5 portrait; margin: 0; }
  </style>
</head>
<body>

  <div class="flyer">
    <!-- Header -->
    <div class="flyer-header">
      ${heroImage ? `<img class="flyer-header-img" src="${escHtml(heroImage)}" alt="" onerror="this.style.display='none'" /><div class="flyer-header-overlay"></div>` : ""}
      <div class="flyer-kelen">KELEN</div>
      <div class="flyer-header-content">
        <div class="flyer-name">${escHtml(pro.business_name)}</div>
        <div class="flyer-meta">${escHtml(pro.category)}${location ? ` · ${escHtml(location)}` : ""}</div>
      </div>
    </div>

    <!-- Body -->
    <div class="flyer-body">
      ${shortDesc ? `<p class="flyer-desc">${escHtml(shortDesc)}</p>` : ""}

      ${topServices.length > 0 ? `
      <div>
        <div class="section-label">Services</div>
        <ul class="services-list">
          ${topServices.map(s => `<li>${escHtml(s)}</li>`).join("")}
        </ul>
      </div>` : ""}

      ${realizationPhotos.length > 0 ? `
      <div>
        <div class="section-label">Réalisations</div>
        <div class="photos-strip">
          ${realizationPhotos.map(url => `
            <div class="photos-strip-item">
              <img src="${escHtml(url)}" alt="" onerror="this.parentElement.style.display='none'" />
            </div>`).join("")}
        </div>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div class="flyer-footer">
      <div class="flyer-contacts">
        ${pro.phone ? `<div class="flyer-contact">📞 ${escHtml(pro.phone)}</div>` : ""}
        ${pro.whatsapp ? `<div class="flyer-contact">💬 ${escHtml(pro.whatsapp)}</div>` : ""}
      </div>
      <div class="flyer-qr-wrap">
        <img src="${qrDataUrl}" alt="QR code" />
        <div class="flyer-qr-brand">KELEN</div>
      </div>
    </div>
  </div>

  <div class="print-instructions">
    <h3>Pour un résultat optimal :</h3>
    1. Sélectionnez "Aucune mise à l'échelle" (100%)<br/>
    2. Activez "Graphiques d'arrière-plan" pour les couleurs<br/>
    3. Papier recommandé : 150 g/m²
  </div>

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
