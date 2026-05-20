# Lovable Prompt — Solo / Small-Firm Attorney Vertical

## Context for Lovable

You are generating a production-grade website template for a solo or small-firm attorney in Jacksonville, FL. This output will be integrated into an existing monorepo running **TanStack Start + Vite + React 19 + Tailwind v4 + shadcn/ui + Cloudflare Workers + Bun**. Do not scaffold a new project. Generate components, route files, and a server function that drop into the existing repo structure.

**DO NOT include any Lovable branding, generator meta tag, lovable.dev og:image, or lovable-tagger dependency. Default favicon must be a neutral SVG monogram derived from `config.businessName`.**

**IMPORTANT LEGAL COMPLIANCE**: This template must NOT include outcome guarantees, success rate claims, or specific case result promises. "We win" / "guaranteed results" / "100% success rate" language is prohibited by Florida Bar Rule 4-7.13 and must never appear, even as placeholder copy. All testimonials must include attribution and cannot claim specific outcomes. The free consultation CTA is permitted but must not promise legal advice — only a conversation.

---

## Stack Constraints

- Framework: TanStack Start (file-based routing under `src/routes/`)
- Bundler: Vite 5, React 19
- Styling: Tailwind CSS v4 (no `tailwind.config.js` — config in `src/styles/globals.css` via `@theme`)
- UI primitives: shadcn/ui (already installed — import from `@/components/ui/`)
- Runtime: Cloudflare Workers (server functions via TanStack Start's `createServerFn`)
- Package manager: Bun

All new components go in `src/components/attorney/`. All new routes go in `src/routes/`. The consultation server function goes in `src/routes/api/book.ts` (shared — only create if it doesn't exist).

---

## ClientConfig Shape

Every visible string, color, and data point on this site must be read from a `ClientConfig` object. Never hardcode a name, bar number, practice area, address, or phone number. The config is imported from `@/client-config` and has this exact TypeScript type:

```typescript
export interface PracticeArea {
  name: string;           // e.g. "Personal Injury"
  description: string;   // 2–3 sentences, no outcome claims
  icon: string;           // lucide-react icon name, e.g. "Scale" | "Shield" | "Home" | "Briefcase"
}

export interface Testimonial {
  quote: string;          // NO outcome claims; only process/experience praise
  attribution: string;    // e.g. "— Former Client, 2024" (Florida Bar requires attribution)
}

export interface Attorney {
  name: string;
  title: string;          // e.g. "Founding Attorney" or "Partner"
  photo: string;          // URL or import path (professional headshot)
  bio: string;            // 3–4 sentences, no outcome claims
  barAdmissions: string[]; // e.g. ["Florida State Bar, 2009", "U.S. District Court, M.D. Fla."]
  yearsExperience: number;
  casesHandled?: number;  // e.g. 500 — displayed as "500+ cases" if set
  education: string[];    // e.g. ["J.D., Florida Coastal School of Law, 2008"]
  linkedin?: string;      // full URL
}

export interface ClientConfig {
  businessName: string;        // e.g. "The Johnson Law Firm" or "Smith & Associates, P.A."
  tagline: string;             // e.g. "Experienced. Accessible. On your side."
  heroImage: string;           // URL or import path, AVIF/WebP preferred
  logo: string;                // URL or import path (SVG preferred)
  attorneys: Attorney[];
  practiceAreas: PracticeArea[];
  testimonials: Testimonial[];
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  responsePromise: string;     // e.g. "We respond to all inquiries within 2 business hours."
  freeConsultation: boolean;   // display "Free Consultation" CTA if true
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  linkedin?: string;           // firm LinkedIn page URL
  facebook: string;            // full URL
  primaryColor: string;        // CSS hex — navy, charcoal, forest green are typical
  accentColor: string;         // CSS hex — gold, copper, or warm off-white
  domain: string;
  vertical: "attorney";
  disclaimer: string;          // e.g. "The information on this site is for general purposes only and does not constitute legal advice. No attorney-client relationship is formed by contacting this firm."
}
```

Consume config via `useClientConfig()` hook at `@/lib/use-client-config`.

---

## Page Structure & Section Order

Build a single scrollable home page at `src/routes/index.tsx`. Section order is deliberate: establish trust before asking for contact. Attorney websites are evaluated for credibility in the first 3 seconds; every above-the-fold element must signal competence and accessibility.

### 1. Topbar Nav
- Logo left, `config.businessName` as text beside it (serif font, not bold-condensed).
- Right: phone as tap-to-call link, "Free Consultation" CTA (if `config.freeConsultation` is true), theme toggle.
- Sticky, backdrop blur. In light mode: white background, navy text. In dark mode: charcoal background, off-white text.
- Mobile: hamburger with a slide-in `<Sheet>` drawer listing all nav anchors + phone + CTA.

### 2. Above-the-Fold Trust Signals Strip
- Render ABOVE the hero image, directly below the nav bar. This is the highest-impact real estate.
- A horizontal flex row of 3–4 trust signal pills/badges. Source all from config:
  - "{config.attorneys[0].yearsExperience}+ Years of Experience" (only if lead attorney data exists)
  - "{config.attorneys[0].barAdmissions[0]}" — first bar admission
  - "{config.attorneys[0].casesHandled}+ Cases Handled" — only if `casesHandled` is set
  - "Free Consultation" — only if `config.freeConsultation` is true
- Each badge: small, clean, with a Lucide icon (Scale, Shield, Award, PhoneCall respectively).
- Style: subtle background (`primaryColor/10`), `primaryColor` text, thin border. Not flashy — institutional.
- This pattern is borrowed from Stripe's trust signals row and applied to a law office context.

### 3. Hero
- Full-bleed. `config.heroImage` as `<picture>` AVIF + WebP, `srcset` 640/1024/1920w. `loading="eager"`.
- Overlay: a dark overlay is acceptable, but a sideline layout also works well for attorneys — consider a split layout where image takes the right 60% and a text panel sits on the left 40% with a solid `primaryColor` background. Choose the layout based on whether the heroImage is a headshot (use split) or an office/cityscape (use full-bleed). Since we don't know at generation time, make this a prop: `heroLayout: "split" | "fullbleed"` added to ClientConfig with a default of `"fullbleed"`.
- Headline: `config.tagline` — NOT the firm name (the name is in the nav). The tagline should evoke trust and humanity, not victory.
- Subheadline: `config.businessName` in smaller display text below the tagline.
- CTA: "Schedule a Free Consultation" (if `config.freeConsultation`) or "Contact Us Today" — links to the consultation form section. Second CTA: "Our Practice Areas" (ghost button, scrolls to practice areas section).
- `config.responsePromise` as a small supporting line below the CTAs — "We respond to all inquiries within 2 business hours." This is a conversion-critical line: it removes the fear of sending a message into a void.

### 4. Practice Area Cards
- Grid: 3 columns desktop, 2 columns tablet, 1 column mobile.
- Each card: icon (Lucide, from `practiceArea.icon`), practice area name (bold), description (2–3 sentences, muted). Cards are not clickable links — they're informational. No individual practice area pages needed for v1.
- Section headline: "How We Can Help" — not "Practice Areas" which sounds bureaucratic.
- Cards use a subtle hover state (`border-primaryColor` on hover, smooth transition). No heavy elevation.
- If `config.practiceAreas` has more than 6 items, show the first 6 and a "See all" expansion (shadcn `<Collapsible>`).

### 5. Attorney Bio(s)
- If only one attorney: a two-column layout — large portrait photo left, bio text right. Name, title, education, bar admissions as formatted list, 3–4 sentence bio.
- If multiple attorneys: a card grid (2 columns desktop, 1 column mobile), each card with headshot + name + title + specialties. Click opens a `<Dialog>` with full bio, bar admissions, education, LinkedIn link if set.
- IMPORTANT: bio text must not contain outcome claims. If the config bio text includes language like "has won X cases" or "recovered $X for clients," generate a comment in the code warning the developer to review bar compliance, but do not modify the config string.
- Section headline: "About {config.attorneys[0].name}" (single attorney) or "The Team" (multiple).

### 6. Testimonials
- A three-card carousel or a simple 3-column grid (desktop). Each card: quote in italics (no outcome claims in placeholder text — the testimonials come from config), attribution from `testimonial.attribution`.
- Add a subtle quotation mark graphic in `primaryColor/20` as a background element to each card.
- Do NOT use static star ratings — Florida Bar rules prohibit comparative or quality claims in lawyer advertising unless they can be verified. No "⭐⭐⭐⭐⭐ best lawyer in Jacksonville" placeholder text.
- Section headline: "What Clients Say" — not "5-Star Reviews."
- If `config.testimonials` is empty, hide this section entirely.

### 7. Free Consultation CTA Banner
- Full-width section, only rendered if `config.freeConsultation === true`.
- Solid `primaryColor` background, white/light text.
- Headline: "Your first conversation is free." (static — universally appropriate).
- Body: "Tell us what you're dealing with. No obligation, no pressure. Just answers." (static).
- CTA button: "Schedule Your Consultation" — smooth-scrolls to the form.
- `config.responsePromise` shown again here in small text below the button.
- This section directly precedes the form — the pattern (promise → form) maximizes conversion.

### 8. Consultation Request Form
- This replaces the generic `<BookingForm />` for the attorney vertical — attorney intake has different legal considerations.
- Fields: name (required), phone (required), email (required — attorneys need a paper trail), preferred contact method (Phone / Email, radio buttons), best time to call (Morning / Afternoon / Evening — only shown if Phone is selected), message / "Tell us about your situation" (required textarea, max 500 chars).
- HIPAA note for attorneys: this form is not HIPAA-regulated (that's healthcare), but attorney-client privilege applies. Add a form note (static text above submit): "Your message is confidential. Submitting this form does not create an attorney-client relationship."
- Show `config.disclaimer` below the form in small muted text (this is the legal disclaimer). It must be visible — do not hide in a collapsed accordion.
- On success: "Thank you. We'll be in touch {config.responsePromise.toLowerCase()}." Do not redirect.
- POSTs to `/api/book` with the `BookingRequest` shape below.

### 9. Hours & Location
- Two-column: hours table (all 7 days from config) + Google Maps embed centered on `config.lat`, `config.lng`.
- Address, phone (tap-to-call), email.
- Below the map: `config.responsePromise` as a callout (icon + text — PhoneCall icon + the promise text).

### 10. Footer
- Logo + firm name left, nav anchors center, phone + email right.
- `config.disclaimer` in very small muted text above the copyright line. Attorneys are legally required to display disclaimers — do not omit this.
- "© {year} {config.businessName}. All rights reserved." + Privacy Policy placeholder.
- If `config.linkedin` is set, include LinkedIn icon link.

---

## Booking Server Function

File: `src/routes/api/book.ts` (reuse if exists).

```typescript
interface BookingRequest {
  name: string;
  phone: string;
  email: string;            // required for attorney vertical
  contactMethod: "phone" | "email";
  bestTimeToCall?: "morning" | "afternoon" | "evening";
  message: string;          // required for attorney vertical
  clientSlug: string;
}
```

- Validate all required fields server-side. Return `400` with field errors.
- Send email to `config.email` via Resend: subject "New Consultation Request — {name}", body as HTML with all fields.
- Send auto-reply to `email`: subject "We received your message — {config.businessName}", body confirms receipt and states `config.responsePromise`. Note: "This is an automated confirmation. No attorney-client relationship has been formed."
- Return `200 { ok: true }`. Never log PII to console.

---

## Visual Direction

This site should feel like **Stripe.com's whitespace discipline applied to a neighborhood law office** — not a BigLaw corporate site (too intimidating, too cold), and not a personal injury mill site (too aggressive, too many phone numbers). Think: calm authority. Accessible expertise.

Reference specifically:
- Stripe's generous vertical rhythm and centered, constrained max-width content blocks.
- Basecamp's web design (2023): serious but human. Clear hierarchy. No hero animations.
- The visual language of a well-designed business card: serif name, clean contact info, no clutter.

Typography: Libre Baskerville or Lora (display/headings — loaded via CSS `@import`, `font-display: swap`) + Inter (body, UI). Serif signals institutional trust. Do NOT use display-weight condensed fonts — this is not a barbershop.

Color: navy / charcoal / forest green primary (from `primaryColor`), with warm gold or copper accent (from `accentColor`). The palette should feel like a mahogany office, not a startup pitch deck.

Dark mode: deep navy (`#0f172a`) not pure black. Off-white body text. The attorney dark mode should feel like reading a brief at 11pm — legible, calm, not aggressive.

Do NOT generate:
- "No Win, No Fee" banners (outcome guarantee — prohibited by Florida Bar)
- Animated gavel graphics or scale-of-justice clipart
- Aggressive red/orange CTAs ("CALL NOW!!!")
- Phone number repeated 10 times on the page
- Fake verdict/settlement amounts ("$5M recovered")
- Generic SaaS hero layouts

---

## SEO & Performance

- `<title>`: `{config.businessName} | Attorney in Jacksonville, FL`
- `<meta name="description">`: `{config.tagline} — {config.practiceAreas[0].name} and more. Serving Jacksonville, FL. Free consultation. Call {config.phone}.`
- JSON-LD `LocalBusiness` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
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
- Hero: `<picture>` AVIF/WebP, `srcset` 640/1024/1920w, `loading="eager"`.
- All other images: `loading="lazy"` + `decoding="async"`.
- Performance budget: LCP < 2s on 4G. Total JS < 120KB gzipped. `font-display: swap`.

---

## Accessibility

- WCAG AA on all text. Navy-on-white and white-on-navy both pass at any reasonable font size.
- All interactive elements keyboard-accessible. Focus ring visible.
- Form labels linked to inputs. `aria-required="true"`. `role="alert"` on errors.
- `<Dialog>` traps focus. Closes on Escape.
- Skip-to-content link first.
- `@media (prefers-reduced-motion: no-preference)` on all animations.

---

## What Not to Generate

- No Lovable branding anywhere.
- No `<meta name="generator">` tag.
- No `og:image` pointing at lovable.dev.
- No lovable-tagger import.
- No hardcoded attorney names, case results, bar numbers, or addresses.
- No outcome guarantees or win-rate claims in any static copy.
- No fake star ratings or testimonials with specific case outcomes.
- No Stripe or payment UI.
- No aggressive ambulance-chaser visual language.
