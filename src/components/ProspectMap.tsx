import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useStore, useFilteredProspects } from '../lib/store'
import { categoryColor } from '../lib/utils'
import type { Prospect } from '../types/prospect'

// Jacksonville, FL center
const JAX_CENTER: [number, number] = [-81.655, 30.332]

interface ProspectMapProps {
  mapRef: React.MutableRefObject<maplibregl.Map | null>
}

export function ProspectMap({ mapRef }: ProspectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const filtered = useFilteredProspects()
  const { setSelectedProspect, selectedProspect } = useStore()

  // Init map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxzoom: 19,
          },
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
      },
      center: JAX_CENTER,
      zoom: 11,
    })

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when filtered prospects change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    filtered.forEach((prospect: Prospect) => {
      const el = document.createElement('div')
      const color = categoryColor(prospect.category)
      const isSelected = selectedProspect?.place_id === prospect.place_id

      const size = isSelected ? '20px' : '14px'
      el.style.cssText = `
        width: ${size};
        height: ${size};
        border-radius: 50%;
        background-color: ${color};
        border: ${isSelected ? '3px solid white' : '2px solid rgba(0,0,0,0.3)'};
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.5);
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
        position: relative;
        z-index: 1;
      `
      el.title = prospect.name

      // Use box-shadow glow on hover instead of transform scale.
      // transform: scale() shrinks the CSS hit-area, causing a flicker loop
      // where mouseenter → scale → cursor exits hit-area → mouseleave → repeat.
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = `0 0 0 4px ${color}55, 0 2px 8px rgba(0,0,0,0.6)`
        el.style.borderColor = 'white'
        el.style.zIndex = '10'
      })
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.5)'
        el.style.borderColor = isSelected ? 'white' : 'rgba(0,0,0,0.3)'
        el.style.zIndex = '1'
      })

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedProspect(prospect)
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([prospect.lng, prospect.lat])
        .addTo(map)

      markersRef.current.push(marker)
    })
  }, [filtered, selectedProspect, setSelectedProspect, mapRef])

  // Fly to selected prospect
  useEffect(() => {
    if (!selectedProspect || !mapRef.current) return
    mapRef.current.flyTo({
      center: [selectedProspect.lng, selectedProspect.lat],
      zoom: 15,
      duration: 600,
    })
  }, [selectedProspect, mapRef])

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {filtered.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900/80 text-zinc-300 text-sm px-4 py-2 rounded">
            No prospects match current filters
          </div>
        </div>
      )}
    </div>
  )
}
