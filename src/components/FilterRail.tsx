import { useStore, useFilteredProspects } from '../lib/store'
import { CATEGORY_COLORS } from '../lib/utils'
import { useMemo } from 'react'

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS)

export function FilterRail() {
  const { filters, setFilters, prospects } = useStore()
  const filtered = useFilteredProspects()

  const allCities = useMemo(() => {
    const s = new Set(prospects.map(p => p.city).filter(Boolean))
    return Array.from(s).sort()
  }, [prospects])

  const allZips = useMemo(() => {
    const s = new Set(prospects.map(p => p.postal_code).filter(Boolean))
    return Array.from(s).sort()
  }, [prospects])

  function toggleCategory(cat: string) {
    const has = filters.categories.includes(cat)
    setFilters({ categories: has ? filters.categories.filter(c => c !== cat) : [...filters.categories, cat] })
  }

  function toggleCity(city: string) {
    const has = filters.cities.includes(city)
    setFilters({ cities: has ? filters.cities.filter(c => c !== city) : [...filters.cities, city] })
  }

  function toggleZip(zip: string) {
    const has = filters.postalCodes.includes(zip)
    setFilters({ postalCodes: has ? filters.postalCodes.filter(z => z !== zip) : [...filters.postalCodes, zip] })
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-white font-semibold text-lg">Route the List</h1>
        <p className="text-zinc-400 text-xs mt-0.5">{filtered.length} / {prospects.length} prospects</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Hide has-website toggle */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-zinc-300 text-sm font-medium">Hide has-website</span>
            <button
              onClick={() => setFilters({ hideHasWebsite: !filters.hideHasWebsite })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                filters.hideHasWebsite ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                filters.hideHasWebsite ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </label>
          <p className="text-zinc-500 text-xs mt-1">Only show prospects without a website</p>
        </div>

        {/* Has email toggle */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-zinc-300 text-sm font-medium">Has email</span>
            <button
              onClick={() => setFilters({ hasEmail: !filters.hasEmail })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                filters.hasEmail ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                filters.hasEmail ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </label>
        </div>

        {/* Category multi-select */}
        <div>
          <p className="text-zinc-300 text-sm font-medium mb-2">Category</p>
          <div className="space-y-1">
            {ALL_CATEGORIES.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  filters.categories.includes(cat) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 bg-transparent'
                }`}>
                  {filters.categories.includes(cat) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                <span className="text-zinc-300 text-xs">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Min rating slider */}
        <div>
          <div className="flex justify-between">
            <p className="text-zinc-300 text-sm font-medium">Min rating</p>
            <span className="text-zinc-400 text-xs">{filters.minRating.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={filters.minRating}
            onChange={e => setFilters({ minRating: parseFloat(e.target.value) })}
            className="w-full mt-2 accent-emerald-500"
          />
        </div>

        {/* Min reviews slider */}
        <div>
          <div className="flex justify-between">
            <p className="text-zinc-300 text-sm font-medium">Min reviews</p>
            <span className="text-zinc-400 text-xs">{filters.minReviews}</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={filters.minReviews}
            onChange={e => setFilters({ minReviews: parseInt(e.target.value) })}
            className="w-full mt-2 accent-emerald-500"
          />
        </div>

        {/* City multi-select */}
        <div>
          <p className="text-zinc-300 text-sm font-medium mb-2">City</p>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {allCities.map(city => (
              <label key={city} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.cities.includes(city)}
                  onChange={() => toggleCity(city)}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  filters.cities.includes(city) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 bg-transparent'
                }`}>
                  {filters.cities.includes(city) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-zinc-300 text-xs">{city}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ZIP multi-select */}
        <div>
          <p className="text-zinc-300 text-sm font-medium mb-2">ZIP code</p>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {allZips.map(zip => (
              <label key={zip} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.postalCodes.includes(zip)}
                  onChange={() => toggleZip(zip)}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  filters.postalCodes.includes(zip) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 bg-transparent'
                }`}>
                  {filters.postalCodes.includes(zip) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-zinc-300 text-xs">{zip}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
