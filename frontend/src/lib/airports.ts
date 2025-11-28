/**
 * Airport database for flight search affiliate links
 * Contains major airports with their IATA codes, cities, and countries
 */

export interface Airport {
  code: string      // IATA code (e.g., "LAX")
  name: string      // Airport name
  city: string      // City name
  country: string   // Country name
  keywords: string[] // Additional search terms
}

// Major world airports - sorted by passenger traffic and popular destinations
export const airports: Airport[] = [
  // United States
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'United States', keywords: ['georgia'] },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', keywords: ['la', 'california', 'hollywood'] },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'United States', keywords: ['illinois'] },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States', keywords: ['texas', 'fort worth'] },
  { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'United States', keywords: ['colorado'] },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', keywords: ['nyc', 'manhattan', 'brooklyn'] },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', keywords: ['sf', 'bay area', 'california'] },
  { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States', keywords: ['washington', 'tacoma'] },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'United States', keywords: ['nevada', 'vegas'] },
  { code: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'United States', keywords: ['florida', 'disney', 'universal'] },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'United States', keywords: ['new york', 'nyc', 'new jersey'] },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States', keywords: ['florida', 'south beach'] },
  { code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'United States', keywords: ['arizona'] },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'United States', keywords: ['texas'] },
  { code: 'BOS', name: 'Logan International', city: 'Boston', country: 'United States', keywords: ['massachusetts'] },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'United States', keywords: ['minnesota', 'st paul'] },
  { code: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale', country: 'United States', keywords: ['florida', 'miami'] },
  { code: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', country: 'United States', keywords: ['michigan'] },
  { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', country: 'United States', keywords: ['pennsylvania', 'philly'] },
  { code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'United States', keywords: ['nyc', 'queens'] },
  { code: 'BWI', name: 'Baltimore/Washington International', city: 'Baltimore', country: 'United States', keywords: ['maryland', 'washington dc'] },
  { code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', country: 'United States', keywords: ['utah'] },
  { code: 'IAD', name: 'Washington Dulles International', city: 'Washington', country: 'United States', keywords: ['dc', 'virginia'] },
  { code: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington', country: 'United States', keywords: ['dc', 'arlington'] },
  { code: 'SAN', name: 'San Diego International', city: 'San Diego', country: 'United States', keywords: ['california'] },
  { code: 'TPA', name: 'Tampa International', city: 'Tampa', country: 'United States', keywords: ['florida'] },
  { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', country: 'United States', keywords: ['texas'] },
  { code: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'United States', keywords: ['hawaii', 'oahu'] },
  { code: 'PDX', name: 'Portland International', city: 'Portland', country: 'United States', keywords: ['oregon'] },
  { code: 'STL', name: 'St. Louis Lambert International', city: 'St. Louis', country: 'United States', keywords: ['missouri'] },
  { code: 'BNA', name: 'Nashville International', city: 'Nashville', country: 'United States', keywords: ['tennessee'] },
  { code: 'OAK', name: 'Oakland International', city: 'Oakland', country: 'United States', keywords: ['california', 'bay area'] },
  { code: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh', country: 'United States', keywords: ['north carolina', 'durham'] },
  { code: 'MCI', name: 'Kansas City International', city: 'Kansas City', country: 'United States', keywords: ['missouri'] },
  { code: 'SJC', name: 'San Jose International', city: 'San Jose', country: 'United States', keywords: ['california', 'silicon valley'] },
  { code: 'SMF', name: 'Sacramento International', city: 'Sacramento', country: 'United States', keywords: ['california'] },
  { code: 'CLE', name: 'Cleveland Hopkins International', city: 'Cleveland', country: 'United States', keywords: ['ohio'] },
  { code: 'IND', name: 'Indianapolis International', city: 'Indianapolis', country: 'United States', keywords: ['indiana'] },
  { code: 'PIT', name: 'Pittsburgh International', city: 'Pittsburgh', country: 'United States', keywords: ['pennsylvania'] },
  { code: 'CVG', name: 'Cincinnati/Northern Kentucky International', city: 'Cincinnati', country: 'United States', keywords: ['ohio', 'kentucky'] },
  { code: 'CMH', name: 'John Glenn Columbus International', city: 'Columbus', country: 'United States', keywords: ['ohio'] },

  // Mexico & Caribbean
  { code: 'CUN', name: 'Cancún International', city: 'Cancún', country: 'Mexico', keywords: ['cancun', 'quintana roo', 'riviera maya', 'playa del carmen'] },
  { code: 'MEX', name: 'Mexico City International', city: 'Mexico City', country: 'Mexico', keywords: ['ciudad de mexico', 'cdmx'] },
  { code: 'GDL', name: 'Guadalajara International', city: 'Guadalajara', country: 'Mexico', keywords: ['jalisco'] },
  { code: 'SJD', name: 'Los Cabos International', city: 'San José del Cabo', country: 'Mexico', keywords: ['cabo san lucas', 'cabos', 'baja'] },
  { code: 'PVR', name: 'Puerto Vallarta International', city: 'Puerto Vallarta', country: 'Mexico', keywords: ['vallarta', 'jalisco'] },
  { code: 'MBJ', name: 'Sangster International', city: 'Montego Bay', country: 'Jamaica', keywords: ['jamaica'] },
  { code: 'NAS', name: 'Lynden Pindling International', city: 'Nassau', country: 'Bahamas', keywords: ['bahamas', 'paradise island'] },
  { code: 'PUJ', name: 'Punta Cana International', city: 'Punta Cana', country: 'Dominican Republic', keywords: ['dominican', 'dr'] },
  { code: 'SJU', name: 'Luis Muñoz Marín International', city: 'San Juan', country: 'Puerto Rico', keywords: ['puerto rico'] },
  { code: 'AUA', name: 'Queen Beatrix International', city: 'Oranjestad', country: 'Aruba', keywords: ['aruba'] },

  // Canada
  { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', keywords: ['ontario'] },
  { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', keywords: ['british columbia', 'bc'] },
  { code: 'YUL', name: 'Montréal-Trudeau International', city: 'Montreal', country: 'Canada', keywords: ['quebec', 'montréal'] },
  { code: 'YYC', name: 'Calgary International', city: 'Calgary', country: 'Canada', keywords: ['alberta'] },
  { code: 'YEG', name: 'Edmonton International', city: 'Edmonton', country: 'Canada', keywords: ['alberta'] },
  { code: 'YOW', name: 'Ottawa Macdonald-Cartier International', city: 'Ottawa', country: 'Canada', keywords: ['ontario'] },

  // Europe
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom', keywords: ['uk', 'england', 'britain'] },
  { code: 'LGW', name: 'Gatwick', city: 'London', country: 'United Kingdom', keywords: ['uk', 'england'] },
  { code: 'STN', name: 'Stansted', city: 'London', country: 'United Kingdom', keywords: ['uk', 'england'] },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', keywords: ['france', 'roissy'] },
  { code: 'ORY', name: 'Orly', city: 'Paris', country: 'France', keywords: ['france'] },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands', keywords: ['holland', 'dutch'] },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', keywords: ['germany', 'deutschland'] },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany', keywords: ['germany', 'münchen', 'bavaria'] },
  { code: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'Spain', keywords: ['spain', 'catalonia', 'españa'] },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', keywords: ['spain', 'españa'] },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'Italy', keywords: ['italy', 'roma', 'italia'] },
  { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', keywords: ['italy', 'milano', 'italia'] },
  { code: 'VCE', name: 'Venice Marco Polo', city: 'Venice', country: 'Italy', keywords: ['italy', 'venezia'] },
  { code: 'LIS', name: 'Lisbon Portela', city: 'Lisbon', country: 'Portugal', keywords: ['portugal', 'lisboa'] },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland', keywords: ['ireland'] },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland', keywords: ['switzerland', 'swiss', 'zürich'] },
  { code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland', keywords: ['switzerland', 'swiss', 'genève'] },
  { code: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria', keywords: ['austria', 'wien'] },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark', keywords: ['denmark', 'københavn'] },
  { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway', keywords: ['norway'] },
  { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden', keywords: ['sweden'] },
  { code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland', keywords: ['finland'] },
  { code: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece', keywords: ['greece', 'athina'] },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey', keywords: ['turkey', 'türkiye'] },
  { code: 'PRG', name: 'Václav Havel Prague', city: 'Prague', country: 'Czech Republic', keywords: ['czechia', 'praha'] },
  { code: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary', keywords: ['hungary'] },
  { code: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland', keywords: ['poland', 'warszawa'] },
  { code: 'BRU', name: 'Brussels', city: 'Brussels', country: 'Belgium', keywords: ['belgium', 'bruxelles'] },
  { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'United Kingdom', keywords: ['scotland', 'uk'] },
  { code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'United Kingdom', keywords: ['england', 'uk'] },

  // Asia
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan', keywords: ['japan', 'narita'] },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan', keywords: ['japan'] },
  { code: 'KIX', name: 'Kansai International', city: 'Osaka', country: 'Japan', keywords: ['japan'] },
  { code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea', keywords: ['korea'] },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', keywords: ['china'] },
  { code: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'China', keywords: ['china', 'peking'] },
  { code: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China', keywords: ['china'] },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore', keywords: [] },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', keywords: ['thailand'] },
  { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', keywords: ['malaysia', 'kl'] },
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', keywords: ['india', 'new delhi'] },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', keywords: ['india', 'bombay'] },
  { code: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', keywords: ['philippines'] },
  { code: 'CGK', name: 'Soekarno-Hatta International', city: 'Jakarta', country: 'Indonesia', keywords: ['indonesia'] },
  { code: 'DPS', name: 'Ngurah Rai International', city: 'Bali', country: 'Indonesia', keywords: ['indonesia', 'denpasar'] },
  { code: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam', keywords: ['vietnam'] },
  { code: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam', keywords: ['vietnam', 'saigon'] },
  { code: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taiwan', keywords: ['taiwan'] },

  // Middle East
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', keywords: ['uae', 'emirates'] },
  { code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'United Arab Emirates', keywords: ['uae', 'emirates'] },
  { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', keywords: ['qatar'] },
  { code: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'Israel', keywords: ['israel'] },
  { code: 'AMM', name: 'Queen Alia International', city: 'Amman', country: 'Jordan', keywords: ['jordan'] },

  // Oceania
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', keywords: ['australia'] },
  { code: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'Australia', keywords: ['australia'] },
  { code: 'BNE', name: 'Brisbane', city: 'Brisbane', country: 'Australia', keywords: ['australia'] },
  { code: 'AKL', name: 'Auckland', city: 'Auckland', country: 'New Zealand', keywords: ['new zealand', 'nz'] },
  { code: 'PPT', name: "Faa'a International", city: 'Papeete', country: 'French Polynesia', keywords: ['tahiti', 'polynesia'] },

  // South America
  { code: 'GRU', name: 'São Paulo-Guarulhos International', city: 'São Paulo', country: 'Brazil', keywords: ['brazil', 'brasil', 'sao paulo'] },
  { code: 'GIG', name: 'Rio de Janeiro-Galeão International', city: 'Rio de Janeiro', country: 'Brazil', keywords: ['brazil', 'brasil'] },
  { code: 'EZE', name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'Argentina', keywords: ['argentina', 'ezeiza'] },
  { code: 'SCL', name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'Chile', keywords: ['chile'] },
  { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru', keywords: ['peru'] },
  { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', keywords: ['colombia', 'bogota'] },
  { code: 'PTY', name: 'Tocumen International', city: 'Panama City', country: 'Panama', keywords: ['panama'] },

  // Africa
  { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', keywords: ['south africa'] },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', keywords: ['south africa'] },
  { code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt', keywords: ['egypt'] },
  { code: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco', keywords: ['morocco'] },
  { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', keywords: ['kenya'] },
  { code: 'ADD', name: 'Bole International', city: 'Addis Ababa', country: 'Ethiopia', keywords: ['ethiopia'] },
]

/**
 * Normalize text by removing accents and converting to lowercase
 * This helps match "Cancún" with "Cancun", "São Paulo" with "Sao Paulo", etc.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .trim()
}

/**
 * Search airports by query string
 * Matches against code, city, country, name, and keywords
 */
export function searchAirports(query: string, limit = 10): Airport[] {
  if (!query || query.length < 2) return []

  const q = normalizeText(query)

  // Score airports based on match quality
  const scored = airports.map(airport => {
    let score = 0
    const cityNorm = normalizeText(airport.city)
    const countryNorm = normalizeText(airport.country)
    const nameNorm = normalizeText(airport.name)
    const codeNorm = airport.code.toLowerCase()

    // Exact code match (highest priority)
    if (codeNorm === q) score += 100

    // Code starts with query
    if (codeNorm.startsWith(q)) score += 50

    // City exact match
    if (cityNorm === q) score += 80

    // City starts with query
    if (cityNorm.startsWith(q)) score += 40

    // City contains query
    if (cityNorm.includes(q)) score += 20

    // Country match
    if (countryNorm.includes(q)) score += 10

    // Airport name contains query
    if (nameNorm.includes(q)) score += 5

    // Keywords match
    if (airport.keywords.some(k => normalizeText(k).includes(q))) score += 15

    return { airport, score }
  })

  // Filter and sort by score
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.airport)
}

/**
 * Find the best matching airport for a destination string
 * Used when we have a city name and need an airport code
 * Handles full destination strings like "Cancún, Quintana Roo, Mexico"
 */
export function findAirportForDestination(destination: string): Airport | null {
  if (!destination) return null

  // Extract just the city name (before the first comma) for better matching
  // e.g., "Cancún, Quintana Roo, Mexico" -> "Cancún"
  const cityName = destination.split(',')[0].trim()

  // Try searching with just the city name first
  let results = searchAirports(cityName, 1)

  // If no results, try with full destination (might match country or state keywords)
  if (results.length === 0) {
    results = searchAirports(destination, 1)
  }

  return results[0] || null
}

/**
 * Get airport by IATA code
 */
export function getAirportByCode(code: string): Airport | null {
  return airports.find(a => a.code.toLowerCase() === code.toLowerCase()) || null
}

/**
 * Format airport for display
 */
export function formatAirport(airport: Airport): string {
  return `${airport.city} (${airport.code})`
}

/**
 * Format airport with full details
 */
export function formatAirportFull(airport: Airport): string {
  return `${airport.city}, ${airport.country} (${airport.code}) - ${airport.name}`
}
