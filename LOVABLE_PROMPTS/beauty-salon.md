# Lovable Prompt — Beauty / Hair Salon Vertical

## Context for Lovable

You are generating a production-grade website template for a beauty and hair salon in Jacksonville, FL. This output will be integrated into an existing monorepo running **TanStack Start + Vite + React 19 + Tailwind v4 + shadcn/ui + Cloudflare Workers + Bun**. Do not scaffold a new project. Generate components, route files, and a server function that drop into the existing repo structure.

**DO NOT include any Lovable branding, generator meta tag, lovable.dev og:image, or lovable-tagger dependency. Default favicon must be a neutral SVG monogram derived from `config.businessName`.**

---

## Stack Constraints

- Framework: TanStack Start (file-based routing under `src/routes/`)
- Bundler: Vite 5, React 19
- Styling: Tailwind CSS v4 (no `tailwind.config.js` — config in `src/styles/globals.css` via `@theme`)
- UI primitives: shadcn/ui (already installed — import from `@/components/ui/`)
- Runtime: Cloudflare Workers (server functions via TanStack Start's `createServerFn`)
- Package manager: Bun

All new components go in `src/components/beauty-salon/`. All new routes go in `src/routes/`. The booking server function goes in `src/routes/api/book.ts` (shared — only create if it doesn't exist).

---

## ClientConfig Shape

Every visible string, color, and data point on this site must be read from a `ClientConfig` object. Never hardcode a business name, address, price, phone number, or description anywhere. The config is imported from `@/client-config` and has this exact TypeScript type:

```typescript
export interface Service {
  name: string;
  price: string;         // e.g. "from $85" or "$120–$200"
  duration: string;      // e.g. "2 hrs"
  description: string;
}

export interface Stylist {
  name: string;
  title: string;         // e.g. "Senior Stylist" or "Color Specialist"
  bio: string;           // 2–3 sentences
  photo: string;         // URL or import path (portrait, preferably square)
  portfolioImages: string[]; // 4–6 before/after or style photos
  instagram?: string;    // handle without @
  specialties: string[]; // e.g. ["balayage", "keratin", "bridal updo"]
  yearsExperience?: number;
}

export interface ClientConfig {
  businessName: string;
  tagline: string;
  heroImage: string;             // URL or import path, AVIF/WebP preferred
  logo: string;                  // URL or import path (SVG preferred)
  serviceCategories: {
    hair: Service[];             // cuts, blowouts, styling
    color: Service[];            // highlights, balayage, color correction
    treatments: Service[];       // keratin, deep conditioning, scalp treatments
    extras: Service[];           // eyebrows, lashes, makeup
  };
  services: Service[];           // flat list for booking form dropdown
  stylists: Stylist[];
  beforeAfterImages: Array<{
    before: string;              // URL
    after: string;               // URL
    caption: string;             // e.g. "Full balayage, 3-hour session"
  }>;
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
  vertical: "beauty-salon";
  bridalPackage?: {
    headline: string;            // e.g. "Bridal Party Services"
    description: string;
    ctaText: string;             // e.g. "Request a Bridal Consultation"
  };
  galleryImages: string[];       // 9–15 lifestyle and style photos
}
```

Consume config via the `useClientConfig()` hook at `@/lib/use-client-config`.

---

## Page Structure & Section Order

Build a single scrollable home page at `src/routes/index.tsx`. The section order is crafted for beauty salon conversion psychology: aspirational first impression → social proof of skill → explore services → meet the team → book.

### 1. Topbar Nav
- Logo left (SVG preferred, monochrome so it works in both themes).
- Right: phone (tap-to-call), theme toggle, "Book Now" primary CTA.
- Sticky, backdrop blur, `bg-background/80`. Bottom border only — no shadow.
- Mobile: hamburger opening a full-screen overlay nav (not a drawer — take the full viewport, centered links, large font size). Close on outside tap and Escape.

### 2. Aspirational Lifestyle Hero
- Full-viewport height on desktop, 80vh on mobile.
- `config.heroImage` as `<picture>` AVIF + WebP, `srcset` 640/1024/1920w. `loading="eager"`. Object-fit cover.
- Minimal overlay — this vertical's clients come for aesthetics. Use a bottom gradient only (transparent → 50% black) so the image breathes at the top.
- Headline: `config.businessName` — elegant, not bold. Font: Cormorant Garamond or Playfair Display (load via CSS `@import`, not JS). Italic weight preferred for the salon name.
- Subheadline: `config.tagline` in a lighter serif or thin sans-serif weight.
- Single CTA: "Book Your Appointment" — outlined button, not filled, so it doesn't compete with the image.
- Lifestyle copy strip below CTA: a one-line tagline in small caps — "Hair. Color. Beauty. Jacksonville's own." (static copy — this phrasing is intentionally universal and appropriate for any salon).

### 3. Services by Category
- Tabs: Hair | Color | Treatments | Extras (hide any tab where the category array is empty).
- Use shadcn/ui `<Tabs>`. Active tab indicated by an underline in `primaryColor`, not a filled background — cleaner for a salon aesthetic.
- Each tab: a two-column card grid (desktop) / single column (mobile). Card: service name, duration, description, price. Price in `primaryColor`. Cards have a subtle hover lift (`translate-y-[-2px]`).
- Below tabs: floating "Popular" badge — mark the single most popular service in each category with a small pill. Popularity is static (first item in each array is assumed most popular unless the config explicitly doesn't mark one — add an optional `popular: boolean` field to `Service` and render conditionally).
- Section headline: "Our Services" in the display font, center-aligned. Subheadline: "Transformations, not just haircuts." (static). Keep subheadline copy subtle (muted color, lighter weight).

### 4. Before & After Gallery
- A horizontally scrollable carousel (custom CSS scroll-snap, no heavy carousel library) of before/after pairs.
- Each slide: two images side-by-side with a divider line and labels "Before" / "After". Caption below from `config.beforeAfterImages[n].caption`.
- On mobile: each slide is full-width, swipeable.
- Section headline: "Transformations." Subheadline: "Real clients. Real results." (static).
- Image lazy-loaded (except the first 2 slides). AVIF/WebP srcset on each image.
- This section is critical for high-ticket color services — do not skip or minimize it.

### 5. Stylist Team Grid
- Grid: 3 columns desktop, 2 columns tablet, 1 column mobile.
- Each card: portrait photo (square crop, lazy-loaded), name (bold), title, years experience (if set: "{n} years experience"), specialties as pill tags.
- On click: shadcn `<Dialog>` opens with full bio, 2×3 portfolio grid (lazy), Instagram link if set, and a "Book with {name}" button that pre-populates the booking form via `?stylist={encodeURIComponent(name)}`.
- The booking form reads `?stylist=` and pre-selects the stylist dropdown.
- Section headline: "Meet Your Stylists." Display font. No further explanation needed — let the photos do the work.

### 6. Bridal CTA (conditional)
- Render only if `config.bridalPackage` is set.
- Full-width section with a lush background — use a CSS background gradient in `primaryColor` with low opacity, not a photo.
- Headline: `config.bridalPackage.headline`. Body: `config.bridalPackage.description`.
- CTA button: `config.bridalPackage.ctaText` — this button scrolls to the booking form and pre-fills the service dropdown with "Bridal Consultation" (or closest match).
- This section drives high-LTV bookings (bridal parties are $500–$2000+ revenue events). Give it visual weight — generous padding, large headline.

### 7. Photo Gallery
- `config.galleryImages`, 3-column masonry desktop, 2-column tablet.
- Each image lazy-loaded. Hover overlay: Instagram icon + "@{config.instagram}".
- Section headline: "Our Work." Subheadline: "Follow us @{config.instagram} for daily inspiration." (link to Instagram from config).

### 8. Booking Form
- Import `<BookingForm />` from `@/components/BookingForm`.
- Fields: name (required), phone (required), email (optional), preferred stylist (select from `config.stylists.map(s => s.name)` + "No preference", pre-filled from `?stylist=`), preferred date (date picker), preferred time (Morning / Afternoon / Evening), service (select from `config.services`), message (optional textarea, max 300 chars — placeholder: "Tell us your hair goals, inspo photos you love, or any concerns.").
- On success: "We'll call to confirm your appointment. Can't wait to see you!" Do not redirect.
- POSTs to `/api/book`. Booking server function spec: see nail-salon prompt.

### 9. Hours & Location
- Two-column: hours table (day + hours from config) + Google Maps embed centered on `config.lat`, `config.lng`.
- Address, phone (tap-to-call), email below the map.
- Saturday hours in `primaryColor` weight — most salon revenue is Saturday.

### 10. Footer
- Logo + tagline left, nav anchors center (smooth-scroll to each section), Instagram + Facebook icons right.
- "© {year} {config.businessName}. All rights reserved." + Privacy Policy placeholder.

---

## Booking Server Function

Reuse `src/routes/api/book.ts` if already created. If building fresh, the `BookingRequest` shape:

```typescript
interface BookingRequest {
  name: string;
  phone: string;
  email?: string;
  date: string;           // "YYYY-MM-DD"
  time: "morning" | "afternoon" | "evening";
  service: string;
  stylist?: string;       // beauty salon only
  message?: string;
  clientSlug: string;
}
```

- Validate required fields, return `400` with field errors on failure.
- Send email to `config.email` via Resend with all booking details as formatted HTML.
- Send confirmation to client `email` if provided.
- Attach `.ics` calendar invite string (VEVENT format, hand-rolled).
- Return `200 { ok: true }`. Never log PII.

---

## Visual Direction

This site should feel like **Aesop's retail experience crossed with Vogue editorial layout** — confident, sophisticated, photography-forward. Reference specifically: Aesop's long-scroll product pages (generous vertical rhythm, text that breathes), and Vogue's use of large display serif over full-bleed imagery.

NOT the look: generic SaaS landing page, Bootstrap grid, bubblegum pink salon aesthetic, clip-art scissors graphics.

Typography: Cormorant Garamond (display — loaded via CSS `@import` from Google Fonts, `font-display: swap`) paired with DM Sans (body, UI). This pairing signals luxury without being inaccessible.

Color approach: soft warm neutrals (cream, taupe, blush) overridden by `primaryColor`/`accentColor` from config via CSS custom properties set at runtime. The design should work with any `primaryColor` — do not bake in specific colors except as defaults that are overridden.

Dark mode: deep charcoal (`#1a1a1a`) not true black. Warm whites in light mode (`#fafaf8`). The salon aesthetic demands warmth, not clinical stark white/black.

Animations: scroll-triggered fade-in-up (vanilla `IntersectionObserver`, under 20 lines JS). The before/after carousel uses CSS scroll-snap — zero JS for the scroll behavior. No Framer Motion.

Do NOT generate:
- Generic SaaS hero ("The modern way to manage your hair")
- Clip art or icon-heavy layouts
- Fake review carousels with hardcoded star ratings
- Bright neon or high-saturation color schemes
- Photo placeholders with text (use `aspect-ratio` CSS blocks with gradient fills)

---

## SEO & Performance

- `<title>`: `{config.businessName} | Hair & Beauty Salon in Jacksonville, FL`
- `<meta name="description">`: `{config.tagline} — hair salon in Jacksonville, FL. Cuts, color, treatments, and bridal services. Book your appointment. Call {config.phone}.`
- JSON-LD schema:

```json
{
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "{{config.businessName}}",
  "telephone": "{{config.phone}}",
  "email": "{{config.email}}",
  "address": { "@type": "PostalAddress", "streetAddress": "{{config.address}}" },
  "geo": { "@type": "GeoCoordinates", "latitude": "{{config.lat}}", "longitude": "{{config.lng}}" },
  "openingHours": ["{{derived from config.hours}}"],
  "url": "https://{{config.domain}}"
}
```

- `public/sitemap.xml`, `public/robots.txt` — standard.
- Hero: `<picture>` AVIF/WebP, `srcset` at 640/1024/1920w, `loading="eager"`.
- All other images: `loading="lazy"` + `decoding="async"`.
- Performance budget: LCP < 2s on 4G. Total JS (gzipped) < 120KB. `font-display: swap` on all custom fonts.

---

## Accessibility

- WCAG AA contrast across all theme variants. Validate warm neutrals against body text.
- Keyboard navigation: Tab through all interactive elements. Focus ring visible.
- `<Dialog>` modals trap focus, close on Escape, return focus to trigger.
- Carousel: keyboard arrow keys navigate slides. `aria-label` on prev/next buttons.
- Before/after images: `alt` text describes the transformation (derive from `caption` field).
- Form: labels linked to inputs, `aria-required`, `role="alert"` on validation errors.
- Skip-to-content link first.
- `@media (prefers-reduced-motion: no-preference)` on all animations.

---

## What Not to Generate

- No Lovable branding anywhere.
- No `<meta name="generator">` tag.
- No `og:image` pointing at lovable.dev.
- No lovable-tagger import or reference.
- No hardcoded business strings.
- No fake testimonials or static star ratings.
- No Stripe or payment UI.
- No authentication, accounts, or admin dashboard.
- No heavy animation libraries (Framer Motion, GSAP, AOS).
