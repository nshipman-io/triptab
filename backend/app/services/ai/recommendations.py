import asyncio
from app.services.ai.agents import single_recommendation_agent, RecommendationDeps
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
    # Generate recommendations sequentially to avoid duplicates
    async def generate_one(index: int, existing: list[str]) -> Recommendation:
        deps = RecommendationDeps(
            destination=destination,
            trip_dates=(start_date, end_date),
            traveler_preferences=preferences or {},
            existing_itinerary=existing,
        )
        result = await single_recommendation_agent.run(
            f"Generate ONE unique {category} recommendation (option #{index + 1} of {count}). "
            f"Make it COMPLETELY DIFFERENT from places already listed. "
            f"Focus on a high-quality, authentic local experience.",
            deps=deps
        )
        return result.output

    recommendations = []
    existing = list(existing_activities or [])
    seen_names = set(name.lower() for name in existing)

    for i in range(count):
        try:
            rec = await generate_one(i, existing)
            # Check for duplicates
            if rec.name.lower() not in seen_names:
                recommendations.append(rec)
                existing.append(rec.name)
                seen_names.add(rec.name.lower())
            else:
                # Retry once if duplicate
                rec = await generate_one(i, existing)
                if rec.name.lower() not in seen_names:
                    recommendations.append(rec)
                    existing.append(rec.name)
                    seen_names.add(rec.name.lower())
        except Exception:
            continue  # Skip failed generations

    return recommendations
