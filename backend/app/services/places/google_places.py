"""Google Places API integration for validating and enriching recommendations."""

import logging
from urllib.parse import quote_plus
import httpx
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

# Google Places API (New) base URL
PLACES_API_BASE = "https://places.googleapis.com/v1"


class PlaceDetails(BaseModel):
    """Validated place details from Google Places API."""
    place_id: str | None = None
    name: str | None = None
    website_url: str | None = None
    google_maps_url: str | None = None
    formatted_address: str | None = None
    lat: float | None = None
    lng: float | None = None
    rating: float | None = None
    user_ratings_total: int | None = None
    price_level: int | None = None


async def search_place(
    query: str,
    location_bias: str | None = None,
) -> PlaceDetails | None:
    """
    Search for a place using Google Places Text Search API (New).

    Args:
        query: The place name to search for
        location_bias: Optional location to bias results (e.g., "Paris, France")

    Returns:
        PlaceDetails with validated information, or None if not found
    """
    api_key = settings.GOOGLE_PLACES_API_KEY
    if not api_key:
        logger.warning("GOOGLE_PLACES_API_KEY not configured, skipping place validation")
        return None

    # Append location to query for better results
    search_query = f"{query} {location_bias}" if location_bias else query

    try:
        async with httpx.AsyncClient() as client:
            # Use Text Search (New) API
            response = await client.post(
                f"{PLACES_API_BASE}/places:searchText",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": "places.id,places.displayName,places.websiteUri,places.googleMapsUri,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel",
                },
                json={
                    "textQuery": search_query,
                    "maxResultCount": 1,
                },
                timeout=10.0,
            )

            if response.status_code != 200:
                logger.error(f"Places API error: {response.status_code} - {response.text}")
                return None

            data = response.json()
            places = data.get("places", [])

            if not places:
                logger.debug(f"No places found for query: {search_query}")
                return None

            place = places[0]
            location = place.get("location", {})

            return PlaceDetails(
                place_id=place.get("id"),
                name=place.get("displayName", {}).get("text"),
                website_url=place.get("websiteUri"),
                google_maps_url=place.get("googleMapsUri"),
                formatted_address=place.get("formattedAddress"),
                lat=location.get("latitude"),
                lng=location.get("longitude"),
                rating=place.get("rating"),
                user_ratings_total=place.get("userRatingCount"),
                price_level=place.get("priceLevel"),
            )

    except httpx.TimeoutException:
        logger.warning(f"Timeout searching for place: {query}")
        return None
    except Exception as e:
        logger.exception(f"Error searching for place: {query} - {e}")
        return None


def get_google_maps_search_url(name: str, location: str | None = None) -> str:
    """
    Generate a Google Maps search URL as a reliable fallback.

    Args:
        name: The place name
        location: Optional location context

    Returns:
        A Google Maps search URL
    """
    query = f"{name} {location}" if location else name
    encoded_query = quote_plus(query)
    return f"https://www.google.com/maps/search/?api=1&query={encoded_query}"


async def validate_and_enrich_place(
    name: str,
    destination: str,
    current_lat: float | None = None,
    current_lng: float | None = None,
    current_rating: float | None = None,
) -> PlaceDetails:
    """
    Validate a place exists and enrich with Google data.

    Always returns a PlaceDetails object with at least a Google Maps fallback URL.

    Args:
        name: The place name
        destination: The trip destination for location context
        current_lat: Current latitude from AI recommendation
        current_lng: Current longitude from AI recommendation
        current_rating: Current rating from AI recommendation

    Returns:
        PlaceDetails with validated/enriched data
    """
    # Try to get real data from Google Places
    place_details = await search_place(name, destination)

    if place_details:
        # Use Google data but fall back to Google Maps URL if no website
        if not place_details.website_url:
            place_details.google_maps_url = place_details.google_maps_url or get_google_maps_search_url(name, destination)
        return place_details

    # No Google Places data, return fallback
    return PlaceDetails(
        name=name,
        google_maps_url=get_google_maps_search_url(name, destination),
        lat=current_lat,
        lng=current_lng,
        rating=current_rating,
    )
