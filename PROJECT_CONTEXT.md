# Famorfotografia Project Context

Last updated: 2026-02-17

## Goal

Build a modern, conversion-focused website for Famorfotografia with:

- Strong hero and premium-editorial positioning
- Rich wedding gallery
- Dedicated reservation page with interactive package selector
- Real inquiry forms (not mock forms)
- Easy local startup
- Easy content refresh workflow

## Current Status

Implemented and working:

- One-page marketing site with modern editorial hero (full-viewport, breathing room)
- Sticky glassmorphism nav with "Reservar" CTA link
- Local photo gallery (Instagram-scraped assets) with masonry layout + lightbox
- **Seção de Testemunhos**: Grid de avaliações reais com tipografia editorial.
- **Dedicated reservation page** (`reserva.html`):
  - Interactive package selector (click to select, syncs with form)
  - Full inquiry form with trust signals aside and photo accent
  - Sticky aside with social links and "Comparar pacotes" shortcut
  - Pre-selects package from query string (`?pack=Signature`)
- Real backend endpoint for inquiries: `POST /api/inquiry`
- Inquiry persistence to `data/inquiries.ndjson`
- Pack detail pages (`packs/essencial.html`, `packs/signature.html`, `packs/premium.html`)
  — all updated to link to `reserva.html` instead of the old contact section
- Footer on all pages with nav links
- Form status colors fixed (green ok / red error, previously near-invisible)
- Gallery + lightbox null-guarded so `main.js` works on pages without a gallery

## Design Direction

- **Homepage hero**: Full viewport, breathes — headline, lead, 2 CTAs, large photo (1.5° rotation). No form or package cards in hero.
- **Font pairing**: Cormorant Garamond (serif headings, italic accents) + Manrope (body/UI)
- **Palette**: Warm cream `#f5f0e8`, gold accent `#bd7b3d`, soft gradients
- **Section padding**: 6rem (generous breathing room throughout)
- **Cards**: Clean white/surface with subtle warm shadows, hover lift

## Key Files

- `index.html`: Homepage — hero, sobre, pacotes, galeria, CTA section
- `reserva.html`: Dedicated reservation/booking page
- `styles.css`: Full styling and responsive behavior (all pages share this)
- `main.js`: Gallery + lightbox + inquiry form submit logic (null-guarded for non-gallery pages)
- `server.js`: Static server + inquiry API + persistence
- `gallery-data.js`: Local image list used by gallery (73 photos)
- `packs/essencial.html`, `packs/signature.html`, `packs/premium.html`: Pack detail pages
- `scripts/fetch_instagram_photos.sh`: Image scraping/updating script
- `assets/photos/`: Downloaded photos (`photo-001.jpg` … `photo-073.jpg`) + `manifest.json`
- `data/inquiries.ndjson`: Stored leads

## Run Commands

Run full site with working forms:

```bash
cd /Users/alves/Projects/codex/famorfotografia-site
node server.js
```

Open: `http://localhost:8080`

Static preview only (forms won't persist):

```bash
python3 -m http.server 8080
```

## Content Refresh

Refresh gallery photos from public Instagram data:

```bash
./scripts/fetch_instagram_photos.sh 120 12 1
```

This regenerates:

- `assets/photos/photo-*.jpg`
- `assets/photos/manifest.json`
- `gallery-data.js`

## Inquiry API Contract

Endpoint: `POST /api/inquiry`

Required fields: `name`, `email`, `eventDate`

Optional fields: `source`, `partnerName`, `phone`, `location`, `packageType`, `budget`, `message`

Anti-spam: Honeypot field `website` (ignored/accepted silently if filled)

Output: NDJSON lines in `data/inquiries.ndjson`

## Routing / Link Map

| From | To | Via |
|------|----|-----|
| Homepage nav | `#galeria`, `#pacotes`, `#sobre`, `reserva.html` | sticky nav |
| Homepage pack cards | `reserva.html?pack=X` | "Pedir proposta" btn |
| Homepage CTA section | `reserva.html` | hero CTA |
| Pack detail pages | `reserva.html?pack=X` | CTA btn |
| Reservation page package selector | syncs `select[name=packageType]` | JS inline in reserva.html |
| Query string `?pack=X` | pre-selects package card + form select | JS in reserva.html |

## Optional / Future

- Admin dashboard to read inquiries
- Email delivery via Resend/SMTP
- Source more image diversity (additional approved sources / manual uploads)
- Evaluation / testimonial section
