"""
Seed script to create placeholder travel guides.
Run with: python -m app.seed_guides
"""
import asyncio
from datetime import datetime
from sqlalchemy import select
from app.core.database import async_session_maker, init_db
from app.models.user import User
from app.models.guide import Guide, GuideSection, GuidePlace, GuideVisibility


PLACEHOLDER_GUIDES = [
    {
        "title": "Costa Rica Adventure Guide",
        "description": "Discover the pura vida lifestyle with this comprehensive guide to Costa Rica's best beaches, rainforests, and wildlife experiences.",
        "destination": "Costa Rica",
        "cover_image_url": "https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=800&h=400&fit=crop",
        "tags": ["adventure", "nature", "beaches", "wildlife"],
        "location_tags": ["costa rica", "central america", "san jose", "manuel antonio", "monteverde", "arenal", "la fortuna", "guanacaste"],
        "sections": [
            {
                "title": "Must-Visit Beaches",
                "description": "The most beautiful beaches on both coasts",
                "places": [
                    {
                        "name": "Manuel Antonio Beach",
                        "description": "A stunning white sand beach inside Manuel Antonio National Park, surrounded by rainforest.",
                        "category": "Beach",
                        "address": "Manuel Antonio National Park, Puntarenas",
                        "tips": "Arrive early to avoid crowds and watch for monkeys in the trees!",
                        "price_range": "$15 park entrance",
                        "photo_url": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Playa Conchal",
                        "description": "Unique beach made of millions of crushed seashells, with crystal clear water perfect for snorkeling.",
                        "category": "Beach",
                        "address": "Guanacaste Province",
                        "tips": "Bring water shoes - the shells can be sharp!",
                        "photo_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Rainforest Adventures",
                "description": "Experience the incredible biodiversity of Costa Rica",
                "places": [
                    {
                        "name": "Monteverde Cloud Forest",
                        "description": "One of the world's most biodiverse cloud forests, home to the resplendent quetzal.",
                        "category": "Nature Reserve",
                        "address": "Monteverde, Puntarenas",
                        "tips": "Book a night tour to see nocturnal wildlife like red-eyed tree frogs.",
                        "price_range": "$25",
                        "photo_url": "https://images.unsplash.com/photo-1440581572325-0bea30075d9d?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Arenal Volcano",
                        "description": "Hike around Costa Rica's most famous volcano and relax in natural hot springs.",
                        "category": "Volcano",
                        "address": "La Fortuna, Alajuela",
                        "tips": "The hot springs are best enjoyed at sunset with a view of the volcano.",
                        "price_range": "$45-85 for hot springs",
                        "photo_url": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Local Food & Coffee",
                "description": "Taste the flavors of Costa Rica",
                "places": [
                    {
                        "name": "Doka Coffee Estate",
                        "description": "Learn about coffee production from bean to cup at this family-owned estate.",
                        "category": "Coffee Tour",
                        "address": "Alajuela Province",
                        "tips": "The breakfast tour includes a traditional Costa Rican breakfast.",
                        "price_range": "$30-45",
                        "photo_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Cancun & Riviera Maya Explorer",
        "description": "From ancient Mayan ruins to stunning cenotes and world-class beaches, explore the best of Mexico's Caribbean coast.",
        "destination": "Cancun, Mexico",
        "cover_image_url": "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&h=400&fit=crop",
        "tags": ["beaches", "history", "culture", "food"],
        "location_tags": ["cancun", "mexico", "riviera maya", "tulum", "playa del carmen", "quintana roo", "yucatan", "chichen itza", "caribbean"],
        "sections": [
            {
                "title": "Ancient Mayan Sites",
                "description": "Step back in time at these incredible archaeological sites",
                "places": [
                    {
                        "name": "Chichen Itza",
                        "description": "One of the New Seven Wonders of the World, featuring the iconic El Castillo pyramid.",
                        "category": "Archaeological Site",
                        "address": "Yucatan, Mexico",
                        "tips": "Go early morning to beat the heat and crowds. The light show at night is magical!",
                        "price_range": "$30",
                        "photo_url": "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Tulum Ruins",
                        "description": "Stunning clifftop Mayan ruins overlooking the Caribbean Sea.",
                        "category": "Archaeological Site",
                        "address": "Tulum, Quintana Roo",
                        "tips": "Bring your swimsuit - there's a beautiful beach below the ruins!",
                        "price_range": "$5",
                        "photo_url": "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Cenotes",
                "description": "Swim in these magical natural sinkholes",
                "places": [
                    {
                        "name": "Cenote Ik Kil",
                        "description": "A dramatic open-air cenote with vines hanging down into crystal-clear water.",
                        "category": "Cenote",
                        "address": "Near Chichen Itza",
                        "tips": "Visit right after Chichen Itza - it's just 10 minutes away.",
                        "price_range": "$10",
                        "photo_url": "https://images.unsplash.com/photo-1547483238-2cbf881a559f?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Gran Cenote",
                        "description": "Perfect for snorkeling with clear visibility and small turtles.",
                        "category": "Cenote",
                        "address": "Tulum, Quintana Roo",
                        "tips": "Arrive when they open at 8am for the best experience.",
                        "price_range": "$15",
                        "photo_url": "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Best Tacos & Local Eats",
                "description": "Where to find the most authentic food",
                "places": [
                    {
                        "name": "Tacos Rigo",
                        "description": "Famous for their cochinita pibil tacos - a local favorite for decades.",
                        "category": "Restaurant",
                        "address": "Downtown Cancun",
                        "tips": "Try the habanero salsa if you can handle the heat!",
                        "price_range": "$",
                        "photo_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Japan: Tokyo to Kyoto",
        "description": "Experience the perfect blend of ancient traditions and modern innovation across Japan's most iconic destinations.",
        "destination": "Japan",
        "cover_image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=400&fit=crop",
        "tags": ["culture", "food", "temples", "nature"],
        "location_tags": ["japan", "tokyo", "kyoto", "osaka", "asia", "shibuya", "shinjuku", "asakusa", "arashiyama", "fushimi inari", "nara"],
        "sections": [
            {
                "title": "Tokyo Highlights",
                "description": "The essential Tokyo experiences",
                "places": [
                    {
                        "name": "Senso-ji Temple",
                        "description": "Tokyo's oldest temple with a beautiful approach through Nakamise shopping street.",
                        "category": "Temple",
                        "address": "Asakusa, Tokyo",
                        "tips": "Visit at dawn to experience the temple without crowds.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Shibuya Crossing",
                        "description": "The world's busiest pedestrian crossing - an iconic Tokyo experience.",
                        "category": "Landmark",
                        "address": "Shibuya, Tokyo",
                        "tips": "Watch from the Starbucks above for the best view of the crossing.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "TeamLab Borderless",
                        "description": "An immersive digital art museum that will blow your mind.",
                        "category": "Museum",
                        "address": "Odaiba, Tokyo",
                        "tips": "Book tickets online well in advance - they sell out quickly!",
                        "price_range": "$30",
                        "photo_url": "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Kyoto Temples & Gardens",
                "description": "The cultural heart of Japan",
                "places": [
                    {
                        "name": "Fushimi Inari Shrine",
                        "description": "Thousands of vermillion torii gates winding up a mountain.",
                        "category": "Shrine",
                        "address": "Fushimi, Kyoto",
                        "tips": "Hike to the top for amazing views - it takes about 2 hours.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Arashiyama Bamboo Grove",
                        "description": "Walk through towering bamboo stalks in this magical forest.",
                        "category": "Nature",
                        "address": "Arashiyama, Kyoto",
                        "tips": "Go at sunrise for photos without crowds.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Kinkaku-ji (Golden Pavilion)",
                        "description": "A stunning Zen temple covered in gold leaf, reflected in a serene pond.",
                        "category": "Temple",
                        "address": "Kita Ward, Kyoto",
                        "tips": "Beautiful in any season, but especially stunning in autumn or when dusted with snow.",
                        "price_range": "$5",
                        "photo_url": "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Must-Try Food",
                "description": "Essential culinary experiences in Japan",
                "places": [
                    {
                        "name": "Tsukiji Outer Market",
                        "description": "Fresh sushi, tamagoyaki, and street food at Tokyo's famous fish market area.",
                        "category": "Food Market",
                        "address": "Tsukiji, Tokyo",
                        "tips": "Go early for the freshest sushi breakfast. Try the tamagoyaki!",
                        "price_range": "$$",
                        "photo_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Nishiki Market",
                        "description": "Kyoto's kitchen - a covered market with traditional foods and local specialties.",
                        "category": "Food Market",
                        "address": "Nakagyo Ward, Kyoto",
                        "tips": "Try the matcha soft serve and pickled vegetables.",
                        "price_range": "$-$$",
                        "photo_url": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    }
]


async def seed_guides():
    """Create placeholder guides in the database."""
    await init_db()

    async with async_session_maker() as session:
        # Check if we have any users to be the author
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()

        if not user:
            # Create a system user for the guides
            user = User(
                email="guides@triptab.app",
                name="Triptab Team",
                hashed_password="not-a-real-password"  # This user can't log in
            )
            session.add(user)
            await session.flush()
            print(f"Created system user: {user.name}")

        # Check if guides already exist
        result = await session.execute(select(Guide).limit(1))
        existing = result.scalar_one_or_none()
        if existing:
            print("Guides already exist, skipping seed.")
            return

        for guide_data in PLACEHOLDER_GUIDES:
            # Create guide
            guide = Guide(
                title=guide_data["title"],
                description=guide_data["description"],
                destination=guide_data["destination"],
                cover_image_url=guide_data["cover_image_url"],
                visibility=GuideVisibility.PUBLIC,
                tags=guide_data["tags"],
                location_tags=guide_data.get("location_tags", []),
                author_id=user.id,
                view_count=0
            )
            session.add(guide)
            await session.flush()
            print(f"Created guide: {guide.title}")

            # Create sections
            for section_order, section_data in enumerate(guide_data["sections"]):
                section = GuideSection(
                    guide_id=guide.id,
                    title=section_data["title"],
                    description=section_data.get("description"),
                    order=section_order
                )
                session.add(section)
                await session.flush()

                # Create places
                for place_order, place_data in enumerate(section_data["places"]):
                    place = GuidePlace(
                        section_id=section.id,
                        name=place_data["name"],
                        description=place_data.get("description"),
                        category=place_data.get("category"),
                        address=place_data.get("address"),
                        tips=place_data.get("tips"),
                        price_range=place_data.get("price_range"),
                        photo_url=place_data.get("photo_url"),
                        order=place_order
                    )
                    session.add(place)

        await session.commit()
        print("Seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_guides())
