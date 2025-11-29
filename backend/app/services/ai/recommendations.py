from app.services.ai.agents import recommendations_agent, RecommendationDeps
from app.services.ai.schemas import Recommendation


async def get_trip_recommendations(
    destination: str,
    start_date: str,
    end_date: str,
    category: str,
    preferences: dict | None = None,
    existing_activities: list[str] | None = None,
    count: int = 5,
) -> list[Recommendation]:
    """Generate personalized recommendations for a trip.

    Args:
        destination: Trip destination (city, region, etc.)
        start_date: Trip start date (ISO format)
        end_date: Trip end date (ISO format)
        category: Type of recommendations (restaurants, activities, attractions)
        preferences: User preferences (interests, budget, etc.)
        existing_activities: Activities already in the itinerary (to avoid duplicates)
        count: Number of recommendations to generate

    Returns:
        List of Recommendation objects
    """
    deps = RecommendationDeps(
        destination=destination,
        trip_dates=(start_date, end_date),
        traveler_preferences=preferences or {},
        existing_itinerary=existing_activities or [],
    )

    result = await recommendations_agent.run(
        f"Suggest {count} {category} recommendations for this trip. "
        f"Focus on high-quality, authentic local experiences.",
        deps=deps
    )
    return result.output.recommendations
