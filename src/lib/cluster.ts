export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type Point = { lat: number; lng: number; id: string }

export function kMeans(points: Point[], k: number): string[][] {
  if (points.length === 0 || k <= 0) return []
  k = Math.min(k, points.length)

  // Initialize centroids by picking k evenly-spaced points
  const step = Math.floor(points.length / k)
  let centroids = Array.from({ length: k }, (_, i) => ({
    lat: points[i * step].lat,
    lng: points[i * step].lng,
  }))

  let assignments: number[] = new Array(points.length).fill(0)

  for (let iter = 0; iter < 10; iter++) {
    // Assign each point to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let best = 0
      let bestDist = Infinity
      for (let c = 0; c < k; c++) {
        const d =
          (points[i].lat - centroids[c].lat) ** 2 + (points[i].lng - centroids[c].lng) ** 2
        if (d < bestDist) {
          bestDist = d
          best = c
        }
      }
      assignments[i] = best
    }

    // Recompute centroids
    const sums = Array.from({ length: k }, () => ({ lat: 0, lng: 0, count: 0 }))
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i]
      sums[c].lat += points[i].lat
      sums[c].lng += points[i].lng
      sums[c].count += 1
    }
    for (let c = 0; c < k; c++) {
      if (sums[c].count > 0) {
        centroids[c] = { lat: sums[c].lat / sums[c].count, lng: sums[c].lng / sums[c].count }
      }
    }
  }

  // Build clusters
  const clusters: string[][] = Array.from({ length: k }, () => [])
  for (let i = 0; i < points.length; i++) {
    clusters[assignments[i]].push(points[i].id)
  }
  return clusters.filter(c => c.length > 0)
}

export function nearestNeighborTSP(points: Point[], startLat: number, startLng: number): string[] {
  if (points.length === 0) return []
  const remaining = [...points]
  const ordered: string[] = []
  let curLat = startLat
  let curLng = startLng

  while (remaining.length > 0) {
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(curLat, curLng, remaining[i].lat, remaining[i].lng)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    const next = remaining.splice(bestIdx, 1)[0]
    ordered.push(next.id)
    curLat = next.lat
    curLng = next.lng
  }

  return ordered
}
