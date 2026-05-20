import { create } from 'zustand'
import type { Prospect } from '../types/prospect'
import { normalizeCategory, CATEGORY_COLORS } from './utils'

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS)

export interface Filters {
  categories: string[]
  hideHasWebsite: boolean
  cities: string[]
  postalCodes: string[]
  minReviews: number
  minRating: number
  hasEmail: boolean
}

export type Outcome = 'interested' | 'closed' | 'not_now' | 'no_answer'

export interface VisitRecord {
  placeId: string
  visitedAt: string // ISO
  outcome?: Outcome
  notes?: string
}

// ---- localStorage visit store ----
const VISITS_KEY = 'rtl_visits'
const API_URL = import.meta.env.VITE_VISITS_API_URL as string | undefined

function loadVisits(): Record<string, VisitRecord> {
  try {
    return JSON.parse(localStorage.getItem(VISITS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveVisits(visits: Record<string, VisitRecord>) {
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits))
}

/** Fire-and-forget sync to AWS. Does not block the caller. */
function syncVisitToCloud(placeId: string, record: VisitRecord & { name?: string; category?: string }) {
  if (!API_URL) return
  const { placeId: _id, ...rest } = record
  fetch(`${API_URL}/visits/${encodeURIComponent(placeId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  }).catch(() => {/* silent — offline OK */})
}

/**
 * Hydrate localStorage from AWS with visits from the last 30 days.
 * Call once on app load. Does not overwrite newer local records.
 */
export async function hydrateFromCloud(): Promise<void> {
  if (!API_URL) return
  try {
    const res = await fetch(`${API_URL}/visits`)
    if (!res.ok) return
    const items: Array<{
      place_id: string
      visit_date: string
      visited_at?: string
      outcome?: Outcome
      notes?: string
    }> = await res.json()
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    const visits = loadVisits()
    let changed = false
    for (const item of items) {
      const ts = item.visited_at ?? `${item.visit_date}T00:00:00.000Z`
      if (new Date(ts).getTime() < cutoff) continue
      // Only write if we have no local record for this place
      if (!visits[item.place_id]) {
        visits[item.place_id] = {
          placeId: item.place_id,
          visitedAt: ts,
          outcome: item.outcome,
          notes: item.notes,
        }
        changed = true
      }
    }
    if (changed) saveVisits(visits)
  } catch {
    // offline — skip
  }
}

export function markVisited(placeId: string, outcome?: Outcome, notes?: string, name?: string, category?: string) {
  const visits = loadVisits()
  const record: VisitRecord = { placeId, visitedAt: new Date().toISOString(), outcome, notes }
  visits[placeId] = record
  saveVisits(visits)
  syncVisitToCloud(placeId, { ...record, name, category })
}

export function getVisit(placeId: string): VisitRecord | undefined {
  return loadVisits()[placeId]
}

export function getAllVisits(): VisitRecord[] {
  return Object.values(loadVisits())
}

export function clearToday() {
  saveVisits({})
}

// ---- Zustand app state ----
interface AppState {
  prospects: Prospect[]
  selectedProspect: Prospect | null
  filters: Filters
  activeRoute: string[] // ordered place_ids
  setProspects: (p: Prospect[]) => void
  setSelectedProspect: (p: Prospect | null) => void
  setFilters: (f: Partial<Filters>) => void
  setActiveRoute: (ids: string[]) => void
}

export const useStore = create<AppState>((set) => ({
  prospects: [],
  selectedProspect: null,
  activeRoute: [],
  filters: {
    categories: [...ALL_CATEGORIES],
    hideHasWebsite: true,
    cities: [],
    postalCodes: [],
    minReviews: 0,
    minRating: 0,
    hasEmail: false,
  },
  setProspects: (prospects) => set({ prospects }),
  setSelectedProspect: (selectedProspect) => set({ selectedProspect }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setActiveRoute: (activeRoute) => set({ activeRoute }),
}))

export function useFilteredProspects(): Prospect[] {
  const { prospects, filters } = useStore()
  return prospects.filter((p) => {
    if (!filters.categories.includes(normalizeCategory(p.category))) return false
    if (filters.hideHasWebsite && p.website) return false
    if (filters.cities.length > 0 && !filters.cities.includes(p.city)) return false
    if (filters.postalCodes.length > 0 && !filters.postalCodes.includes(p.postal_code)) return false
    if (p.reviews < filters.minReviews) return false
    if (p.rating < filters.minRating) return false
    if (filters.hasEmail && !p.email) return false
    return true
  })
}
