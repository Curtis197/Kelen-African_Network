// app/api/qr-sticker-print/route.ts
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
    .select("id, business_name, slug")
    .eq("id", professionalId)
    .eq("user_id", user.id)
    .single();

  if (!pro) return new NextResponse("Accès refusé", { status: 403 });

  const profileUrl = `https://kelen.com/${pro.slug}`;

  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: 600,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  const html = buildStickerHtml({ pro, profileUrl, qrDataUrl });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function buildStickerHtml({ pro, profileUrl, qrDataUrl }: {
  pro: { business_name: string };
  profileUrl: string;
  qrDataUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Autocollant QR — ${escHtml(pro.business_name)}</title>
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
      gap: 6mm;
    }

    .sticker {
      width: 80mm;
      height: 80mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2.5mm;
      border-radius: 8mm;
      overflow: hidden;
      background: #fff;
      border: 0.5mm solid #009639;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      padding: 4mm;
    }

    .sticker-qr img {
      width: 60mm;
      height: 60mm;
      display: block;
    }

    .sticker-name {
      font-size: 6.5pt;
      font-weight: 700;
      color: #1a1a2e;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sticker-url {
      font-size: 5pt;
      color: #6b7280;
      font-weight: 500;
      text-align: center;
    }

    /* ── Print instructions (screen only) ── */
    .print-instructions {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 4mm 6mm;
      font-size: 8pt;
      color: #374151;
      line-height: 1.7;
      max-width: 80mm;
    }
    .print-instructions h3 { font-size: 9pt; font-weight: 700; margin-bottom: 1.5mm; color: #1a1a2e; }

    @media print {
      body { background: #fff; padding: 0; }
      .sticker { box-shadow: none; }
      .print-instructions { display: none; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @page { size: 80mm 80mm; margin: 0; }
  </style>
</head>
<body>

  <div class="sticker">
    <div class="sticker-qr"><img src="${qrDataUrl}" alt="QR code" /></div>
    <div class="sticker-name">${escHtml(pro.business_name)}</div>
    <div class="sticker-url">${escHtml(profileUrl)}</div>
  </div>

  <div class="print-instructions">
    <h3>Pour un résultat optimal :</h3>
    1. Sélectionnez "Aucune mise à l'échelle" (100%)<br/>
    2. Imprimez sur papier autocollant<br/>
    3. Vérifiez la scannabilité du QR avant de découper
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
