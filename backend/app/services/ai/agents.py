from dataclasses import dataclass
from pydantic_ai import Agent, RunContext
from app.services.ai.schemas import ParsedReservation, RecommendationList


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


# Recommendations Agent
recommendations_agent = Agent(
    'openai:gpt-4o-mini',
    deps_type=RecommendationDeps,
    output_type=RecommendationList,
    instructions='''You are a knowledgeable travel advisor with expertise in destinations worldwide.

Your task is to generate personalized recommendations based on the trip context provided.

Guidelines:
- Provide diverse options across the requested category
- Consider the trip dates (season, weather, local events)
- Respect the traveler's preferences and budget
- Avoid recommending places already in the itinerary
- Include approximate coordinates for map display when possible
- For restaurants, consider cuisine diversity and meal types
- For activities, balance indoor/outdoor options based on weather
- Provide realistic cost estimates using $ symbols or specific amounts
- Add relevant tags for filtering (family-friendly, romantic, adventure, etc.)
- Explain WHY each place is recommended based on the preferences''',
    retries=2,
)


@recommendations_agent.instructions
async def add_trip_context(ctx: RunContext[RecommendationDeps]) -> str:
    """Dynamic instructions with trip context."""
    deps = ctx.deps
    existing = ', '.join(deps.existing_itinerary) if deps.existing_itinerary else 'Nothing yet'

    prefs_str = ', '.join(f"{k}: {v}" for k, v in deps.traveler_preferences.items()) if deps.traveler_preferences else 'None specified'

    return f'''
Current Trip Details:
- Destination: {deps.destination}
- Dates: {deps.trip_dates[0]} to {deps.trip_dates[1]}
- Traveler Preferences: {prefs_str}
- Already planned: {existing}

Important: Do not recommend places already in the itinerary.
'''
