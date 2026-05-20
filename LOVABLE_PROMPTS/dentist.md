# Lovable Prompt — General / Family Dentist Vertical

## Context for Lovable

You are generating a production-grade website template for a general or family dental practice in Jacksonville, FL. This output will be integrated into an existing monorepo running **TanStack Start + Vite + React 19 + Tailwind v4 + shadcn/ui + Cloudflare Workers + Bun**. Do not scaffold a new project. Generate components, route files, and a server function that drop into the existing repo structure.

**DO NOT include any Lovable branding, generator meta tag, lovable.dev og:image, or lovable-tagger dependency. Default favicon must be a neutral SVG monogram derived from `config.businessName`.**

**CRITICAL HIPAA COMPLIANCE**: The booking form on this site must collect ONLY: patient name, phone number, and preferred time to call. Do NOT collect: symptoms, chief complaint, date of birth, insurance provider, insurance ID number, Social Security number, medical/dental history, or any other Protected Health Information (PHI). The form is a callback request, not an intake form. Store no form submissions server-side — only send via email (Resend) and discard. This is a $79/mo static site, not a covered entity's EHR. Design accordingly.

---

## Stack Constraints

- Framework: TanStack Start (file-based routing under `src/routes/`)
- Bundler: Vite 5, React 19
- Styling: Tailwind CSS v4 (no `tailwind.config.js` — config in `src/styles/globals.css` via `@theme`)
- UI primitives: shadcn/ui (already installed — import from `@/components/ui/`)
- Runtime: Cloudflare Workers (server functions via TanStack Start's `createServerFn`)
- Package manager: Bun

All new components go in `src/components/dentist/`. All new routes go in `src/routes/`. The booking server function goes in `src/routes/api/book.ts` (shared — only create if it doesn't exist).

---

## ClientConfig Shape

Every visible string, color, and data point on this site must be read from a `ClientConfig` object. Never hardcode a practice name, address, phone number, doctor name, insurance name, or price. The config is imported from `@/client-config` and has this exact TypeScript type:

```typescript
export interface Service {
  name: string;
  description: string;   // 1–2 sentences, no diagnostic claims
  icon: string;          // lucide-react icon name, e.g. "Smile" | "Shield" | "Star" | "Heart" | "Zap"
}

export interface Doctor {
  name: string;          // e.g. "Dr. Maria Santos, DDS"
  credentials: string;   // e.g. "DDS, Florida Board Certified"
  photo: string;         // URL or import path (professional headshot)
  bio: string;           // 2–3 sentences, no diagnostic claims
  education: string[];   // e.g. ["DMD, University of Florida College of Dentistry, 2005"]
  memberOf?: string[];   // e.g. ["American Dental Association", "Florida Dental Association"]
}

export interface InsuranceProvider {
  name: string;          // e.g. "Delta Dental"
  logo?: string;         // URL to insurer's logo (optional — many won't have one)
}

export interface ClientConfig {
  businessName: string;
  tagline: string;
  heroImage: string;              // URL or import path, AVIF/WebP preferred
  logo: string;                   // URL or import path (SVG preferred)
  serviceCategories: {
    family: Service[];            // cleanings, exams, fillings, kids
    cosmetic: Service[];          // whitening, veneers, bonding, Invisalign
    emergency: Service[];         // toothache, broken tooth, extraction
  };
  services: Service[];            // flat list (for booking form dropdown — not shown on page directly)
  doctors: Doctor[];
  insuranceAccepted: InsuranceProvider[];
  googleReviewsUrl: string;       // link to Google Maps reviews tab
  googleRating?: number;          // e.g. 4.8 — optional, displayed if set
  googleReviewCount?: number;     // e.g. 127 — optional, displayed if set
  newPatientOffer?: string;       // e.g. "New Patient Exam & X-Rays — $99" (optional)
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
  email: string;                  // practice admin email — booking notifications go here
  address: string;
  lat: number;
  lng: number;
  facebook: string;               // full URL
  primaryColor: string;           // CSS hex — typically clean blue, teal, or green
  accentColor: string;            // CSS hex — typically white, light blue, or warm orange
  domain: string;
  vertical: "dentist";
  emergencyPhone?: string;        // separate after-hours emergency line (optional)
}
```

Consume config via `useClientConfig()` hook at `@/lib/use-client-config`.

---

## Page Structure & Section Order

Build a single scrollable home page at `src/routes/index.tsx`. Section order is designed for dental patient psychology: remove anxiety (trust signals, insurance), establish credibility (reviews, doctors), then present services and make it easy to call. Dentist sites have one job: get the phone to ring.

### 1. Topbar Nav
- Logo left, `config.businessName` as text beside it. Clean sans-serif, not bold or condensed.
- Right: phone number as `<a href="tel:...">` (primary CTA — phones are how dental offices book; make this impossible to miss), "Request Appointment" secondary button, theme toggle.
- If `config.emergencyPhone` is set: a small "Dental Emergency? Call {config.emergencyPhone}" line in the nav on desktop (hidden on mobile to prevent crowding, shown in mobile drawer).
- Sticky nav. Light mode: white background. Dark mode: very deep blue-charcoal. Both: bottom border in `primaryColor/20`.
- Mobile: hamburger, slide-in `<Sheet>` with all links + large phone number at top of drawer.

### 2. Insurance Accepted Carousel
- Render ABOVE the hero. This is intentional and unusual — for dental patients, "do you take my insurance?" is the first question. Answering it before the hero reduces bounce rate.
- A horizontally scrolling, auto-advancing carousel of insurance provider names (and logos if available in `config.insuranceAccepted`).
- Auto-advance every 3 seconds, pauses on hover. Use CSS `scroll-snap` + a minimal auto-scroll timer (pure JS, under 15 lines, no library).
- If no logo: render the insurer name as text in a clean pill (`border rounded-full px-4 py-2 bg-background`).
- Section label above carousel: "We accept most major insurance plans" (static copy — universally appropriate).
- This strip must be visually compact — max 80px tall — so it doesn't dominate above the hero.

### 3. Hero
- Full-bleed. `config.heroImage` as `<picture>` AVIF + WebP, `srcset` 640/1024/1920w. `loading="eager"`.
- Overlay: light gradient (preferably bottom-only, or a left-panel layout) — dental heroImages are often bright, professional-looking office interiors or smiling patient photos. Don't kill the image with a dark overlay.
- Headline: `config.tagline` (e.g. "Your Family's Dentist in Jacksonville") — NOT the practice name (already in nav).
- Subheadline: `config.businessName`.
- Two CTAs: "Call {config.phone}" (primary — links `tel:`) + "Request an Appointment" (ghost — scrolls to form).
- New Patient Offer badge: if `config.newPatientOffer` is set, render a highly visible badge/banner directly on the hero or immediately below it: "{config.newPatientOffer}" in a warm accent (not alarming red — use `accentColor` or a warm amber). Include a "For new patients only" note in small text. This is a conversion-critical element — dental practices live and die by new patient acquisition.
- Google Rating badge: if `config.googleRating` and `config.googleReviewCount` are set, render a floating badge in the bottom-left of the hero: "⭐ {config.googleRating} ({config.googleReviewCount} Google reviews)" as a link to `config.googleReviewsUrl`. This is one of the highest-converting trust signals for any local service business.

### 4. Trust Signals Strip
- A horizontal flex row of 4 trust signal badges. Source from config where possible, static where universal:
  - "{config.doctors[0].credentials}" or "Board Certified Dentist" if `credentials` is set
  - "Accepting New Patients" (static — if you're pitching with this site, they're accepting patients)
  - "Same-Day Emergency Appointments" (static — only render if `config.serviceCategories.emergency.length > 0`)
  - "Most Insurance Accepted" (static)
- Each: icon (lucide) + one-line text. Keep compact — this strip is informational, not a full section.

### 5. Services by Category
- Tabs: Family Dentistry | Cosmetic | Emergency (hide empty tabs).
- Use shadcn/ui `<Tabs>`. Active tab: underline in `primaryColor`.
- Each tab: a card grid (3-col desktop, 2-col tablet, 1-col mobile). Card: Lucide icon (from `service.icon`), service name (bold), description (muted, 1–2 sentences). No prices shown (dental pricing varies widely by insurance and case — listing prices creates false expectations and call reluctance).
- Section headline: "Our Services." No subheadline needed — let the tabs speak.
- Emergency tab: if present, add an emergency call banner at the top of the tab content: "Dental emergency? Call us now: {config.phone}" as a prominent `<a href="tel:...">` CTA. If `config.emergencyPhone` is set, use that instead. Red-tinted background for urgency — this is the ONE place a warm/urgent color is appropriate.

### 6. Google Reviews Embed
- A section dedicated to patient reviews. This is a major trust signal for healthcare providers.
- Since we can't embed the Google Reviews widget without an API key, implement this as:
  - A static display of the rating: "{config.googleRating} out of 5 stars" with filled star icons.
  - "{config.googleReviewCount} verified Google reviews" as a link to `config.googleReviewsUrl`.
  - A prominent "Read Our Reviews on Google" CTA button linking to `config.googleReviewsUrl`. Target `_blank`, `rel="noopener noreferrer"`.
  - A static sentence: "We'd love to earn your 5-star review." (static copy — appropriate for any dental practice).
- Only render this section if `config.googleRating` or `config.googleReviewsUrl` is set.
- Do NOT render fake reviews or placeholder quotes without real attribution.

### 7. Meet the Doctor(s)
- Single doctor: two-column layout — portrait photo left (professional headshot, lazy-loaded), bio right. Name, credentials, education, memberships as a formatted list.
- Multiple doctors: card grid (2-col desktop, 1-col mobile). Click opens `<Dialog>` with full bio, education, memberships.
- Section headline: "Meet Dr. {config.doctors[0].name.replace('Dr. ', '').split(' ')[0]}" (derive first name from the name string) for single doctor, or "Our Doctors" for multiple.
- Bio must not contain diagnostic claims or outcome promises.

### 8. New Patient Offer Section (if `config.newPatientOffer` set)
- A high-contrast standalone section (solid `primaryColor` or `accentColor` background).
- Headline: "New to our practice?" (static).
- Body: `config.newPatientOffer` displayed large.
- Subtext: "Valid for new patients only. Call to schedule." (static — this manages expectations without being aggressive).
- CTA: "Call {config.phone}" (primary, `tel:`) + "Request Appointment" (ghost, scrolls to form).
- This section immediately precedes the booking form — it's a final offer push before asking for contact info.

### 9. HIPAA-Safe Appointment Request Form
- CRITICAL: This form is NOT the shared `<BookingForm />` — it is a specialized minimal form to avoid creating HIPAA liability.
- Create a separate `<DentistCallbackForm />` component in `src/components/dentist/DentistCallbackForm.tsx`.
- Fields (EXACTLY these, no others):
  - Full name (required, text input, label: "Your Name")
  - Phone number (required, tel input, label: "Phone Number")
  - Best time to call (required, radio buttons: "Morning (8am–12pm)" / "Afternoon (12pm–5pm)" / "Evening (after 5pm)")
- A form note (static, above the submit button): "We'll call you to schedule your appointment. We do not collect health information through this form."
- Submit button: "Request a Callback" (not "Book Appointment" — "book" implies a confirmed slot).
- On success: "Thank you, {name}! We'll call you {timePreference}. See you soon." (interpolate the name from the form — this is fine to display client-side without storing).
- On error: "Something went wrong. Please call us directly at {config.phone}." (provide the fallback).
- POSTs to `/api/book` with the shape below.
- Section headline: "Request an Appointment." Subheadline: "We'll call to confirm a time that works for you."

### 10. Hours & Location
- Two-column: hours table (all 7 days from config) + Google Maps embed centered on `config.lat`, `config.lng`.
- Address, phone (tap-to-call), email.
- If `config.emergencyPhone` is set: add an "Dental Emergency After Hours? Call {config.emergencyPhone}" callout below the hours table.

### 11. Footer
- Logo + practice name left, nav anchors center, phone + Facebook icon right.
- "© {year} {config.businessName}. All rights reserved." + Privacy Policy placeholder link.
- Small muted text: "This website is for informational purposes only and does not constitute dental advice." (static legal disclaimer — appropriate for all healthcare-adjacent sites).

---

## Booking Server Function

File: `src/routes/api/book.ts` (reuse if exists from other vertical builds).

The `BookingRequest` shape for the dentist vertical:

```typescript
interface BookingRequest {
  name: string;                        // required
  phone: string;                       // required
  bestTimeToCall: "morning" | "afternoon" | "evening"; // required
  clientSlug: string;                  // required — identifies which practice config
  // CRITICAL: No email, no symptoms, no DOB, no insurance#, no service selection
  // on the dentist form. These fields must NOT be accepted or logged.
}
```

Server function implementation:
- Validate `name`, `phone`, `bestTimeToCall`, `clientSlug` — all required. Return `400` on missing fields.
- Send email to `config.email` via Resend (`RESEND_API_KEY` from Cloudflare env): subject "New Appointment Request — {name}", body: "Name: {name}, Phone: {phone}, Best time: {bestTimeToCall}. Call them back."
- Do NOT collect or log any other fields. If other fields are present in the request body, ignore them silently.
- Do NOT send a confirmation email to the patient — we don't have their email, by design.
- Return `200 { ok: true }`. Return `500 { error: "Failed to send notification" }` on Resend error.
- Log NOTHING to console except non-PII errors ("Resend error: {statusCode}").

---

## Visual Direction

This site should feel like **One Medical's appointment portal meets a warm neighborhood practice** — clean, clinical but human, trustworthy without being sterile. Reference specifically:

- One Medical's use of soft teal/mint and white: calming, professional, approachable.
- Apple's healthcare pages (apple.com/health): generous whitespace, human photography, clear hierarchy.
- ZocDoc's booking UI: frictionless, clear next steps, prominent phone number.

NOT the look: stock photo of a model with a blindingly white smile (cliché), clip-art toothbrush graphics, the dated "blue + white + tooth logo" dental website from 2012.

Typography: Plus Jakarta Sans or Nunito (body + headings — loaded via CSS `@import`, `font-display: swap`). These typefaces are warm and readable without being decorative. Inter is an acceptable fallback if you don't load a Google Font.

Color: clean blues, teals, or sage greens (from `primaryColor`) on white/off-white. The palette must convey clinical cleanliness + warmth simultaneously. Avoid aggressive saturated colors everywhere except the emergency CTA.

Dark mode: soft dark backgrounds (`#0f1923` — navy-dark) with slightly off-white text (`#e8f0f4`). Dark dental sites are uncommon — but if a user toggles it, make sure it looks intentional, not broken.

Animations: subtle fade-in on scroll via `IntersectionObserver`. The insurance carousel uses CSS auto-scroll only. No heavy animation libraries.

Do NOT generate:
- Fake patient photos or before/after smile photos without a real data source
- "Same-day whitening guarantee" or any outcome language
- Aggressive red "CALL NOW!!!" banners (emergency section is the only exception, and even there — warm, not alarming)
- Forms that collect symptoms, DOB, insurance numbers, or any PHI
- Star rating widgets with hardcoded values (only render ratings from config if present)

---

## SEO & Performance

- `<title>`: `{config.businessName} | Dentist in Jacksonville, FL`
- `<meta name="description">`: `{config.tagline} — family and cosmetic dentistry in Jacksonville, FL. Accepting new patients. Most insurance accepted. Call {config.phone} to schedule.`
- JSON-LD `LocalBusiness` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "name": "{{config.businessName}}",
  "telephone": "{{config.phone}}",
  "email": "{{config.email}}",
  "address": { "@type": "PostalAddress", "streetAddress": "{{config.address}}" },
  "geo": { "@type": "GeoCoordinates", "latitude": "{{config.lat}}", "longitude": "{{config.lng}}" },
  "openingHours": ["{{derived from config.hours}}"],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{config.googleRating}}",
    "reviewCount": "{{config.googleReviewCount}}"
  },
  "url": "https://{{config.domain}}"
}
```

Only include `aggregateRating` in the JSON-LD if `config.googleRating` is set.

- `public/sitemap.xml`, `public/robots.txt` — standard.
- Hero: `<picture>` AVIF/WebP, `srcset` at 640/1024/1920w, `loading="eager"`.
- All other images: `loading="lazy"` + `decoding="async"`.
- Insurance logos (if present): `loading="lazy"`, explicit `width` and `height` to prevent layout shift.
- Performance budget: LCP < 2s on 4G. Total JS (gzipped) < 120KB. `font-display: swap`.

---

## Accessibility

- WCAG AA contrast. Clinical blues on white pass easily — verify in dark mode.
- All interactive elements keyboard-accessible. Focus ring: `ring-2 ring-offset-2 ring-primary`.
- Form: labels linked to inputs via `htmlFor`/`id`. `aria-required="true"` on required fields. `role="alert"` on error states.
- Insurance carousel: `aria-label="Insurance providers accepted"`. Pause auto-advance on `prefers-reduced-motion`.
- `<Dialog>` traps focus, closes on Escape.
- Skip-to-content link first.
- Emergency phone number must be clickable on mobile — ensure `<a href="tel:...">` wraps it.
- `@media (prefers-reduced-motion: no-preference)` on all animations AND the carousel auto-advance.

---

## What Not to Generate

- No Lovable branding anywhere.
- No `<meta name="generator">` tag.
- No `og:image` pointing at lovable.dev.
- No lovable-tagger import.
- No hardcoded practice names, doctor names, insurance companies, prices, or addresses.
- No form fields that collect PHI (symptoms, DOB, insurance ID, SSN, medical history).
- No fake patient reviews or before/after photos with static content.
- No outcome claims ("pain-free guarantee", "whitest smile or your money back").
- No Stripe or payment UI.
- No authentication, patient portals, or health records.
- No inline scripts that capture or transmit form data to third parties.
