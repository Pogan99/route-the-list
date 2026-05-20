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

interface AppState {
  prospects: Prospect[]
  selectedProspect: Prospect | null
  filters: Filters
  setProspects: (p: Prospect[]) => void
  setSelectedProspect: (p: Prospect | null) => void
  setFilters: (f: Partial<Filters>) => void
}

export const useStore = create<AppState>((set) => ({
  prospects: [],
  selectedProspect: null,
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
