import { useState, useCallback, useRef, useEffect } from 'react'
import maplibregl from 'maplibre-gl'
import { kMeans, nearestNeighborTSP, haversineKm } from '../lib/cluster'
import { useStore, useFilteredProspects, markVisited, getVisit, clearToday, getAllVisits } from '../lib/store'
import type { Outcome } from '../lib/store'
import type { Prospect } from '../types/prospect'

// Default Jacksonville city hall as fallback start
const JAX_LAT = 30.3322
const JAX_LNG = -81.6557

interface RouteBuilderProps {
  mapRef: React.MutableRefObject<maplibregl.Map | null>
}

function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
  return fetch(url)
    .then(r => r.json())
    .then(data => {
      if (!data || data.length === 0) throw new Error('Address not found')
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    })
}

export function RouteBuilder({ mapRef }: RouteBuilderProps) {
  const [open, setOpen] = useState(false)
  const [startAddress, setStartAddress] = useState('')
  const [targetStops, setTargetStops] = useState(20)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [, forceUpdate] = useState(0)

  const filtered = useFilteredProspects()
  const { prospects, activeRoute, setActiveRoute, setSelectedProspect } = useStore()

  // Map of place_id -> Prospect for quick lookup
  const prospectMap = useRef<Map<string, Prospect>>(new Map())
  useEffect(() => {
    prospectMap.current = new Map(prospects.map(p => [p.place_id, p]))
  }, [prospects])

  const routeProspects: Prospect[] = activeRoute
    .map(id => prospectMap.current.get(id))
    .filter(Boolean) as Prospect[]

  // Draw/remove polyline on map
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const SOURCE_ID = 'route-line'
    const LAYER_ID = 'route-line-layer'

    function addRoute() {
      if (!map) return
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)

      if (routeProspects.length < 2) return

      const coords = routeProspects.map(p => [p.lng, p.lat])
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      })
      map.addLayer({
        id: LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#10b981', 'line-width': 3, 'line-opacity': 0.85 },
      })
    }

    if (map.loaded()) {
      addRoute()
    } else {
      map.once('load', addRoute)
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch { /* map may have been destroyed */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoute, mapRef])

  const buildRoute = useCallback(async () => {
    setError('')
    if (filtered.length === 0) { setError('No prospects match current filters.'); return }

    setBuilding(true)
    try {
      let startLat = JAX_LAT
      let startLng = JAX_LNG

      if (startAddress.trim()) {
        try {
          const geo = await geocodeAddress(startAddress.trim())
          startLat = geo.lat
          startLng = geo.lng
        } catch {
          setError('Could not geocode address, using Jacksonville center.')
        }
      } else {
        // Try browser geolocation
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
          )
          startLat = pos.coords.latitude
          startLng = pos.coords.longitude
        } catch {
          // fall through to JAX default
        }
      }

      const points = filtered.map(p => ({ lat: p.lat, lng: p.lng, id: p.place_id }))
      const k = Math.max(1, Math.ceil(filtered.length / targetStops))
      const clusters = kMeans(points, k)

      // Pick cluster whose centroid is closest to start
      let bestCluster: string[] = clusters[0]
      let bestDist = Infinity
      for (const cluster of clusters) {
        const clusterPts = cluster.map(id => points.find(p => p.id === id)!).filter(Boolean)
        const centLat = clusterPts.reduce((s, p) => s + p.lat, 0) / clusterPts.length
        const centLng = clusterPts.reduce((s, p) => s + p.lng, 0) / clusterPts.length
        const d = haversineKm(startLat, startLng, centLat, centLng)
        if (d < bestDist) { bestDist = d; bestCluster = cluster }
      }

      const clusterPts = bestCluster.map(id => points.find(p => p.id === id)!).filter(Boolean)
      const ordered = nearestNeighborTSP(clusterPts, startLat, startLng)
      setActiveRoute(ordered)
      setOpen(false)
    } finally {
      setBuilding(false)
    }
  }, [filtered, startAddress, targetStops, setActiveRoute])

  const useMyLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setStartAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => setError('Location access denied.')
    )
  }, [])

  function exportRoute() {
    if (routeProspects.length === 0) return

    // Clipboard plain text
    const text = routeProspects
      .map((p, i) => `${i + 1}. ${p.name} — ${p.address}`)
      .join('\n')
    navigator.clipboard.writeText(text).catch(() => {})

    // CSV download
    const header = 'order,name,address,phone,email,category,place_id'
    const rows = routeProspects.map((p, i) =>
      [i + 1, `"${p.name.replace(/"/g, '""')}"`, `"${p.address.replace(/"/g, '""')}"`, p.phone, p.email, p.category, p.place_id].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `route-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportSummaryCSV() {
    const visits = getAllVisits()
    const header = 'order,name,address,phone,email,category,place_id,visited_at,outcome,notes'
    const rows = routeProspects.map((p, i) => {
      const v = visits.find(vv => vv.placeId === p.place_id)
      return [
        i + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.address.replace(/"/g, '""')}"`,
        p.phone,
        p.email,
        p.category,
        p.place_id,
        v?.visitedAt ?? '',
        v?.outcome ?? '',
        `"${(v?.notes ?? '').replace(/"/g, '""')}"`,
      ].join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `outcomes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const visits = getAllVisits()
  const visitedCount = routeProspects.filter(p => visits.some(v => v.placeId === p.place_id)).length

  return (
    <>
      {/* Header badge + button strip */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <button
          onClick={() => setOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded shadow-lg transition-colors"
        >
          Build Today's Route
        </button>

        {activeRoute.length > 0 && (
          <>
            <button
              onClick={() => setSummaryOpen(true)}
              className="bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-medium px-3 py-1.5 rounded shadow-lg transition-colors"
            >
              {visitedCount} / {routeProspects.length} visited
            </button>
            <button
              onClick={exportRoute}
              className="bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-medium px-3 py-1.5 rounded shadow-lg transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => { setActiveRoute([]); clearToday() }}
              className="bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-xs font-medium px-3 py-1.5 rounded shadow-lg transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Route stop list — bottom panel */}
      {activeRoute.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 z-10 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 sticky top-0 bg-zinc-900">
            <p className="text-white text-xs font-semibold">Route — {routeProspects.length} stops</p>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {routeProspects.map((p, i) => {
              const visit = getVisit(p.place_id)
              const prevP = i > 0 ? routeProspects[i - 1] : null
              const distKm = prevP ? haversineKm(prevP.lat, prevP.lng, p.lat, p.lng) : null

              return (
                <div key={p.place_id} className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/50">
                  <span className="text-zinc-500 text-xs w-5 text-right flex-shrink-0">{i + 1}</span>
                  <button
                    onClick={() => {
                      markVisited(p.place_id)
                      forceUpdate(n => n + 1)
                    }}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      visit ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}
                    title="Mark visited"
                  >
                    {visit && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => setSelectedProspect(p)}
                  >
                    <p className="text-zinc-200 text-xs font-medium truncate">{p.name}</p>
                    <p className="text-zinc-500 text-xs truncate">{p.address}</p>
                  </button>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {distKm !== null && (
                      <span className="text-zinc-600 text-xs">{distKm.toFixed(1)} km</span>
                    )}
                    {visit?.outcome && (
                      <OutcomeBadge outcome={visit.outcome} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Build modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-semibold text-sm mb-4">Build Today's Route</h2>

            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wide">Start address</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={startAddress}
                    onChange={e => setStartAddress(e.target.value)}
                    placeholder="e.g. 220 Riverside Ave, Jacksonville FL"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={useMyLocation}
                    className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs px-2 py-1.5 rounded transition-colors flex-shrink-0"
                    title="Use my location"
                  >
                    GPS
                  </button>
                </div>
                <p className="text-zinc-600 text-xs mt-1">Leave blank to use browser location or Jacksonville center.</p>
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="text-zinc-400 text-xs uppercase tracking-wide">Target stops</label>
                  <span className="text-zinc-300 text-xs font-medium">{targetStops}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={30}
                  value={targetStops}
                  onChange={e => setTargetStops(parseInt(e.target.value))}
                  className="w-full mt-1 accent-emerald-500"
                />
              </div>

              <div className="text-zinc-500 text-xs">
                {filtered.length} filtered prospects → picks best cluster of ~{targetStops}
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={buildRoute}
                disabled={building}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded transition-colors"
              >
                {building ? 'Building…' : 'Build Route'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today summary drawer */}
      {summaryOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={() => setSummaryOpen(false)}>
          <div className="bg-zinc-900 border-t border-zinc-700 w-full max-w-2xl rounded-t-lg p-5 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">Today's Summary — {visitedCount}/{routeProspects.length} stops</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportSummaryCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                >
                  Download CSV
                </button>
                <button onClick={() => setSummaryOpen(false)} className="text-zinc-500 hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {routeProspects.map((p, i) => {
                const v = visits.find(vv => vv.placeId === p.place_id)
                return (
                  <div key={p.place_id} className="flex items-center gap-3 bg-zinc-800/50 rounded px-3 py-2">
                    <span className="text-zinc-500 text-xs w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 text-xs font-medium truncate">{p.name}</p>
                      <p className="text-zinc-500 text-xs truncate">{p.address}</p>
                    </div>
                    {v?.outcome ? (
                      <OutcomeBadge outcome={v.outcome} />
                    ) : (
                      <span className="text-zinc-600 text-xs">not visited</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const map: Record<Outcome, { label: string; cls: string }> = {
    interested: { label: 'Interested', cls: 'bg-emerald-900/60 text-emerald-400 border-emerald-800' },
    closed: { label: 'Closed', cls: 'bg-yellow-900/60 text-yellow-400 border-yellow-800' },
    not_now: { label: 'Not now', cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
    no_answer: { label: 'No answer', cls: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
  }
  const { label, cls } = map[outcome]
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>
  )
}
