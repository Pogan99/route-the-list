import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useStore, useFilteredProspects } from '../lib/store'
import { CATEGORY_COLORS, normalizeCategory } from '../lib/utils'
import type { Prospect } from '../types/prospect'

const JAX_CENTER: [number, number] = [-81.655, 30.332]

const SOURCE_ID = 'prospects'
const CIRCLE_LAYER = 'prospect-circles'
const SELECTED_LAYER = 'prospect-selected'

interface ProspectMapProps {
  mapRef: React.MutableRefObject<maplibregl.Map | null>
}

function prospectsToGeoJSON(
  prospects: Prospect[],
  selectedId: string | null,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: prospects.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        place_id: p.place_id,
        name: p.name,
        category: p.category,
        color: CATEGORY_COLORS[normalizeCategory(p.category)] ?? '#6b7280',
        selected: p.place_id === selectedId ? 1 : 0,
      },
    })),
  }
}

export function ProspectMap({ mapRef }: ProspectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const filtered = useFilteredProspects()
  const { setSelectedProspect, selectedProspect, prospects } = useStore()

  // Map init — runs once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
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

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      // Add GeoJSON source (empty initially)
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // All circles
      map.addLayer({
        id: CIRCLE_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'selected'], 0],
        paint: {
          'circle-radius': 7,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(0,0,0,0.35)',
          'circle-opacity': 0.9,
        },
      })

      // Selected circle — larger ring on top
      map.addLayer({
        id: SELECTED_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'selected'], 1],
        paint: {
          'circle-radius': 11,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1,
        },
      })

      // Cursor + tooltip
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })

      map.on('mouseenter', CIRCLE_LAYER, (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0]
        if (f) {
          popup.setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
            .setHTML(`<span style="font-size:12px;font-weight:600">${f.properties?.name}</span>`)
            .addTo(map)
        }
      })
      map.on('mouseleave', CIRCLE_LAYER, () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('mouseenter', SELECTED_LAYER, (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0]
        if (f) {
          popup.setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
            .setHTML(`<span style="font-size:12px;font-weight:600">${f.properties?.name}</span>`)
            .addTo(map)
        }
      })
      map.on('mouseleave', SELECTED_LAYER, () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })

      // Click to select
      map.on('click', CIRCLE_LAYER, (e) => {
        const placeId = e.features?.[0]?.properties?.place_id
        if (!placeId) return
        // Access store directly via the stable ref pattern
        const p = (map as unknown as { _prospects?: Prospect[] })._prospects?.find(x => x.place_id === placeId)
        if (p) setSelectedProspect(p)
      })
      map.on('click', SELECTED_LAYER, (e) => {
        const placeId = e.features?.[0]?.properties?.place_id
        if (!placeId) return
        const p = (map as unknown as { _prospects?: Prospect[] })._prospects?.find(x => x.place_id === placeId)
        if (p) setSelectedProspect(p)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep a lookup table on the map instance so click handlers can find prospects
  useEffect(() => {
    if (!mapRef.current) return
    ;(mapRef.current as unknown as { _prospects?: Prospect[] })._prospects = prospects
  }, [prospects, mapRef])

  // Update GeoJSON when filtered prospects or selection changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const update = () => {
      const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (!src) return
      src.setData(prospectsToGeoJSON(filtered, selectedProspect?.place_id ?? null))
    }

    if (map.isStyleLoaded()) {
      update()
    } else {
      map.once('load', update)
    }
  }, [filtered, selectedProspect, mapRef])

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
