export interface Prospect {
  place_id: string
  name: string
  category: string
  subtypes: string[]
  address: string
  city: string
  state: string
  postal_code: string
  lat: number
  lng: number
  phone: string
  email: string
  website: string
  rating: number
  reviews: number
  working_hours: Record<string, string>
  photos: string[]
  logo: string
  description: string
  booking_appointment_link: string
  owner_title: string
  instagram: string
  facebook: string
}
