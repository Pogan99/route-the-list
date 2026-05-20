# route-the-list

Internal sales/prospecting tool for door-to-door website pitch operations. Plots scraped businesses on a map, filters to no-website prospects, and shows full detail for pitching on-site.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- MapLibre GL JS (OSM tiles, no API key needed)
- Zustand (filter state)
- xlsx (data ingest)

## Setup

```bash
bun install
```

## Ingest prospects

Drop any Outscraper xlsx into `scripts/ingest-xlsx.ts` and run:

```bash
bun scripts/ingest-xlsx.ts /path/to/Outscraper-*.xlsx
```

Re-running merges by `place_id` — safe to run multiple times or with additional xlsx files.

## Dev

```bash
bun run dev
```

Open http://localhost:5174

## Build

```bash
bun run build
```

## Features (phase 1)

- Left rail: filters (category, hide-has-website toggle default ON, city/ZIP multi-select, min reviews/rating sliders, has-email toggle)
- Center: MapLibre map with OSM tiles, pins colored by category (pink=nail, blue=pet groomer, orange=barber, purple=beauty, teal=attorney, green=dentist)
- Right rail: business name, category, rating, photo carousel, address + Apple Maps deeplink, today's hours highlighted, tap-to-call phone, "Open client site preview" stub

## Phase 2 (planned)

- k-means clustering + nearest-neighbor TSP route builder
- Route polyline on map
- localStorage status tracking (visited/interested/closed/not now)
- End-of-day CSV export
