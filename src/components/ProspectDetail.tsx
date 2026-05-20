import { useState, useCallback } from 'react'
import { useStore } from '../lib/store'
import { markVisited, getVisit } from '../lib/store'
import type { Outcome } from '../lib/store'
import { formatPhone, getTodayKey, normalizeCategory } from '../lib/utils'

const TEMPLATE_URLS: Record<string, string> = {
  'Pet groomer':    'https://client-site-template.pogan-93.workers.dev',
  'Nail salon':     'https://nail-salon-template.pogan-93.workers.dev',
  'Barber shop':    'https://barberkit-pro.pogan-93.workers.dev',
  'Beauty salon':   'https://salon-pro-template.pogan-93.workers.dev',
  'Attorney':       'https://attorney-web-presence.pogan-93.workers.dev',
  'Dentist':        'https://dentist-web-presence.pogan-93.workers.dev',
}

function encodeProspectForUrl(p: import('../types/prospect').Prospect): string {
  const slim = {
    place_id: p.place_id, name: p.name, category: p.category, subtypes: p.subtypes,
    address: p.address, city: p.city, state: p.state, postal_code: p.postal_code,
    lat: p.lat, lng: p.lng, phone: p.phone, email: p.email, website: p.website,
    rating: p.rating, reviews: p.reviews, working_hours: p.working_hours,
    photos: p.photos.slice(0, 2), logo: p.logo, description: p.description,
    booking_appointment_link: p.booking_appointment_link, owner_title: p.owner_title,
    instagram: p.instagram, facebook: p.facebook,
  }
  // UTF-8-safe base64
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim))))
}

function getPreviewUrl(p: import('../types/prospect').Prospect): string {
  const canonical = normalizeCategory(p.category)
  const base = TEMPLATE_URLS[canonical] ?? 'https://client-site-template.pages.dev'
  return `${base}?pd=${encodeProspectForUrl(p)}`
}

export function ProspectDetail() {
  const { selectedProspect: p, setSelectedProspect } = useStore()
  const [photoIdx, setPhotoIdx] = useState(0)
  const [, forceUpdate] = useState(0)

  const handleOutcome = useCallback((outcome: Outcome) => {
    if (!p) return
    markVisited(p.place_id, outcome)
    forceUpdate(n => n + 1)
  }, [p])

  if (!p) {
    return (
      <aside className="w-80 flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex items-center justify-center">
        <p className="text-zinc-500 text-sm text-center px-6">Click a pin on the map to see prospect details</p>
      </aside>
    )
  }

  const visit = getVisit(p.place_id)
  const todayKey = getTodayKey()
  const todayHours = p.working_hours[todayKey] ?? p.working_hours[todayKey.slice(0, 3)] ?? 'Unknown'

  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(p.address)}`
  const callUrl = `tel:${p.phone.replace(/\D/g, '')}`
  const previewUrl = getPreviewUrl(p)

  const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating))

  return (
    <aside className="w-80 flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-white font-semibold text-sm leading-tight truncate">{p.name}</h2>
          <p className="text-zinc-400 text-xs mt-0.5 truncate">{p.category}</p>
        </div>
        <button
          onClick={() => setSelectedProspect(null)}
          className="text-zinc-500 hover:text-white flex-shrink-0 mt-0.5"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Photo carousel */}
      {p.photos.length > 0 && (
        <div className="relative bg-zinc-800 aspect-video">
          <img
            src={p.photos[photoIdx]}
            alt={p.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = '' }}
          />
          {p.photos.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {p.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
          {p.photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx(i => (i - 1 + p.photos.length) % p.photos.length)}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded p-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => setPhotoIdx(i => (i + 1) % p.photos.length)}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded p-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Rating */}
        {p.rating > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-sm">{stars}</span>
            <span className="text-zinc-300 text-sm font-medium">{p.rating.toFixed(1)}</span>
            <span className="text-zinc-500 text-xs">({p.reviews.toLocaleString()} reviews)</span>
          </div>
        )}

        {/* Description */}
        {p.description && (
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">{p.description}</p>
        )}

        {/* Address */}
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Address</p>
          <p className="text-zinc-300 text-xs">{p.address}</p>
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-400 hover:text-emerald-300"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open in Apple Maps
          </a>
        </div>

        {/* Today's hours */}
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Hours</p>
          <div className="space-y-0.5">
            {Object.entries(p.working_hours).map(([day, hours]) => (
              <div key={day} className={`flex justify-between text-xs ${day === todayKey ? 'text-white font-medium' : 'text-zinc-400'}`}>
                <span className={day === todayKey ? 'text-emerald-400' : ''}>{day.slice(0, 3)}</span>
                <span>{hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone */}
        {p.phone && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Phone</p>
            <a
              href={callUrl}
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              {formatPhone(p.phone)}
            </a>
          </div>
        )}

        {/* Email */}
        {p.email && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Email</p>
            <a
              href={`mailto:${p.email}`}
              className="text-zinc-300 text-xs hover:text-white break-all"
            >
              {p.email}
            </a>
          </div>
        )}

        {/* Owner */}
        {p.owner_title && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Owner</p>
            <p className="text-zinc-300 text-xs">{p.owner_title}</p>
          </div>
        )}

        {/* Social */}
        {(p.instagram || p.facebook) && (
          <div className="flex gap-3">
            {p.instagram && (
              <a href={p.instagram} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-pink-400 text-xs">Instagram</a>
            )}
            {p.facebook && (
              <a href={p.facebook} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 text-xs">Facebook</a>
            )}
          </div>
        )}

        {/* Booking */}
        {p.booking_appointment_link && (
          <a
            href={p.booking_appointment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-zinc-300 border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-500 hover:text-white"
          >
            View existing booking page
          </a>
        )}

        {/* Status buttons */}
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Visit outcome</p>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { key: 'interested', label: 'Interested ✓', active: 'bg-emerald-700 border-emerald-600 text-emerald-100', inactive: 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-emerald-700 hover:text-emerald-400' },
              { key: 'closed', label: 'Closed Deal ★', active: 'bg-yellow-700 border-yellow-600 text-yellow-100', inactive: 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-yellow-600 hover:text-yellow-400' },
              { key: 'not_now', label: 'Not Now', active: 'bg-zinc-600 border-zinc-500 text-zinc-100', inactive: 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300' },
              { key: 'no_answer', label: 'No Answer', active: 'bg-zinc-700 border-zinc-600 text-zinc-300', inactive: 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400' },
            ] as { key: Outcome; label: string; active: string; inactive: string }[]).map(({ key, label, active, inactive }) => (
              <button
                key={key}
                onClick={() => handleOutcome(key)}
                className={`text-xs border rounded px-2 py-1.5 transition-colors text-center ${visit?.outcome === key ? active : inactive}`}
              >
                {label}
              </button>
            ))}
          </div>
          {visit && (
            <p className="text-zinc-600 text-xs mt-1">
              Visited {new Date(visit.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Preview button */}
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-2 transition-colors"
        >
          Open client site preview
        </a>

        {/* Website indicator */}
        {p.website && (
          <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-800/50 rounded px-2 py-1.5">
            <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-amber-400 text-xs">Has existing website</span>
          </div>
        )}
      </div>
    </aside>
  )
}
