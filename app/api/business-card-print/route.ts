// app/api/business-card-print/route.ts
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
    .select("id, business_name, category, city, country, phone, whatsapp, slug")
    .eq("id", professionalId)
    .eq("user_id", user.id)
    .single();

  if (!pro) return new NextResponse("Accès refusé", { status: 403 });

  const { data: portfolio } = await supabase
    .from("professional_portfolio")
    .select("hero_image_url")
    .eq("professional_id", professionalId)
    .maybeSingle();

  const heroImage = portfolio?.hero_image_url ?? null;
  const location = [pro.city, pro.country].filter(Boolean).join(", ");
  const profileUrl = `https://kelen.com/${pro.slug}`;

  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: 300,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  const html = buildBusinessCardHtml({ pro, heroImage, location, profileUrl, qrDataUrl });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function buildBusinessCardHtml({ pro, heroImage, location, profileUrl, qrDataUrl }: {
  pro: { business_name: string; category: string; phone: string; whatsapp: string | null; slug: string };
  heroImage: string | null;
  location: string;
  profileUrl: string;
  qrDataUrl: string;
}): string {
  const bgStyle = heroImage
    ? ""
    : `background: #009639;`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Carte de visite — ${escHtml(pro.business_name)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #e5e7eb;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20mm;
      gap: 4mm;
    }

    .card-face {
      width: 85.6mm;
      height: 54mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    /* ── Recto ── */
    .recto { }
    .recto-bg {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .recto-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 55%, transparent 100%);
    }
    .recto-solid {
      position: absolute; inset: 0;
      ${bgStyle}
    }
    .recto-content {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 3mm 4mm;
      color: #fff;
    }
    .recto-name {
      font-size: 5.5pt;
      font-weight: 900;
      line-height: 1.2;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .recto-meta {
      font-size: 4pt;
      opacity: 0.8;
      margin-top: 0.8mm;
      font-weight: 500;
    }
    .kelen-badge {
      position: absolute; top: 3mm; right: 3mm;
      font-size: 4pt; font-weight: 900;
      color: rgba(255,255,255,0.75);
      letter-spacing: 1.5px;
    }

    /* ── Verso ── */
    .verso {
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4mm;
      gap: 2mm;
    }
    .verso-qr img {
      width: 22mm;
      height: 22mm;
      display: block;
    }
    .verso-url {
      font-size: 4pt;
      color: #6b7280;
      text-align: center;
      font-weight: 500;
    }
    .verso-divider {
      width: 30mm; height: 0.3mm;
      background: #e5e7eb;
    }
    .verso-contacts {
      display: flex;
      flex-direction: column;
      gap: 1mm;
      align-items: center;
    }
    .verso-contact {
      font-size: 4.5pt;
      color: #1a1a2e;
      font-weight: 500;
    }
    .verso-brand {
      position: absolute; bottom: 3mm; right: 3.5mm;
      font-size: 3.5pt; font-weight: 900;
      color: #009639; letter-spacing: 1.5px;
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
      max-width: 85.6mm;
    }
    .print-instructions h3 { font-size: 9pt; font-weight: 700; margin-bottom: 1.5mm; color: #1a1a2e; }

    @media print {
      body { background: #fff; padding: 0; gap: 0; }
      .card-face {
        box-shadow: none;
        page-break-after: always;
      }
      .card-face:last-of-type { page-break-after: auto; }
      .print-instructions { display: none; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @page { size: 85.6mm 54mm; margin: 0; }
  </style>
</head>
<body>

  <!-- Recto -->
  <div class="card-face recto">
    ${heroImage
      ? `<img class="recto-bg" src="${escHtml(heroImage)}" alt="" onerror="this.style.display='none'" /><div class="recto-overlay"></div>`
      : `<div class="recto-solid"></div>`
    }
    <div class="kelen-badge">KELEN</div>
    <div class="recto-content">
      <div class="recto-name">${escHtml(pro.business_name)}</div>
      <div class="recto-meta">${escHtml(pro.category)}${location ? ` · ${escHtml(location)}` : ""}</div>
    </div>
  </div>

  <!-- Verso -->
  <div class="card-face verso">
    <div class="verso-qr"><img src="${qrDataUrl}" alt="QR code" /></div>
    <div class="verso-url">${escHtml(profileUrl)}</div>
    <div class="verso-divider"></div>
    <div class="verso-contacts">
      ${pro.phone ? `<div class="verso-contact">📞 ${escHtml(pro.phone)}</div>` : ""}
      ${pro.whatsapp ? `<div class="verso-contact">💬 ${escHtml(pro.whatsapp)}</div>` : ""}
    </div>
    <div class="verso-brand">KELEN</div>
  </div>

  <div class="print-instructions">
    <h3>Pour un résultat optimal :</h3>
    1. Sélectionnez "Aucune mise à l'échelle" (100%)<br/>
    2. Activez "Graphiques d'arrière-plan" pour les couleurs<br/>
    3. Papier recommandé : 350 g/m²
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
