import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { FilterRail } from './components/FilterRail'
import { ProspectMap } from './components/ProspectMap'
import { ProspectDetail } from './components/ProspectDetail'
import { RouteBuilder } from './components/RouteBuilder'
import { useStore } from './lib/store'
import type { Prospect } from './types/prospect'

export default function App() {
  const { setProspects } = useStore()
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    fetch('/prospects.json')
      .then(r => r.json())
      .then((data: Prospect[]) => setProspects(data))
      .catch(err => console.error('Failed to load prospects:', err))
  }, [setProspects])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-white">
      <FilterRail />
      <div className="flex-1 relative overflow-hidden">
        <ProspectMap mapRef={mapRef} />
        <RouteBuilder mapRef={mapRef} />
      </div>
      <ProspectDetail />
    </div>
  )
}
