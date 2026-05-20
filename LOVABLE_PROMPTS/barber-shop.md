# Lovable Prompt — Barber Shop Vertical

## Context for Lovable

You are generating a production-grade website template for a barber shop in Jacksonville, FL. This output will be integrated into an existing monorepo running **TanStack Start + Vite + React 19 + Tailwind v4 + shadcn/ui + Cloudflare Workers + Bun**. Do not scaffold a new project. Generate components, route files, and a server function that drop into the existing repo structure.

**DO NOT include any Lovable branding, generator meta tag, lovable.dev og:image, or lovable-tagger dependency. Default favicon must be a neutral SVG monogram derived from `config.businessName`.**

---

## Stack Constraints

- Framework: TanStack Start (file-based routing under `src/routes/`)
- Bundler: Vite 5, React 19
- Styling: Tailwind CSS v4 (no `tailwind.config.js` — config lives in `src/styles/globals.css` via `@theme`)
- UI primitives: shadcn/ui (already installed — import from `@/components/ui/`)
- Runtime: Cloudflare Workers (server functions via TanStack Start's `createServerFn`)
- Package manager: Bun

All new components go in `src/components/barber-shop/`. All new routes go in `src/routes/`. The booking server function goes in `src/routes/api/book.ts` (shared across verticals — only create it if it doesn't exist).

---

## ClientConfig Shape

Every visible string, color, and data point on this site must be read from a `ClientConfig` object. Never hardcode a business name, address, price, phone number, or description. The config is imported from `@/client-config` and has this exact TypeScript type:

```typescript
export interface Service {
  name: string;
  price: string;         // e.g. "$25" or "$20–$35"
  duration: string;      // e.g. "30 min"
  description: string;
}

export interface Barber {
  name: string;
  title: string;         // e.g. "Master Barber" or "Apprentice"
  bio: string;           // 1–2 sentences
  photo: string;         // URL or import path
  portfolioImages: string[]; // 4–6 cut photos
  instagram?: string;    // handle without @
  specialties: string[]; // e.g. ["fades", "line-ups", "beard trims"]
}

export interface ClientConfig {
  businessName: string;
  tagline: string;
  heroImage: string;             // URL or import path, AVIF/WebP preferred
  logo: string;                  // URL or import path (SVG preferred)
  services: Service[];
  barbers: Barber[];
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  instagram: string;             // handle without @
  facebook: string;              // full URL
  primaryColor: string;          // CSS hex
  accentColor: string;           // CSS hex
  domain: string;
  vertical: "barber-shop";
  giftCardUrl?: string;          // external link to Square/Vagaro gift card purchase
  galleryImages: string[];       // 8–12 portfolio images
  established?: number;          // year established, e.g. 2011
}
```

Consume the config via the `useClientConfig()` hook at `@/lib/use-client-config`. Do not import the config object directly — use the hook.

---

## Page Structure & Section Order

Build a single scrollable home page at `src/routes/index.tsx`. Sections appear in this order — each placement is deliberate for a barber shop's conversion psychology: establish legitimacy, show the work, make repeat booking frictionless, convert with urgency.

### 1. Topbar Nav
- Logo left, `config.businessName` as text beside it (uppercase, tracked, bold — this is a masculine shop brand).
- Right: phone as tap-to-call link, theme toggle, "Book a Cut" primary CTA.
- If `config.established` is set, show "Est. {config.established}" as a small badge next to the business name — subtle establishment signal.
- Sticky, backdrop blur, no heavy shadow — use a 1px border-bottom in dark mode.
- Mobile: hamburger with a slide-in drawer (shadcn `<Sheet>`), full nav links visible inside.

### 2. Full-Bleed Hero
- `config.heroImage` as `<picture>` with AVIF + WebP sources, `srcset` at 640/1024/1920w. `loading="eager"`.
- Dark overlay (65% opacity) — barber shop photos often have strong backlighting; the overlay must work.
- Headline: `config.businessName` — large, uppercase, wide letter-spacing. Font: a strong condensed display (Bebas Neue or Barlow Condensed — load from Google Fonts via CSS `@import` only, no JS font loader).
- Subheadline: `config.tagline` in a lighter weight of the same font family or in Inter.
- Two CTAs: "Book Your Cut" (primary) and "Meet the Barbers" (ghost, scrolls to barbers section).
- Hours emphasis strip directly below CTA: show today's hours inline ("Open today: {todayHours}" derived from `config.hours` by `new Date().getDay()`). Weekend hours get special emphasis — if today is Friday, append "(Weekend hours: Sat {config.hours.saturday}, Sun {config.hours.sunday})".

### 3. "Book Your Usual" — Repeat Booking Flow
- This is the barber shop differentiator. Render this section before the general booking form.
- Headline: "Already a regular? Book your usual." (static copy — intentional, every barber shop has regulars).
- UI: a prominent select dropdown "Select your barber" (populated from `config.barbers.map(b => b.name)` + "No preference"), followed immediately by a phone CTA "Call {config.phone} and say their name — they'll get you in."
- Below that, a "Or book online" text link that smooth-scrolls to the full booking form.
- Rationale: regulars want to book fast. Give them a shortcut before showing the full form to new clients.
- Visual: dark card with `primaryColor` accent left-border, sits on a subtle textured background (CSS `noise` SVG pattern — generate the SVG inline, no external file).

### 4. Services & Pricing
- Simple flat list, no tabs needed (barber services are fewer and less categorized than nail salons).
- Two-column grid on desktop, single column on mobile.
- Each card: service name (bold), duration (muted small), description (muted), price (large, `accentColor`).
- Source: `config.services`.
- Above the grid: static callout banner — "Evening and Saturday appointments available." Style it as a pill or banner in `primaryColor` with white text. This signals the key differentiator for working professionals who can't come in during the day.
- At the bottom of the section: gift card CTA — if `config.giftCardUrl` is set, render a full-width banner: "Give the gift of a great cut. Gift cards available." with a button linking to `config.giftCardUrl`. Target `_blank`. If not set, hide entirely.

### 5. Barber Team & Portfolios
- Grid of barber cards, one per barber in `config.barbers`.
- Each card: headshot photo (square, lazy-loaded), name (bold), title, specialties as pill tags in `primaryColor/20` background, bio text (1–2 sentences), and if `instagram` is set, an Instagram icon link.
- On click/tap: expand to a full-screen modal (shadcn `<Dialog>`) showing a 2×3 photo grid of `barber.portfolioImages`, barber name + bio, and a "Book with {name}" button that pre-selects this barber in the booking form (via a URL hash or query param `?barber={encodeURIComponent(name)}`).
- The booking form must read `?barber=` from the URL and pre-select the matching barber in its dropdown.
- Section headline: "The Team" or "Meet Your Barbers" — static copy is fine here.

### 6. Gallery
- `config.galleryImages`, 3-column masonry on desktop, 2-column on tablet, 1-column on mobile.
- Each image lazy-loaded. Hover overlay shows "Follow @{config.instagram}".
- Section headline: "The Work" — keep it short.

### 7. Hours & Location
- Two-column: left = hours table (day + hours from config; Saturday and Sunday rows styled with `accentColor` weight and an "Open" badge if not "Closed"). Right = static Google Maps embed centered on `config.lat`, `config.lng`.
- Below map: address, phone (tap-to-call), email.
- Weekend hours must be visually prominent — this is when most working clients can visit.

### 8. Booking Form
- Import `<BookingForm />` from `@/components/BookingForm`.
- Fields: name (required), phone (required), email (optional), preferred barber (select from `config.barbers.map(b => b.name)` + "No preference", pre-filled if `?barber=` param is in URL), preferred date (date picker), preferred time (Morning / Afternoon / Evening), service (select from `config.services.map(s => s.name)`), message (optional, max 200 chars).
- On success: "We'll text or call to confirm. See you soon." Do not redirect.
- POSTs to `/api/book`. See server function spec in the nail-salon prompt (same endpoint, same implementation — do not duplicate the server function if it already exists).

### 9. Gift Card Upsell (if `config.giftCardUrl` set)
- Standalone section before footer: high-contrast banner, "Know someone who deserves a fresh cut?" headline, "Buy a Gift Card" CTA. Bold, simple, masculine. Dark background, `accentColor` button.

### 10. Footer
- Logo + business name left, nav anchors center, social icons right (Instagram + Facebook from config).
- "© {year} {config.businessName}. All rights reserved." + Privacy Policy placeholder link.

---

## Booking Server Function

Reuse `src/routes/api/book.ts` if already created by the nail-salon vertical. The `BookingRequest` shape accommodates all verticals:

```typescript
interface BookingRequest {
  name: string;
  phone: string;
  email?: string;
  date: string;              // "YYYY-MM-DD"
  time: "morning" | "afternoon" | "evening";
  service: string;
  barber?: string;           // barber shop only
  message?: string;
  clientSlug: string;
}
```

If building from scratch:
- Validate required fields, return `400` with field errors.
- Send email to `config.email` via Resend with all booking details, formatted as HTML.
- Send confirmation email to client `email` if provided.
- Attach `.ics` calendar invite.
- Return `200 { ok: true }`. Never log PII to console.

---

## Visual Direction

This site should feel like **Rudy's Barbershop meets Coupang's dense information design** — not overdesigned, not sparse. Think: dark backgrounds (`#0f0f0f` or `#111827` in dark mode), strong typographic hierarchy, photography-forward, confidence without arrogance. Reference the visual language of **Aesop's in-store experience** for whitespace and restraint, but with a masculine edge (no pastels, no soft gradients).

Palette guidance (overridden by config): charcoal background, off-white text, a single strong accent (crimson, forest green, or burnt orange — comes from `primaryColor`). Avoid blue entirely unless `primaryColor` is blue.

Font pairing: Bebas Neue (display/headings — CSS `@import` from Google Fonts, `font-display: swap`) + Inter (body, UI elements). This pairing is industry-standard for premium barbershop branding.

Animations: entrance fade-in-up on scroll via `IntersectionObserver` (under 20 lines vanilla JS). No GSAP, no Framer Motion, no heavy animation libraries.

Do NOT generate:
- Soft, rounded, pastel anything
- Generic SaaS hero layouts
- Fake testimonials or static star ratings
- Stock image placeholders (use CSS gradient blocks with aspect-ratio)

---

## SEO & Performance

- `<title>`: `{config.businessName} | Barber Shop in Jacksonville, FL`
- `<meta name="description">`: `{config.tagline} — barbershop in Jacksonville, FL. Walk-ins welcome. Book with your barber online. Call {config.phone}.`
- JSON-LD `LocalBusiness` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "name": "{{config.businessName}}",
  "telephone": "{{config.phone}}",
  "email": "{{config.email}}",
  "address": { "@type": "PostalAddress", "streetAddress": "{{config.address}}" },
  "geo": { "@type": "GeoCoordinates", "latitude": "{{config.lat}}", "longitude": "{{config.lng}}" },
  "openingHours": ["{{derived from config.hours}}"],
  "url": "https://{{config.domain}}"
}
```

- `public/sitemap.xml`: single home page URL, build-date `<lastmod>`.
- `public/robots.txt`: allow all, Sitemap reference.
- Hero: AVIF/WebP `<picture>`, `srcset` at 640/1024/1920w, `sizes="100vw"`, `loading="eager"`.
- All other images: `loading="lazy"` + `decoding="async"`.
- Performance budget: LCP < 2s on 4G. Total JS (gzipped) < 120KB. Use `font-display: swap`.

---

## Accessibility

- WCAG AA contrast. Dark backgrounds with off-white text typically pass — verify `#0f0f0f` + `#f5f5f5` combination.
- All interactive elements keyboard-accessible. Focus ring: `ring-2 ring-offset-2 ring-primary`.
- Form labels linked to inputs via `htmlFor` / `id`. `aria-required="true"` on required fields.
- Modal (`<Dialog>`) traps focus, closes on Escape, returns focus to trigger on close.
- `<picture>` elements have `alt` on the `<img>` fallback.
- Skip-to-content link as first element.
- `@media (prefers-reduced-motion: no-preference)` wraps all scroll animations.

---

## What Not to Generate

- No Lovable branding anywhere.
- No `<meta name="generator">` tag.
- No `og:image` pointing at lovable.dev.
- No lovable-tagger import.
- No hardcoded business names, prices, addresses, or service names.
- No fake reviews or static star ratings.
- No Stripe or payment UI (booking is email-only).
- No authentication, user accounts, or dashboard.
- No soft, feminine, or pastel design choices unless `primaryColor` is explicitly pink/mauve.
