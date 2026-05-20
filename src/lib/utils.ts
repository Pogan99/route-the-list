import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTodayKey(): string {
  const d = new Date()
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Nail salon': '#ec4899',
  'Pet groomer': '#3b82f6',
  'Barber shop': '#f97316',
  'Beauty salon': '#a855f7',
  'Attorney': '#14b8a6',
  'Dentist': '#22c55e',
}

// Map raw Outscraper categories → canonical filter buckets
const CATEGORY_ALIASES: Array<{ patterns: string[]; canonical: string }> = [
  { patterns: ['attorney', 'lawyer', 'law firm', 'legal service', 'legal aid', 'paralegal', 'divorce', 'bankruptcy', 'injury', 'trial attorney', 'civil law', 'criminal justice', 'estate planning', 'immigration attorney', 'tax attorney', 'real estate attorney', 'notary'], canonical: 'Attorney' },
  { patterns: ['dentist', 'dental', 'orthodont', 'endodont', 'prosthodont', 'oral surgeon', 'periodont', 'teeth whitening', 'dental hygienist'], canonical: 'Dentist' },
  { patterns: ['nail salon', 'nail spa', 'manicure', 'pedicure', 'nails', 'tiệm chăm sóc móng', 'salón de manicura'], canonical: 'Nail salon' },
  { patterns: ['pet groomer', 'pet grooming', 'dog groomer', 'dog grooming', 'cat grooming', 'peluquero de mascotas', 'peluquería'], canonical: 'Pet groomer' },
  { patterns: ['barber'], canonical: 'Barber shop' },
  { patterns: ['beauty salon', 'hair salon', 'hair studio', 'beauty studio', 'hair stylist', 'centro de estética'], canonical: 'Beauty salon' },
]

export function normalizeCategory(raw: string): string {
  const lower = raw.toLowerCase()
  for (const { patterns, canonical } of CATEGORY_ALIASES) {
    if (patterns.some(p => lower.includes(p))) return canonical
  }
  return raw
}

export function categoryColor(category: string): string {
  const canonical = normalizeCategory(category)
  return CATEGORY_COLORS[canonical] ?? '#6b7280'
}
