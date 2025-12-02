from dataclasses import dataclass
from pydantic_ai import Agent, RunContext
from app.services.ai.schemas import ParsedReservation, Recommendation


@dataclass
class EmailParserDeps:
    """Dependencies for email parsing agent."""
    raw_email_content: str


@dataclass
class RecommendationDeps:
    """Dependencies for recommendations agent."""
    destination: str
    trip_dates: tuple[str, str]  # start, end
    traveler_preferences: dict  # interests, budget, etc.
    existing_itinerary: list[str]  # Already planned activities


# Email Parser Agent
email_parser_agent = Agent(
    'openai:gpt-4o-mini',
    deps_type=EmailParserDeps,
    output_type=ParsedReservation,
    instructions='''You are an expert at parsing travel confirmation emails and booking confirmations.

Your task is to extract reservation details from the provided email content.

Guidelines:
- Be precise with dates, times, and confirmation numbers
- For flights, extract airline, flight number, airports, and cabin class
- For hotels, extract hotel name, address, room type, check-in/out times
- For car rentals, extract company, car type, pickup/dropoff locations
- Set the type field to match the reservation type
- Create a concise, descriptive title (e.g., "Delta Flight LAX to JFK", "Marriott Downtown Seattle")
- Set confidence based on how clear and complete the information was:
  - 0.9-1.0: All key details clearly stated
  - 0.7-0.9: Most details present but some unclear
  - 0.5-0.7: Partial information, some guessing required
  - Below 0.5: Very limited information available
- Include any important notes like special requests or policies''',
    retries=2,
)


# Single Recommendation Agent - generates one recommendation at a time for reliability
single_recommendation_agent = Agent(
    'openai:gpt-4o-mini',
    deps_type=RecommendationDeps,
    output_type=Recommendation,
    instructions='''You are a knowledgeable travel advisor with expertise in destinations worldwide.

Your task is to generate ONE personalized recommendation based on the trip context provided.

Guidelines:
- PRIORITIZE recommendations that match the trip's vibe and preferences:
  - For "couple" trips: focus on romantic spots, intimate venues, couples experiences
  - For "family" trips: focus on kid-friendly, educational, safe options
  - For "friends" trips: focus on group activities, social venues, fun experiences
  - For "solo" trips: focus on unique experiences, safe areas, social opportunities

- RESPECT the budget level:
  - "budget": affordable options, free activities, street food, hostels
  - "moderate": mid-range restaurants, boutique hotels, popular attractions
  - "luxury": high-end dining, premium experiences, exclusive venues

- ALIGN with activity preferences:
  - "adventure": outdoor activities, extreme sports, hiking, water sports
  - "relaxation": spas, beaches, quiet cafes, scenic walks
  - "culture": museums, historical sites, local traditions, architecture
  - "food": local cuisine, food tours, cooking classes, markets
  - "nature": parks, wildlife, scenic viewpoints, botanical gardens
  - "nightlife": bars, clubs, live music, evening entertainment

- For HOTEL recommendations, match the vibe:
  - "couple" + "luxury": boutique hotels, romantic suites, hotels with spa
  - "couple" + "moderate": well-rated 3-4 star hotels, charming B&Bs
  - "family": family-friendly resorts, hotels with pools, apartments with kitchens
  - "friends": hostels, party hotels, central locations, shared accommodations
  - "solo" + "budget": hostels with social areas, affordable guesthouses
  - Include amenities, location benefits, and what makes it special for their trip type

- Provide diverse options across the requested category
- Consider the trip dates (season, weather, local events)
- Avoid recommending places already in the itinerary
- Include approximate coordinates for map display when possible
- Provide realistic cost estimates using $ symbols or specific amounts
- Add relevant tags for filtering (family-friendly, romantic, adventure, etc.)
- Explain WHY each place is recommended based on the specific preferences

IMPORTANT - Website URLs:
- For EVERY recommendation, try to include a website URL in the website_url field
- PREFER these reliable platforms that are less likely to have broken links:
  - Google Maps: "https://maps.google.com/?q=PLACE+NAME+CITY" (most reliable)
  - TripAdvisor: "https://www.tripadvisor.com/..." (for restaurants, hotels, attractions)
  - Yelp: "https://www.yelp.com/biz/..." (for restaurants)
  - Booking.com: "https://www.booking.com/hotel/..." (for hotels)
- Only use official business websites if you are CERTAIN they exist (major chains, famous landmarks)
- The URL must be a complete, valid URL starting with https://
- If you cannot provide a reliable URL, use a Google Maps search URL as fallback
- NEVER guess or make up URLs - use Google Maps search if unsure
- Examples:
  - "https://maps.google.com/?q=Arenal+Volcano+National+Park+Costa+Rica"
  - "https://www.tripadvisor.com/Restaurant_Review-..."
  - "https://www.booking.com/hotel/cr/..."''',
    retries=2,
)


@single_recommendation_agent.instructions
async def add_trip_context(ctx: RunContext[RecommendationDeps]) -> str:
    """Dynamic instructions with trip context."""
    deps = ctx.deps
    existing = ', '.join(deps.existing_itinerary) if deps.existing_itinerary else 'Nothing yet'
    prefs = deps.traveler_preferences

    # Extract key preferences with clear labels
    travel_type = prefs.get('travel_type', 'Not specified')
    budget = prefs.get('budget_range', 'moderate')
    activities = prefs.get('activities', [])
    num_travelers = prefs.get('num_travelers', 2)
    special_requirements = prefs.get('special_requirements', '')

    activities_str = ', '.join(activities) if activities else 'general sightseeing'

    return f'''
Current Trip Details:
- Destination: {deps.destination}
- Dates: {deps.trip_dates[0]} to {deps.trip_dates[1]}
- Number of Travelers: {num_travelers}

Trip Vibe & Preferences:
- Travel Type: {travel_type} (IMPORTANT: tailor recommendations to this group type)
- Budget Level: {budget} (IMPORTANT: match price points to this budget)
- Interests: {activities_str} (IMPORTANT: prioritize these activity types)
{f'- Special Requirements: {special_requirements}' if special_requirements else ''}

Already planned (DO NOT recommend these): {existing}

CRITICAL: Your recommendation MUST be different from all places listed above. Pick something unique and interesting.
'''
