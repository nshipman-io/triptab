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

// Checklist types
export type ChecklistType = 'packing' | 'todo' | 'shopping'

export interface ChecklistItem {
  id: string
  checklist_id: string
  content: string
  is_completed: boolean
  assigned_to_id?: string
  order: number
  created_at: string
  updated_at: string
}

export interface Checklist {
  id: string
  trip_id: string
  name: string
  type: ChecklistType
  created_by_id: string
  order: number
  created_at: string
  updated_at: string
  items: ChecklistItem[]
}

// Expense types
export type ExpenseCategory = 'food' | 'transport' | 'lodging' | 'activity' | 'shopping' | 'other'
export type SplitType = 'equal' | 'percentage'

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  percentage?: number
  is_settled: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  trip_id: string
  description: string
  amount: number
  currency: string
  category: ExpenseCategory
  paid_by_id: string
  split_type: SplitType
  expense_date: string
  receipt_url?: string
  notes?: string
  created_at: string
  updated_at: string
  splits: ExpenseSplit[]
}

export interface UserBalance {
  user_id: string
  user_name: string
  total_paid: number
  total_owed: number
  net_balance: number
}

export interface ExpenseSummary {
  total_expenses: number
  expense_count: number
  balances: UserBalance[]
}

export interface Settlement {
  from_user_id: string
  from_user_name: string
  to_user_id: string
  to_user_name: string
  amount: number
}

export interface SettlementPlan {
  settlements: Settlement[]
  total_transactions: number
}

// Import types
export interface ParsedReservation {
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'restaurant'
  title: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  location?: string
  confirmation_number?: string
  flight_details?: {
    airline?: string
    flight_number?: string
    departure_airport?: string
    arrival_airport?: string
    cabin_class?: string
  }
  hotel_details?: {
    hotel_name?: string
    address?: string
    room_type?: string
    check_in_time?: string
    check_out_time?: string
  }
  notes?: string
  confidence: number
}

export interface ImportLog {
  id: string
  trip_id: string
  user_id: string
  source: 'email_paste' | 'email_forward'
  status: 'pending' | 'success' | 'partial' | 'failed'
  error_message?: string
  created_items?: string[]
  created_at: string
}

// Recommendation types
export interface Location {
  lat: number
  lng: number
  address?: string
}

export interface Recommendation {
  name: string
  category: string
  description: string
  why_recommended: string
  estimated_cost?: string
  duration?: string
  location?: Location
  rating?: number
  tags: string[]
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

// Guide types
export type GuideVisibility = 'public' | 'private' | 'unlisted'

export interface GuideAuthor {
  id: string
  name: string
  avatar_url?: string
}

export interface GuidePlace {
  id: string
  section_id: string
  name: string
  description?: string
  category?: string
  address?: string
  latitude?: number
  longitude?: number
  place_id?: string
  place_data?: Record<string, unknown>
  notes?: string
  tips?: string
  price_range?: string
  photo_url?: string
  order: number
  created_at: string
  updated_at: string
}

export interface GuideSection {
  id: string
  guide_id: string
  title: string
  description?: string
  order: number
  created_at: string
  updated_at: string
  places: GuidePlace[]
}

export interface Guide {
  id: string
  title: string
  description?: string
  destination: string
  cover_image_url?: string
  visibility: GuideVisibility
  share_code: string
  view_count: number
  tags: string[]
  author_id: string
  author: GuideAuthor
  created_at: string
  updated_at: string
  sections: GuideSection[]
}

export interface GuideSummary {
  id: string
  title: string
  description?: string
  destination: string
  cover_image_url?: string
  visibility: GuideVisibility
  view_count: number
  tags: string[]
  author: GuideAuthor
  created_at: string
  updated_at: string
}
