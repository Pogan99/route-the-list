/**
 * Ingest Outscraper xlsx → public/prospects.json
 * Usage: bun scripts/ingest-xlsx.ts <path-to-xlsx>
 * Idempotent: re-running merges by place_id (no duplicates).
 */

import XLSX from 'xlsx'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Prospect } from '../src/types/prospect'

const xlsxPath = process.argv[2] ?? resolve(import.meta.dir, '../../Downloads/Outscraper-20260518234151m4d.xlsx')
const outPath = resolve(import.meta.dir, '../public/prospects.json')

function parseHours(raw: unknown): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join(', ') : String(v),
          ])
        )
      }
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join(', ') : String(v),
      ])
    )
  }
  return {}
}

function parseSubtypes(raw: unknown): string[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }
  if (Array.isArray(raw)) return raw.map(String)
  return []
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function num(v: unknown): number {
  const n = parseFloat(String(v ?? ''))
  return isNaN(n) ? 0 : n
}

function toProspect(row: Record<string, unknown>): Prospect | null {
  const place_id = str(row['place_id'])
  if (!place_id) return null

  const lat = num(row['latitude'])
  const lng = num(row['longitude'])
  if (!lat || !lng) return null

  // photos: photo column is a single URL; collect up to 6 from photo + possible extras
  const photos: string[] = []
  const mainPhoto = str(row['photo'])
  if (mainPhoto) photos.push(mainPhoto)

  return {
    place_id,
    name: str(row['name']),
    category: str(row['category']),
    subtypes: parseSubtypes(row['subtypes']),
    address: str(row['address']),
    city: str(row['city']),
    state: str(row['state']),
    postal_code: str(row['postal_code']),
    lat,
    lng,
    phone: str(row['phone']),
    email: str(row['email']),
    website: str(row['website']),
    rating: num(row['rating']),
    reviews: num(row['reviews']),
    working_hours: parseHours(row['working_hours']),
    photos: photos.slice(0, 6),
    logo: str(row['logo']),
    description: str(row['description']),
    booking_appointment_link: str(row['booking_appointment_link']),
    owner_title: str(row['owner_title']),
    instagram: str(row['company_instagram']),
    facebook: str(row['company_facebook']),
  }
}

// Load existing prospects for merging
const existing: Map<string, Prospect> = new Map()
if (existsSync(outPath)) {
  try {
    const prev = JSON.parse(readFileSync(outPath, 'utf-8')) as Prospect[]
    for (const p of prev) existing.set(p.place_id, p)
    console.log(`Loaded ${existing.size} existing prospects`)
  } catch {
    console.warn('Could not parse existing prospects.json — starting fresh')
  }
}

// Read xlsx
const wb = XLSX.readFile(xlsxPath)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]

let added = 0
let updated = 0
let skipped = 0

for (const row of rows) {
  const p = toProspect(row)
  if (!p) { skipped++; continue }

  if (existing.has(p.place_id)) {
    // Merge: incoming data wins on non-empty fields
    const prev = existing.get(p.place_id)!
    existing.set(p.place_id, { ...prev, ...p })
    updated++
  } else {
    existing.set(p.place_id, p)
    added++
  }
}

const out = Array.from(existing.values())
writeFileSync(outPath, JSON.stringify(out, null, 2))

console.log(`Done: ${added} added, ${updated} updated, ${skipped} skipped`)
console.log(`Total prospects: ${out.length}`)
console.log(`Written to: ${outPath}`)
