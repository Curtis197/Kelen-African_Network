// app/api/portfolio-preview/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCssVars } from "@/lib/portfolio/style-tokens";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  console.log('[API] portfolio-preview GET: start', { slug });

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

  console.log('[DB] portfolio-preview professionals query:', {
    hasData: !!pro,
    hasError: !!error,
    errorMessage: error?.message,
    errorCode: error?.code,
  });
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professionals, slug:', slug);
  }

  if (!pro) {
    return new NextResponse("Professional not found", { status: 404 });
  }

  const portfolio = (pro.professional_portfolio as any[])?.[0] ?? null;

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
      background: #009639;
      color: #fff;
      padding: 0.875rem 2rem;
      border-radius: var(--portfolio-card-radius, 8px);
      font-weight: 700;
      text-decoration: none;
      font-size: 0.95rem;
    }
    .section {
      padding: var(--portfolio-section-padding, 6rem) 2rem;
    }
    .section-title {
      font-size: 1.75rem;
      font-weight: 900;
      margin-bottom: 2rem;
      color: var(--portfolio-on-bg, #1a1a1a);
    }
    .about-text {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--portfolio-on-bg, #1a1a1a);
      opacity: 0.75;
      max-width: 600px;
    }
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

  ${portfolio?.about_text ? `
  <section class="section" style="background: var(--portfolio-surface, #f8f8f6)">
    <h2 class="section-title">À propos</h2>
    <p class="about-text">${escapeHtml(portfolio.about_text)}</p>
  </section>
  ` : ""}

  <div class="preview-badge">Aperçu</div>
</body>
</html>`;

  console.log('[API] portfolio-preview GET: returning HTML', { slug, tokenKeys: Object.keys(tokens) });
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
