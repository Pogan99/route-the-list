# Runbook — On-the-Spot Deploy Flow

When a prospect says "yes," go live in under 15 minutes:

## 5-Step Deploy Flow

**Step 1 — Buy domain on Cloudflare Registrar (~60 seconds)**
Open Cloudflare dashboard → Registrar → Register Domain. Search for `<businessname>.com` or similar. Purchase on the iPad (~$10–$12/yr). DNS is automatically managed by Cloudflare — no external nameserver changes needed.

**Step 2 — Create Cloudflare Pages project**
In Cloudflare dashboard → Pages → Create a project → Connect to Git → select the `client-site-template` repo. Set the following environment variables:
- `VITE_CLIENT_SLUG=<their-slug>` (e.g. `paws-and-claws-grooming`)
- `RESEND_API_KEY=<your-resend-key>`

Build command: `bun run build` | Output directory: `dist`

**Step 3 — Add client config and push**
On your laptop (or via GitHub web editor on iPad):
- Create `src/clients/<their-slug>.ts` starting from the auto-generated prospect config (copy from `?prospect=<place_id>` URL)
- Customize business name, tagline, services, colors as needed
- `git push` — Pages deploys automatically (2–3 min build)

**Step 4 — Add custom domain in Cloudflare Pages**
In your Pages project → Custom domains → Add domain → enter their domain. Cloudflare auto-creates the DNS CNAME record. SSL provisioned automatically. Site is live within 5 minutes of domain purchase.

**Step 5 — Send "your site is live" email**
Email the owner (use the scraped email from `route-the-list`) with:
- Their live URL
- Login to update content: explain that changes go through you (this is the $39/mo value)
- Next step: fresh photo session upsell

---

## Leave-Behind PDF

The right-panel detail card in `route-the-list` is designed as a clean, printable card. To generate a one-pager for any prospect:

1. Open `route-the-list` in Chrome (or Chromium-based browser on iPad via desktop site).
2. Click the prospect's pin on the map — their card loads in the right panel.
3. The card shows: business name, category, rating, address, phone, hours, photos, and the "Open client site preview" URL.
4. In Chrome: **File → Print** (or Cmd+P on Mac) → **Save as PDF**.
5. The resulting PDF is a clean one-page leave-behind with the prospect's own info and the preview URL they can scan or type in.

For best results: set print margins to "Minimum" and enable "Background graphics" in print options so the dark card styling renders correctly.

> Tip: you can also use the browser's Print feature on the client site template itself (`?prospect=<place_id>`) to generate a more polished marketing leave-behind showing the full site preview.
