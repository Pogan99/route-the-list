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

export function categoryColor(category: string): string {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return color
  }
  return '#6b7280'
}
