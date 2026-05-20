# Operations Guide — Door-to-Door Website Sales

## Pre-Pitch Checklist

- [ ] iPad charged (>80%)
- [ ] `public/prospects.json` updated with latest Outscraper export (run `bun scripts/ingest-xlsx.ts`)
- [ ] Dev server running (`bun run dev`) — or Cloudflare Pages URL loaded in browser
- [ ] Client site template loaded for today's primary vertical (e.g. `http://localhost:3000/?prospect=<place_id>`)
- [ ] Stripe payment link bookmarked for each active vertical
- [ ] Cloudflare account logged in on second browser tab (for instant domain purchase when prospect says yes)

---

## Operational Recommendations

1. **Walk in with the site already loaded on the iPad, on their own domain preview.** Use `?prospect=<their place_id>` so the iPad shows *their* photos, *their* hours, *their* address. The "holy shit it's already mine" reaction is the close.

2. **One-page leave-behind PDF**: auto-generated from the prospect's config, with the preview URL and a QR code to it. `route-the-list` can generate this on demand using the browser's print-to-PDF (File → Print → Save as PDF in Chrome).

3. **Pricing**: pick one number and stop negotiating (e.g. $497 setup + $39/mo hosting+changes, or $0 setup + $79/mo). The $/mo recurring is the actual business; one-time-only burns out fast.

4. **Pre-call by phone the morning of**: 30-second "I'll be in your neighborhood today and would love to show you something — 5 minutes". Cuts cold-walk-in rejections roughly in half.

5. **Track conversion per vertical religiously** — that's literally the whole point of pitching 6 verticals in week 1. The `outcome` field in localStorage + end-of-day CSV gives you the numbers. After 2 weeks, drop the bottom 2 verticals.

6. **Stripe payment link per vertical**, ready on the iPad. Sign + pay on the spot. Zero "I'll think about it" pipeline.

7. **Photo upgrade upsell**: most scraped logos/photos are awful. Offer "$150 we'll take fresh photos with the iPhone next visit" — easy upsell, makes their site look genuinely better, gives you a reason to be back in their shop.

8. **Geographic density beats category density**: better to hit 20 mixed-vertical stops in one strip mall than 20 nail salons spread across town. The route builder in this tool already optimizes for this — trust it.

9. **Don't sit on Lovable hosting** for paying clients — domain ownership + Cloudflare Pages = you control retention. Lovable-hosted sites = they can churn and Lovable owns the relationship.

10. **HIPAA note for dentists**: keep the dentist booking form to name + phone + "best time to call" only. No symptoms, no insurance #, no DOB. Don't accidentally create a HIPAA surface area on a $79/mo site.
