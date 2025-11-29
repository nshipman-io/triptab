/**
 * Affiliate link generators for flights, hotels, and experiences
 * These generate deep links to booking sites with pre-filled search parameters
 */

import { findAirportForDestination } from './airports'

interface FlightSearchParams {
  originCode?: string      // IATA airport code for origin
  destinationCode?: string // IATA airport code for destination
  destination?: string     // Fallback: destination city name (will try to find airport)
  departDate: string
  returnDate?: string
  adults?: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
}

interface HotelSearchParams {
  destination: string
  checkIn: string
  checkOut: string
  guests?: number
  rooms?: number
}

interface ExperienceSearchParams {
  destination: string
  date?: string
}

/**
 * Parse date string without timezone conversion
 * Handles both "YYYY-MM-DD" and ISO datetime strings
 */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  // If it's an ISO datetime, extract just the date part
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  return { year, month, day }
}

/**
 * Format date to YYYY-MM-DD for most sites
 */
function formatDateISO(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr)
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

/**
 * Format date to YYMMDD for Skyscanner
 */
function formatDateSkyscanner(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr)
  const yy = year.toString().slice(-2)
  const mm = month.toString().padStart(2, '0')
  const dd = day.toString().padStart(2, '0')
  return `${yy}${mm}${dd}`
}

/**
 * Encode destination for URL (handle spaces and special chars)
 */
function encodeDestination(destination: string): string {
  // Extract city name (before comma if present)
  const city = destination.split(',')[0].trim()
  return encodeURIComponent(city)
}

// ============ FLIGHT AFFILIATES ============

/**
 * Helper to get destination airport code
 */
function getDestinationCode(params: FlightSearchParams): string | null {
  if (params.destinationCode) return params.destinationCode.toUpperCase()
  if (params.destination) {
    const airport = findAirportForDestination(params.destination)
    return airport?.code || null
  }
  return null
}

/**
 * Skyscanner flight search
 * Format: /transport/flights/{origin}/{destination}/{outDate}/{inDate}/
 * Example: /transport/flights/nyca/cun/251203/251210/
 */
export function getSkyscannerFlightUrl(params: FlightSearchParams): string {
  const { originCode, departDate, returnDate, adults = 1 } = params
  const destCode = getDestinationCode(params)

  if (!destCode) {
    // Fallback to search page if no airport code found
    const dest = params.destination ? encodeDestination(params.destination) : ''
    return `https://www.skyscanner.com/transport/flights?query=flights+to+${dest}`
  }

  const origin = originCode?.toLowerCase() || 'nyca' // Default to NYC area
  const dest = destCode.toLowerCase()
  const depart = formatDateSkyscanner(departDate)

  let url = `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${depart}/`

  if (returnDate) {
    url += `${formatDateSkyscanner(returnDate)}/`
  }

  url += `?adultsv2=${adults}&cabinclass=economy&childrenv2=&ref=home&rtn=${returnDate ? '1' : '0'}&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`

  return url
}

/**
 * Google Flights search
 * Uses natural language query format which Google Flights parses reliably
 * Example: "Flights from NYC to CUN on 2024-12-15 through 2024-12-18"
 */
export function getGoogleFlightsUrl(params: FlightSearchParams): string {
  const { originCode, departDate, returnDate } = params
  const destCode = getDestinationCode(params)

  // Build natural language query that Google Flights understands
  let query = 'Flights'

  if (originCode) {
    query += ` from ${originCode.toUpperCase()}`
  }

  if (destCode) {
    query += ` to ${destCode.toUpperCase()}`
  } else if (params.destination) {
    // Fallback to destination name if no airport code found
    const dest = params.destination.split(',')[0].trim()
    query += ` to ${dest}`
  }

  // Add dates in YYYY-MM-DD format
  query += ` on ${formatDateISO(departDate)}`
  if (returnDate) {
    query += ` through ${formatDateISO(returnDate)}`
  }

  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`
}

/**
 * Kayak flight search
 * Format: /flights/{origin}-{dest}/{date}/{returnDate}/{adults}adults
 */
export function getKayakFlightUrl(params: FlightSearchParams): string {
  const { originCode, departDate, returnDate, adults = 1 } = params
  const destCode = getDestinationCode(params)

  if (!destCode) {
    // Fallback to explore
    const dest = params.destination ? encodeDestination(params.destination) : ''
    return `https://www.kayak.com/explore?destination=${dest}`
  }

  const origin = originCode?.toUpperCase() || 'NYC' // Default to NYC
  const dest = destCode.toUpperCase()
  const depart = formatDateISO(departDate)

  let url = `https://www.kayak.com/flights/${origin}-${dest}/${depart}`

  if (returnDate) {
    url += `/${formatDateISO(returnDate)}`
  }

  url += `/${adults}adults?sort=bestflight_a`

  return url
}

// ============ HOTEL AFFILIATES ============

/**
 * Booking.com hotel search
 * Popular affiliate program (25-40% commission)
 * URL format: /searchresults.html?ss={destination}&checkin={date}&checkout={date}
 */
export function getBookingComUrl(params: HotelSearchParams): string {
  const { destination, checkIn, checkOut, guests = 2, rooms = 1 } = params
  // Extract city name only
  const dest = destination.split(',')[0].trim()
  const checkinDate = formatDateISO(checkIn)
  const checkoutDate = formatDateISO(checkOut)

  // Build URL manually to avoid encoding issues
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest)}&checkin=${checkinDate}&checkout=${checkoutDate}&group_adults=${guests}&no_rooms=${rooms}&group_children=0`
}

/**
 * Hotels.com search
 * Part of Expedia affiliate network
 * URL format: /Hotel-Search?destination={dest}&startDate={date}&endDate={date}
 */
export function getHotelsComUrl(params: HotelSearchParams): string {
  const { destination, checkIn, checkOut, guests = 2, rooms = 1 } = params
  // Extract city name only
  const dest = destination.split(',')[0].trim()
  const startDate = formatDateISO(checkIn)
  const endDate = formatDateISO(checkOut)

  // Build URL manually - Hotels.com uses both startDate/endDate and d1/d2
  return `https://www.hotels.com/Hotel-Search?destination=${encodeURIComponent(dest)}&startDate=${startDate}&endDate=${endDate}&d1=${startDate}&d2=${endDate}&adults=${guests}&rooms=${rooms}&sort=RECOMMENDED`
}

/**
 * Airbnb search
 * Good for longer stays and unique accommodations
 */
export function getAirbnbUrl(params: HotelSearchParams): string {
  const { destination, checkIn, checkOut, guests = 2 } = params
  const dest = encodeDestination(destination)

  const url = new URL('https://www.airbnb.com/s/' + dest + '/homes')
  url.searchParams.set('checkin', formatDateISO(checkIn))
  url.searchParams.set('checkout', formatDateISO(checkOut))
  url.searchParams.set('adults', guests.toString())

  return url.toString()
}

// ============ EXPERIENCE AFFILIATES ============

/**
 * Viator experiences search
 * Part of TripAdvisor, good affiliate program
 */
export function getViatorUrl(params: ExperienceSearchParams): string {
  const { destination } = params
  const dest = encodeDestination(destination)

  return `https://www.viator.com/searchResults/all?text=${dest}`
}

/**
 * GetYourGuide experiences search
 * Popular for tours and activities
 */
export function getGetYourGuideUrl(params: ExperienceSearchParams): string {
  const { destination, date } = params
  const dest = encodeDestination(destination)

  let url = `https://www.getyourguide.com/s/?q=${dest}`

  if (date) {
    url += `&date_from=${formatDateISO(date)}`
  }

  return url
}

// ============ RESTAURANT AFFILIATES ============

/**
 * OpenTable restaurant search
 */
export function getOpenTableUrl(destination: string, date?: string, partySize?: number): string {
  const dest = encodeDestination(destination)

  const url = new URL('https://www.opentable.com/s')
  url.searchParams.set('term', dest)

  if (date) {
    url.searchParams.set('dateTime', formatDateISO(date))
  }

  if (partySize) {
    url.searchParams.set('covers', partySize.toString())
  }

  return url.toString()
}

// ============ TRANSPORT AFFILIATES ============

/**
 * Rentalcars.com car rental search
 */
export function getRentalCarsUrl(destination: string, pickupDate: string, dropoffDate: string): string {
  const dest = encodeDestination(destination)
  const pickup = parseDateParts(pickupDate)
  const dropoff = parseDateParts(dropoffDate)

  const url = new URL('https://www.rentalcars.com/search-results')
  url.searchParams.set('location', dest)
  url.searchParams.set('puDay', pickup.day.toString())
  url.searchParams.set('puMonth', pickup.month.toString())
  url.searchParams.set('puYear', pickup.year.toString())
  url.searchParams.set('doDay', dropoff.day.toString())
  url.searchParams.set('doMonth', dropoff.month.toString())
  url.searchParams.set('doYear', dropoff.year.toString())

  return url.toString()
}

// ============ HELPER FUNCTIONS ============

/**
 * Get all flight search options for a trip
 */
export function getFlightSearchLinks(params: FlightSearchParams) {
  return {
    googleFlights: getGoogleFlightsUrl(params),
    kayak: getKayakFlightUrl(params),
    skyscanner: getSkyscannerFlightUrl(params),
  }
}

/**
 * Get all hotel search options for a trip
 */
export function getHotelSearchLinks(params: HotelSearchParams) {
  return {
    bookingCom: getBookingComUrl(params),
    hotelsCom: getHotelsComUrl(params),
    airbnb: getAirbnbUrl(params),
  }
}

/**
 * Get all experience search options for a destination
 */
export function getExperienceSearchLinks(params: ExperienceSearchParams) {
  return {
    viator: getViatorUrl(params),
    getYourGuide: getGetYourGuideUrl(params),
  }
}
