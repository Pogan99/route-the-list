# Lovable Prompt — Nail Salon Vertical

## Context for Lovable

You are generating a production-grade website template for a nail salon in Jacksonville, FL. This output will be integrated into an existing monorepo running **TanStack Start + Vite + React 19 + Tailwind v4 + shadcn/ui + Cloudflare Workers + Bun**. Do not scaffold a new project. Generate components, route files, and a server function that drop into the existing repo structure.

**DO NOT include any Lovable branding, generator meta tag, lovable.dev og:image, or lovable-tagger dependency. Default favicon must be a neutral SVG monogram derived from `config.businessName`.**

---

## Stack Constraints

- Framework: TanStack Start (file-based routing under `src/routes/`)
- Bundler: Vite 5, React 19
- Styling: Tailwind CSS v4 (no `tailwind.config.js` — config lives in `src/styles/globals.css` via `@theme`)
- UI primitives: shadcn/ui (already installed — import from `@/components/ui/`)
- Runtime: Cloudflare Workers (server functions via TanStack Start's `createServerFn`)
- Package manager: Bun

All new components go in `src/components/nail-salon/`. All new routes go in `src/routes/`. The booking server function goes in `src/routes/api/book.ts`.

---

## ClientConfig Shape

Every visible string, color, and data point on this site must be read from a `ClientConfig` object. Never hardcode a business name, address, price, phone number, or description. The config is imported from `@/client-config` and has this exact TypeScript type:

```typescript
export interface Service {
  name: string;
  price: string;         // e.g. "from $35" or "$45–$65"
  duration: string;      // e.g. "45 min"
  description: string;
}

export interface ClientConfig {
  businessName: string;
  tagline: string;
  heroImage: string;             // URL or import path, AVIF/WebP preferred
  logo: string;                  // URL or import path (SVG preferred)
  services: Service[];           // flat list; use `serviceCategory` field below for grouping
  serviceCategories: {
    manicure: Service[];
    pedicure: Service[];
    acrylics: Service[];
    gel: Service[];
    extras: Service[];
  };
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;            // emphasized in UI
    sunday: string;
  };
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  instagram: string;             // handle without @
  facebook: string;              // full URL
  primaryColor: string;          // CSS hex, e.g. "#c084fc"
  accentColor: string;           // CSS hex, e.g. "#f0abfc"
  domain: string;
  vertical: "nail-salon";
  walkInsWelcome: boolean;
  newPatientOffer?: string;      // e.g. "First gel set $45" (optional)
  galleryImages: string[];       // 9–12 image URLs for photo grid
}
```

Consume the config via the `useClientConfig()` hook already present at `@/lib/use-client-config`. Do not import the config object directly in components — use the hook.

---

## Page Structure & Section Order

Build a single scrollable home page at `src/routes/index.tsx`. The sections must appear in exactly this order, because this is the psychological sequence that converts a nail salon visitor into a booking:

### 1. Topbar Nav
- Logo (`config.logo`) left-aligned, `config.businessName` as alt text.
- Right side: phone number as `<a href="tel:...">` (tap-to-call on mobile), dark/light theme toggle (use `next-themes` or a manual `data-theme` attribute on `<html>`), "Book Now" CTA button that smooth-scrolls to the booking form.
- Sticky on scroll, backdrop blur, `bg-background/80`.
- On mobile: hamburger collapses to phone + Book Now only.

### 2. Full-Bleed Hero
- Background: `config.heroImage` rendered as `<picture>` with AVIF source + WebP fallback + `srcset` at 640/1024/1920w. Cover fit. `loading="eager"` on this image only — all others are lazy.
- Overlay: subtle dark gradient (not full black) so text reads on any photo.
- Headline: `config.businessName` in a large serif or display font (Playfair Display or similar — pull from Google Fonts via `@import` in CSS, not a JS font loader).
- Subheadline: `config.tagline`.
- Two CTAs side by side: "Book Appointment" (primary, scrolls to form) + "See Our Work" (ghost, scrolls to gallery).
- Walk-Ins Welcome badge: if `config.walkInsWelcome === true`, render a pill badge in `accentColor` in the bottom-left corner of the hero: "Walk-Ins Welcome". Animate it with a gentle pulse (`animate-pulse` at low opacity).
- Last-Minute Availability widget: a small card overlapping the bottom edge of the hero. Shows today's day name and "Openings today — call to check" with a `<a href="tel:...">` button. This is a static CTA — no real-time availability API. Style it as a frosted glass card (`backdrop-blur`, `bg-white/10` in dark mode).

### 3. Instagram-Style Photo Grid
- 3-column masonry grid on desktop, 2-column on tablet, 1-column on mobile (use CSS columns or a lightweight masonry library — no heavy deps).
- Source: `config.galleryImages` (9–12 items). Each image is lazy-loaded via native `loading="lazy"` + `decoding="async"`.
- Each image has a hover overlay showing the Instagram icon + "Follow @{config.instagram}" that links to `https://instagram.com/{config.instagram}`.
- Section header: "Our Work" with a thin rule. No paragraph copy — let the images speak.
- Below the grid: "Follow us on Instagram @{config.instagram}" as a plain text link. Pull the handle from config.

### 4. Services & Price List
- Tabbed interface (shadcn/ui `<Tabs>`) with one tab per category: Manicure, Pedicure, Acrylics, Gel, Extras.
- Each tab renders a card grid (2-col desktop, 1-col mobile). Each card: service name (bold), duration (muted), description (small, muted), price (large, `primaryColor`).
- Prices come from `config.serviceCategories[tab]` — if a category is empty, hide that tab.
- Saturday emphasis: add a banner above the tabs — "Saturday appointments fill fast — book early." in `accentColor`. Only render if today is Wednesday–Friday (check client-side `new Date().getDay()`).
- No external pricing data. Zero hardcoded service names.

### 5. Booking Form (shared `<BookingForm />` component)
- Import from `@/components/BookingForm` (shared across all verticals — you are generating this component for the first time here; other verticals will reuse it).
- The form collects: name (required), phone (required), email (optional), preferred date (date picker, required), preferred time (select: Morning / Afternoon / Evening), service (select populated from `config.services.map(s => s.name)`), message (optional textarea, max 300 chars, placeholder "Anything we should know? (e.g. design inspo, allergies)").
- Submit POSTs to `/api/book`. See server function spec below.
- Show inline validation. On success: replace form with "We'll confirm your appointment by phone — see you soon!" Do not redirect.
- WCAG AA: every input has a visible label. Error states use `role="alert"`. Focus rings visible.

### 6. Hours & Location
- Two-column layout: left = hours table (day name + hours from config, Saturday and Sunday rows in `accentColor` weight), right = embedded Google Maps iframe centered on `config.lat`, `config.lng` (static embed, no JS Maps API, no API key needed for basic embed). Below the map: full address, phone (tap-to-call), email (mailto link).
- If Sunday hours are "Closed", display "Closed" in muted color, not `accentColor`.

### 7. Social Proof Strip
- Three icon+text trust signals in a horizontal flex row: "5-Star Rated" (star icon), "Walk-Ins Welcome" (door icon), "Licensed & Insured" (shield icon). All copy is static (these are universal for nail salons — not from config). Keep it compact: one line each.

### 8. Footer
- Logo + tagline left, nav links center (smooth-scroll anchors to each section), social icons right (Instagram link from `config.instagram`, Facebook link from `config.facebook`).
- Copyright line: "© {new Date().getFullYear()} {config.businessName}. All rights reserved."
- Privacy policy link (placeholder href="/privacy") — required for any site collecting form data.

---

## Booking Server Function

File: `src/routes/api/book.ts`

```typescript
// Request body shape
interface BookingRequest {
  name: string;
  phone: string;
  email?: string;
  date: string;          // ISO date string "YYYY-MM-DD"
  time: "morning" | "afternoon" | "evening";
  service: string;       // must match one of config.services[].name
  message?: string;
  clientSlug: string;    // identifies which business config to use
}
```

Implementation:
- TanStack Start `createServerFn` with `method: "POST"`.
- Validate all required fields server-side. Return `400` with field-level errors if invalid.
- Send two emails via **Resend** (`RESEND_API_KEY` from Cloudflare env):
  1. To `config.email`: subject "New Booking Request — {name}", body includes all fields, formatted as HTML table.
  2. To `email` (if provided): subject "We received your request at {config.businessName}", body confirms the request and instructs them to await a phone call confirmation.
- Include a `.ics` calendar invite attachment (ICS format, hand-rolled — no npm dep needed for a basic VEVENT string) so the owner can one-tap-add to their calendar.
- Return `200 { ok: true }` on success, `500 { error: "..." }` on Resend failure.
- Never log `name`, `phone`, or `email` to console.

---

## Visual Direction

This site should feel like **Glossier's product pages crossed with a Square Appointments booking flow** — clean, modern, soft femininity without being cliché. Think: generous whitespace, soft nude/blush/mauve palette (overridden by `primaryColor`/`accentColor` from config), editorial-quality photo presentation, typography that mixes a display serif for headings with a geometric sans (Inter or DM Sans) for body.

Do NOT generate:
- Fake testimonials or star ratings without a real data source
- Stock-photo placeholder images (use CSS gradient placeholders instead)
- Generic SaaS landing page layouts (hero → features → pricing → CTA)
- Animations heavier than CSS transitions and `will-change: transform`

DO generate:
- Subtle entrance animations via `@keyframes` or Tailwind's `animate-` utilities (fade-in-up on scroll via `IntersectionObserver`, lightweight — under 20 lines of vanilla JS)
- A color system driven by `primaryColor` and `accentColor` via CSS custom properties set from config at runtime: `document.documentElement.style.setProperty('--primary', config.primaryColor)`
- Dark/light mode that actually looks good in both (test both in your mental model before generating)

---

## SEO & Performance

- `<title>`: `{config.businessName} | Nail Salon in Jacksonville, FL`
- `<meta name="description">`: `{config.tagline} — nail salon serving Jacksonville, FL. Book online or walk in. Call {config.phone}.`
- JSON-LD `LocalBusiness` schema injected into `<head>` via TanStack Start's `HeadContent`:

```json
{
  "@context": "https://schema.org",
  "@type": "NailSalon",
  "name": "{{config.businessName}}",
  "telephone": "{{config.phone}}",
  "email": "{{config.email}}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{config.address}}"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{{config.lat}}",
    "longitude": "{{config.lng}}"
  },
  "openingHours": ["{{derived from config.hours}}"],
  "url": "https://{{config.domain}}"
}
```

- `public/sitemap.xml`: single `<url>` for the home page, `<lastmod>` as build date.
- `public/robots.txt`: allow all, `Sitemap:` pointing to sitemap.xml.
- Hero image: `<picture>` with `<source type="image/avif">` and `<source type="image/webp">` before the `<img>` fallback. `srcset` at 640w, 1024w, 1920w. `sizes="100vw"`.
- Performance budget: LCP < 2s on 4G (Lighthouse simulation). Achieve by: no render-blocking fonts (use `font-display: swap`), no layout shift from images (explicit width/height or aspect-ratio), no heavy JS bundles. Total JS (gzipped) < 120KB.
- All non-hero images: `loading="lazy"` + `decoding="async"`.

---

## Accessibility

- WCAG AA contrast on all text/background combinations, including colored badges.
- Every interactive element reachable by Tab. Focus ring visible (`ring-2 ring-offset-2 ring-primary`).
- Form inputs: `<label htmlFor>` linking to input `id`. Required fields marked with `aria-required="true"`.
- Images: meaningful `alt` text (or `alt=""` for decorative images in the gallery).
- Skip-to-content link as first focusable element.
- Reduced motion: wrap all animations in `@media (prefers-reduced-motion: no-preference)`.

---

## What Not to Generate

- No Lovable branding anywhere.
- No `<meta name="generator">` tag.
- No `og:image` pointing at lovable.dev.
- No lovable-tagger package or import.
- No hardcoded business strings ("Glamour Nails", "Jacksonville", specific prices, specific services).
- No fake review components with static star ratings.
- No Stripe or payment UI (booking is email-only).
- No authentication, no user accounts, no dashboard.
