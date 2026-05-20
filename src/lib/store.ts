import { create } from 'zustand'
import type { Prospect } from '../types/prospect'

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

export function markVisited(placeId: string, outcome?: Outcome, notes?: string) {
  const visits = loadVisits()
  visits[placeId] = { placeId, visitedAt: new Date().toISOString(), outcome, notes }
  saveVisits(visits)
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
    categories: [],
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
    if (filters.categories.length > 0 && !filters.categories.some(c => p.category.toLowerCase().includes(c.toLowerCase()))) return false
    if (filters.hideHasWebsite && p.website) return false
    if (filters.cities.length > 0 && !filters.cities.includes(p.city)) return false
    if (filters.postalCodes.length > 0 && !filters.postalCodes.includes(p.postal_code)) return false
    if (p.reviews < filters.minReviews) return false
    if (p.rating < filters.minRating) return false
    if (filters.hasEmail && !p.email) return false
    return true
  })
}
