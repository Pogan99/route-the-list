import { useEffect } from 'react'
import { FilterRail } from './components/FilterRail'
import { ProspectMap } from './components/ProspectMap'
import { ProspectDetail } from './components/ProspectDetail'
import { useStore } from './lib/store'
import type { Prospect } from './types/prospect'

export default function App() {
  const { setProspects } = useStore()

  useEffect(() => {
    fetch('/prospects.json')
      .then(r => r.json())
      .then((data: Prospect[]) => setProspects(data))
      .catch(err => console.error('Failed to load prospects:', err))
  }, [setProspects])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-white">
      <FilterRail />
      <ProspectMap />
      <ProspectDetail />
    </div>
  )
}
