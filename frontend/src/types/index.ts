// User types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

// Trip planning questionnaire types
export type TravelType = 'solo' | 'couple' | 'friends' | 'family'
export type BudgetRange = 'budget' | 'moderate' | 'luxury'
export type ActivityPreference = 'adventure' | 'relaxation' | 'culture' | 'food' | 'nature' | 'nightlife'

export interface TripPreferences {
  travel_type: TravelType
  destination?: string
  start_date: string
  end_date: string
  budget_range: BudgetRange
  activities: ActivityPreference[]
  num_travelers: number
  special_requirements?: string
}

// Trip types
export interface Trip {
  id: string
  name: string
  description?: string
  destination: string
  start_date: string
  end_date: string
  preferences: TripPreferences
  share_code: string
  owner_id: string
  created_at: string
  updated_at: string
}

// Itinerary item types
export type ItineraryItemType = 'flight' | 'hotel' | 'experience' | 'restaurant' | 'transport'

export interface ItineraryItem {
  id: string
  trip_id: string
  type: ItineraryItemType
  title: string
  description?: string
  location?: string
  start_time: string
  end_time?: string
  price?: number
  currency?: string
  booking_url?: string
  booking_confirmed: boolean
  notes?: string
  order: number
}

// Trip member types
export type MemberRole = 'owner' | 'editor' | 'viewer'
export type MemberStatus = 'pending' | 'accepted' | 'declined'

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  user: User
  role: MemberRole
  status: MemberStatus
  tickets_confirmed: boolean
  joined_at: string
}

// API response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}
