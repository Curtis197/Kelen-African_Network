# Physical Marketing Tools — Implementation Spec

> Created: 2026-04-26
> Status: Planned — not yet implemented
> Tier: Paid (subscription required)
> Context: Primary acquisition channel for African market where internet search is not yet dominant.
> The profile is the single source of truth — all formats are generated from existing profile data.

---

## 1. Overview

Three printable formats generated from the professional's existing Kelen profile:

| Format | Dimensions | Primary use |
|--------|-----------|-------------|
| Business card | 85.6mm × 54mm (standard ISO CR80) | In-person meetings, handoff after a job, word of mouth |
| A5 flyer | 148mm × 210mm | Neighbourhood distribution, pinned at storefronts, left at job sites |
| QR sticker | 80mm × 80mm (square) | Vehicles, tools, storefronts — directs to public profile |

**The single-source principle:** No new data entry. All content is pulled from fields already populated in the professional's profile. Adding a new realization to the profile automatically updates what would appear on a regenerated card or flyer.

---

## 2. Data Mapping

### Fields used per format

| Profile field | Business card | A5 flyer | QR sticker |
|---|---|---|---|
| `business_name` | ✓ | ✓ | ✓ (small label) |
| `category` | ✓ | ✓ | — |
| `city` + `country` | ✓ | ✓ | — |
| `phone` | ✓ | ✓ | — |
| `whatsapp` | ✓ | ✓ | — |
| `email` | — | ✓ | — |
| `description` (short) | — | ✓ (truncated to 200 chars) | — |
| `hero_image_url` | recto background | ✓ full bleed header | — |
| Top 3 realizations images | — | gallery strip | — |
| Top 3 services titles | — | ✓ | — |
| `slug` → kelen.com/[slug] | QR code | QR code | QR code (main) |
| `logo_url` | if available | if available | — |
| Brand colors (from logo extraction) | if available | if available | — |

### Fallback logic
- No hero image → solid brand color background (Kelen green `#009639` or extracted color)
- No logo → "KELEN" wordmark
- No brand colors → Kelen default palette
- No services → services section omitted from flyer

---

## 3. Technical Architecture

### Pattern
Follows the existing PDF pipeline exactly:
```
Dashboard button click
  → window.open('/api/[format]-print?professional_id=xxx')
  → API route fetches profile data from Supabase
  → Returns styled HTML page
  → window.print() auto-triggers on load
  → Browser print dialog → user saves as PDF or prints
```

### New API routes

```
app/api/business-card-print/route.ts    GET ?professional_id=xxx
app/api/flyer-print/route.ts            GET ?professional_id=xxx
app/api/qr-sticker-print/route.ts       GET ?professional_id=xxx
```

All routes follow the same auth pattern as `portfolio-pdf`:
1. Verify authenticated session
2. Verify `professional_id` belongs to `user.id`
3. Fetch profile fields
4. Generate QR code server-side
5. Return HTML with `window.print()` trigger

### QR code generation

Add `qrcode` package:
```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

Usage in API route:
```ts
import QRCode from 'qrcode';

const qrDataUrl = await QRCode.toDataURL(`https://kelen.com/${pro.slug}`, {
  width: 300,
  margin: 1,
  color: { dark: '#1a1a2e', light: '#ffffff' },
});
// Returns a base64 PNG data URL — embed directly in HTML <img src={qrDataUrl} />
```

---

## 4. Format Specifications

### 4.1 Business Card — 85.6mm × 54mm

**Two sides — generated as two stacked print pages.**

#### Recto (front)
```
┌─────────────────────────────────┐
│  [Hero image — full bleed]      │
│                                 │
│  ▓▓▓ overlay gradient bottom   │
│                                 │
│  [Logo if available]            │
│  BUSINESS NAME          [white] │
│  Category · City                │
└─────────────────────────────────┘
```

- Background: hero image full bleed with dark gradient overlay bottom 40%
- Fallback: brand color solid background
- Text: white, Inter font
- Logo: top-right corner, max 18mm wide

#### Verso (back)
```
┌─────────────────────────────────┐
│                                 │
│  [QR code — 22mm × 22mm]       │
│  kelen.com/[slug]               │
│                                 │
│  📞 +221 XX XXX XX XX          │
│  💬 WhatsApp same               │
│                                 │
│  KELEN wordmark — bottom right  │
└─────────────────────────────────┘
```

- Background: white
- QR code: centered top half
- Contact info: clean list, dark text
- No bleed complexity on verso — clean white

#### CSS page setup
```css
@page { size: 85.6mm 54mm; margin: 0; }
.card-face {
  width: 85.6mm;
  height: 54mm;
  page-break-after: always;
  position: relative;
  overflow: hidden;
}
```

---

### 4.2 A5 Flyer — 148mm × 210mm

**Single page. Portrait orientation.**

```
┌──────────────────────────┐
│  [Hero image — 148×70mm] │  full bleed header
│  BUSINESS NAME    [white]│
│  Category · City         │
├──────────────────────────┤
│                          │
│  Short description text  │  max 200 chars
│                          │
│  ── Services ──          │
│  • Service 1             │  top 3 only
│  • Service 2             │
│  • Service 3             │
│                          │
│  ── Réalisations ──      │
│  [img] [img] [img]       │  3 photos strip, 44×44mm each
│                          │
├──────────────────────────┤
│  📞  +221 XX XXX XX XX  │
│  💬  WhatsApp            │
│  [QR code 28mm]  KELEN  │
└──────────────────────────┘
```

#### CSS page setup
```css
@page { size: A5 portrait; margin: 0; }
.flyer {
  width: 148mm;
  height: 210mm;
  overflow: hidden;
  position: relative;
}
```

#### Realization photo strip
- Pull top 3 realizations ordered by `completion_date DESC`
- Use `is_main` image from each realization
- Display as 3 equal-width squares in a row
- `object-fit: cover`, `aspect-ratio: 1`

---

### 4.3 QR Sticker — 80mm × 80mm

**Single purpose: drive traffic to the public profile.**

```
┌──────────────────┐
│                  │
│   [QR code       │
│    60mm × 60mm]  │
│                  │
│  BUSINESS NAME   │
│  kelen.com/slug  │
│                  │
└──────────────────┘
```

- Round corner radius: 8mm (for visual)
- QR code: 60mm centered
- Name below: 8pt Inter Medium
- URL below name: 6pt Inter, muted
- No image — maximum QR scannability
- Background: white
- Optional: thin brand-color border (2pt)

#### CSS page setup
```css
@page { size: 80mm 80mm; margin: 0; }
.sticker {
  width: 80mm;
  height: 80mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8mm;
  overflow: hidden;
}
```

---

## 5. Print Quality Notes

### Current approach: browser print
The existing pipeline uses `window.print()` triggered on page load. This works for:
- Home/office inkjet or laser printing
- "Save as PDF" from the browser print dialog
- Sharing the PDF link digitally (WhatsApp, email)

**Limitations vs professional print:**
- Color mode: RGB (browser) vs CMYK (professional print shops). Colors may shift slightly when professionally printed. Kelen's green `#009639` converts to approximately C:100 M:0 Y:64 K:41 — acceptable for most practical uses.
- Bleed: Not implemented in phase 1. Most home printers don't require bleed. Professional print shops will need a 3mm bleed extension — Phase 2 concern.
- Resolution: CSS `mm` units print at correct physical size when the browser's "no scaling" option is selected. Instruct users to print at 100% scale.

### Print instructions to show in UI
```
Pour un résultat optimal :
1. Dans la boîte de dialogue d'impression, sélectionnez "Aucune mise à l'échelle" (100%)
2. Activez "Graphiques d'arrière-plan" pour conserver les couleurs
3. Papier recommandé : 350g/m² pour la carte de visite, 150g/m² pour le flyer
```

---

## 6. Component Design

### Dashboard entry point
Location: `pro/dashboard` → "Ma présence" tab → new section "Outils marketing"

```tsx
// components/pro/MarketingToolsSection.tsx
<section>
  <h2>Outils marketing</h2>
  <p>Générés depuis votre profil. Imprimez ou téléchargez en PDF.</p>

  <div className="grid grid-cols-3 gap-4">
    <MarketingToolCard
      title="Carte de visite"
      description="Recto : votre meilleure réalisation. Verso : vos coordonnées et QR code."
      icon={<CreditCard />}
      href={`/api/business-card-print?professional_id=${pro.id}`}
    />
    <MarketingToolCard
      title="Flyer A5"
      description="Photo, services, réalisations, contact. Prêt à imprimer ou distribuer."
      icon={<FileText />}
      href={`/api/flyer-print?professional_id=${pro.id}`}
    />
    <MarketingToolCard
      title="Autocollant QR"
      description="QR code vers votre profil Kelen. Pour votre véhicule, vitrine ou chantier."
      icon={<QrCode />}
      href={`/api/qr-sticker-print?professional_id=${pro.id}`}
    />
  </div>
</section>
```

### MarketingToolCard
Opens the print route in a new tab (`window.open`), following the existing `exportRealisationToPDF` pattern.

### Subscription gate
Wrap `MarketingToolsSection` in the existing subscription check. Free users see the section with a lock and the upgrade CTA:
```
🔒 Disponible avec l'abonnement
Ces outils sont générés depuis votre profil existant — sans effort supplémentaire.
[Activer l'abonnement →]
```

---

## 7. Implementation Sequence

```
Phase 1 — Business card (highest individual value)
  □ Install qrcode package
  □ app/api/business-card-print/route.ts
  □ components/pro/MarketingToolsSection.tsx (card only)
  □ Subscription gate
  □ Print instructions tooltip
  □ Test: print at 100% scale on A4, cut to size

Phase 2 — A5 flyer
  □ app/api/flyer-print/route.ts
  □ Add to MarketingToolsSection
  □ Test: realization photo strip with various image counts (0, 1, 2, 3)

Phase 3 — QR sticker
  □ app/api/qr-sticker-print/route.ts
  □ Add to MarketingToolsSection
  □ Test: QR scannability at 80mm print size

Phase 4 — Future: professional print partner integration
  □ "Commander des impressions" button alongside download
  □ Integrates with a print-on-demand API (Gelato, Printful, or local partner)
  □ User selects quantity, pays, receives physical prints by mail
```

---

## 8. Future: Professional Print Partner

When the subscriber base justifies it, add a "Commander des impressions" flow:
- User previews the format in the browser
- Selects quantity (e.g. 100 business cards, 50 flyers)
- Pays directly (Stripe / Wave / Orange Money)
- Print partner produces and ships

Candidate APIs: Gelato (global, supports Africa shipping), Printful, or a local Dakar/Abidjan print partner via webhook.

This transforms the feature from "download and print yourself" to a full physical marketing service — without changing the data model or the template system.
