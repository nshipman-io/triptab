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
        "title": "Paris: City of Light",
        "description": "From the Eiffel Tower to hidden bistros, discover the romance and culture of the world's most visited city.",
        "destination": "Paris, France",
        "cover_image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=400&fit=crop",
        "tags": ["culture", "food", "art", "romance"],
        "location_tags": ["paris", "france", "europe", "eiffel tower", "louvre", "montmartre", "marais", "saint germain"],
        "sections": [
            {
                "title": "Iconic Landmarks",
                "description": "The must-see sights of Paris",
                "places": [
                    {
                        "name": "Eiffel Tower",
                        "description": "The symbol of Paris - stunning by day and magical when it sparkles at night.",
                        "category": "Landmark",
                        "address": "Champ de Mars, 5 Avenue Anatole France",
                        "tips": "Book tickets online to skip the line. Visit at sunset for golden hour photos.",
                        "price_range": "$25-40",
                        "photo_url": "https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Louvre Museum",
                        "description": "The world's largest art museum, home to the Mona Lisa and 35,000 other works.",
                        "category": "Museum",
                        "address": "Rue de Rivoli, 75001 Paris",
                        "tips": "Enter through the underground Carrousel entrance to avoid lines.",
                        "price_range": "$17",
                        "photo_url": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Notre-Dame Cathedral",
                        "description": "Gothic masterpiece under restoration - the exterior and square are still worth visiting.",
                        "category": "Cathedral",
                        "address": "6 Parvis Notre-Dame, Île de la Cité",
                        "tips": "Walk around the back for beautiful views of the flying buttresses.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Charming Neighborhoods",
                "description": "Explore Paris like a local",
                "places": [
                    {
                        "name": "Montmartre",
                        "description": "Hilltop village with cobblestone streets, artists, and the stunning Sacré-Cœur basilica.",
                        "category": "Neighborhood",
                        "address": "18th arrondissement",
                        "tips": "Take the funicular up and walk down. Avoid the scam artists near Sacré-Cœur.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Le Marais",
                        "description": "Historic Jewish quarter with trendy boutiques, galleries, and the best falafel in Paris.",
                        "category": "Neighborhood",
                        "address": "3rd & 4th arrondissements",
                        "tips": "Visit on Sunday when other areas are closed - Le Marais stays open!",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1549144511-f099e773c147?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Food & Cafés",
                "description": "Essential Parisian culinary experiences",
                "places": [
                    {
                        "name": "Café de Flore",
                        "description": "Legendary café where Hemingway and Sartre once wrote. Perfect for people watching.",
                        "category": "Café",
                        "address": "172 Boulevard Saint-Germain",
                        "tips": "Order a croque monsieur and café crème. Sit outside if weather permits.",
                        "price_range": "$$",
                        "photo_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "L'As du Fallafel",
                        "description": "The best falafel in Paris - always a line but worth the wait.",
                        "category": "Restaurant",
                        "address": "34 Rue des Rosiers, Le Marais",
                        "tips": "Get the special with eggplant. Closed Saturdays.",
                        "price_range": "$",
                        "photo_url": "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "New York City Essentials",
        "description": "The city that never sleeps - from Broadway to Brooklyn, experience the energy of NYC.",
        "destination": "New York City, USA",
        "cover_image_url": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=400&fit=crop",
        "tags": ["city", "food", "culture", "nightlife"],
        "location_tags": ["new york", "nyc", "manhattan", "brooklyn", "usa", "times square", "central park", "soho", "williamsburg"],
        "sections": [
            {
                "title": "Manhattan Must-Sees",
                "description": "The iconic NYC experiences",
                "places": [
                    {
                        "name": "Central Park",
                        "description": "843 acres of green space in the heart of Manhattan. Rent a bike or take a rowboat.",
                        "category": "Park",
                        "address": "Central Park, Manhattan",
                        "tips": "The Ramble is the most peaceful area. Bethesda Fountain is perfect for photos.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "The High Line",
                        "description": "Elevated park built on historic freight rail lines with art installations and great views.",
                        "category": "Park",
                        "address": "Gansevoort St to 34th St, West Side",
                        "tips": "Start at the southern end in the Meatpacking District and walk north.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Top of the Rock",
                        "description": "The best views of Manhattan including the Empire State Building and Central Park.",
                        "category": "Observation Deck",
                        "address": "30 Rockefeller Plaza",
                        "tips": "Better views than Empire State Building, and shorter lines. Go at sunset.",
                        "price_range": "$40",
                        "photo_url": "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Brooklyn Adventures",
                "description": "Cross the bridge for a different side of NYC",
                "places": [
                    {
                        "name": "Brooklyn Bridge",
                        "description": "Walk across this iconic bridge for stunning skyline views.",
                        "category": "Landmark",
                        "address": "Brooklyn Bridge, New York",
                        "tips": "Walk from Brooklyn to Manhattan for the best views. Go early to avoid crowds.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "DUMBO",
                        "description": "Trendy waterfront neighborhood with cobblestone streets and Instagram-famous views.",
                        "category": "Neighborhood",
                        "address": "DUMBO, Brooklyn",
                        "tips": "Get the classic photo of the Manhattan Bridge framed by buildings on Washington St.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Food Scene",
                "description": "NYC's diverse culinary offerings",
                "places": [
                    {
                        "name": "Joe's Pizza",
                        "description": "Legendary Greenwich Village slice shop - the quintessential NYC pizza experience.",
                        "category": "Restaurant",
                        "address": "7 Carmine St, Greenwich Village",
                        "tips": "Get a plain cheese slice. Fold it in half like a New Yorker.",
                        "price_range": "$",
                        "photo_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Katz's Delicatessen",
                        "description": "Iconic Jewish deli since 1888. Famous for pastrami and the 'When Harry Met Sally' scene.",
                        "category": "Restaurant",
                        "address": "205 E Houston St, Lower East Side",
                        "tips": "Don't lose your ticket! Order the pastrami on rye.",
                        "price_range": "$$",
                        "photo_url": "https://images.unsplash.com/photo-1553909489-ec2175ef3f52?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Bali: Island of the Gods",
        "description": "Temples, rice terraces, beaches, and spiritual retreats on Indonesia's most famous island.",
        "destination": "Bali, Indonesia",
        "cover_image_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=400&fit=crop",
        "tags": ["beaches", "temples", "nature", "wellness"],
        "location_tags": ["bali", "indonesia", "ubud", "seminyak", "canggu", "uluwatu", "asia", "kuta", "nusa dua"],
        "sections": [
            {
                "title": "Sacred Temples",
                "description": "Experience Bali's spiritual side",
                "places": [
                    {
                        "name": "Tanah Lot",
                        "description": "Iconic sea temple perched on a rock formation, spectacular at sunset.",
                        "category": "Temple",
                        "address": "Beraban, Tabanan Regency",
                        "tips": "Arrive 1 hour before sunset to secure a good spot. Very touristy but worth it.",
                        "price_range": "$5",
                        "photo_url": "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Uluwatu Temple",
                        "description": "Clifftop temple with dramatic ocean views and nightly Kecak fire dance performances.",
                        "category": "Temple",
                        "address": "Pecatu, South Kuta",
                        "tips": "Watch out for monkeys - they steal sunglasses! Stay for the Kecak dance at 6pm.",
                        "price_range": "$5 + $15 for dance",
                        "photo_url": "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Tirta Empul",
                        "description": "Holy water temple where Balinese come for ritual purification.",
                        "category": "Temple",
                        "address": "Tampaksiring, Gianyar",
                        "tips": "You can participate in the purification ritual - bring a change of clothes.",
                        "price_range": "$3",
                        "photo_url": "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Ubud & Rice Terraces",
                "description": "The cultural heart of Bali",
                "places": [
                    {
                        "name": "Tegallalang Rice Terraces",
                        "description": "Stunning emerald-green rice paddies carved into the hillside.",
                        "category": "Nature",
                        "address": "Tegallalang, Gianyar",
                        "tips": "Go early morning (7am) to avoid crowds and heat. Watch for 'donation' scams.",
                        "price_range": "$2",
                        "photo_url": "https://images.unsplash.com/photo-1531592937781-344ad608fabf?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Sacred Monkey Forest",
                        "description": "Ancient temple sanctuary home to over 700 Balinese long-tailed macaques.",
                        "category": "Nature",
                        "address": "Jl. Monkey Forest, Ubud",
                        "tips": "Don't make eye contact or smile at monkeys. Secure all belongings.",
                        "price_range": "$5",
                        "photo_url": "https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Beach Clubs & Sunsets",
                "description": "Bali's legendary beach scene",
                "places": [
                    {
                        "name": "Potato Head Beach Club",
                        "description": "Iconic beach club with infinity pool, great music, and unforgettable sunsets.",
                        "category": "Beach Club",
                        "address": "Jl. Petitenget, Seminyak",
                        "tips": "Make a reservation for sunset. The architecture alone is worth visiting.",
                        "price_range": "$$$",
                        "photo_url": "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Echo Beach",
                        "description": "Popular surf beach in Canggu with a laid-back vibe and beachfront warungs.",
                        "category": "Beach",
                        "address": "Canggu, Kuta Utara",
                        "tips": "Great for sunset drinks. Learn to surf here - waves are beginner-friendly.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "London: A Royal Experience",
        "description": "Historic palaces, world-class museums, vibrant markets, and the best pubs - discover London's charm.",
        "destination": "London, England",
        "cover_image_url": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop",
        "tags": ["history", "culture", "food", "museums"],
        "location_tags": ["london", "england", "uk", "britain", "europe", "westminster", "shoreditch", "camden", "notting hill", "soho"],
        "sections": [
            {
                "title": "Royal London",
                "description": "Palaces, guards, and British tradition",
                "places": [
                    {
                        "name": "Buckingham Palace",
                        "description": "The official residence of the British monarch. Watch the Changing of the Guard ceremony.",
                        "category": "Palace",
                        "address": "Westminster, London SW1A 1AA",
                        "tips": "Changing of the Guard at 11am (check schedule). State Rooms open in summer.",
                        "price_range": "Free / $30 for State Rooms",
                        "photo_url": "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Tower of London",
                        "description": "Historic castle, home to the Crown Jewels and 1000 years of royal history.",
                        "category": "Castle",
                        "address": "Tower Hill, London EC3N 4AB",
                        "tips": "Book online to skip lines. Join a free Yeoman Warder tour - they're hilarious!",
                        "price_range": "$35",
                        "photo_url": "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Westminster Abbey",
                        "description": "Gothic church where royals are crowned and married. Over 1000 years old.",
                        "category": "Church",
                        "address": "20 Deans Yd, Westminster",
                        "tips": "Free evensong services let you experience the abbey without entry fee.",
                        "price_range": "$25",
                        "photo_url": "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "World-Class Museums",
                "description": "Most are free!",
                "places": [
                    {
                        "name": "British Museum",
                        "description": "2 million years of human history including the Rosetta Stone and Elgin Marbles.",
                        "category": "Museum",
                        "address": "Great Russell St, Bloomsbury",
                        "tips": "Don't try to see everything. Pick a few galleries. The Egyptian collection is incredible.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Tate Modern",
                        "description": "Modern art powerhouse in a converted power station on the Thames.",
                        "category": "Museum",
                        "address": "Bankside, London SE1 9TG",
                        "tips": "Free to enter. Great views from the 10th floor viewing platform.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Markets & Neighborhoods",
                "description": "Experience local London life",
                "places": [
                    {
                        "name": "Borough Market",
                        "description": "London's oldest food market - a foodie paradise with vendors from around the world.",
                        "category": "Market",
                        "address": "8 Southwark St, London SE1 1TL",
                        "tips": "Go hungry! Best on Thursday-Saturday. Try the raclette and scotch eggs.",
                        "price_range": "$-$$",
                        "photo_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Notting Hill",
                        "description": "Colorful houses, antique shops, and the famous Portobello Road Market.",
                        "category": "Neighborhood",
                        "address": "Notting Hill, London W11",
                        "tips": "Portobello Market is best on Saturdays. The colorful houses are on Lancaster Rd.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Barcelona: Gaudí & Beyond",
        "description": "Sun-soaked beaches, stunning architecture, incredible food, and vibrant nightlife in Catalonia's capital.",
        "destination": "Barcelona, Spain",
        "cover_image_url": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=400&fit=crop",
        "tags": ["architecture", "beaches", "food", "nightlife"],
        "location_tags": ["barcelona", "spain", "catalonia", "europe", "gothic quarter", "la rambla", "el born", "barceloneta", "gracia"],
        "sections": [
            {
                "title": "Gaudí Masterpieces",
                "description": "The surreal architecture that defines Barcelona",
                "places": [
                    {
                        "name": "La Sagrada Familia",
                        "description": "Gaudí's unfinished masterpiece - a basilica unlike anything you've ever seen.",
                        "category": "Church",
                        "address": "Carrer de Mallorca, 401",
                        "tips": "Book tickets 2+ weeks ahead. Visit at different times to see how light changes the interior.",
                        "price_range": "$26-36",
                        "photo_url": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Park Güell",
                        "description": "Whimsical park with mosaic sculptures and city views. A UNESCO World Heritage Site.",
                        "category": "Park",
                        "address": "Carrer d'Olot, s/n",
                        "tips": "Buy timed tickets online. Go for sunset. The free zone outside has great views too.",
                        "price_range": "$10",
                        "photo_url": "https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Casa Batlló",
                        "description": "Gaudí's fantastical building on Passeig de Gràcia - looks like it's made of bones and scales.",
                        "category": "Architecture",
                        "address": "Passeig de Gràcia, 43",
                        "tips": "The augmented reality tour is worth it. Rooftop is spectacular.",
                        "price_range": "$35",
                        "photo_url": "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Neighborhoods & Beaches",
                "description": "Explore Barcelona's diverse barrios",
                "places": [
                    {
                        "name": "Gothic Quarter",
                        "description": "Medieval maze of narrow streets, hidden plazas, and Roman ruins.",
                        "category": "Neighborhood",
                        "address": "Barri Gòtic, Barcelona",
                        "tips": "Get lost on purpose. Best explored without a map. Visit the cathedral at night.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Barceloneta Beach",
                        "description": "The city's most popular beach - great for swimming, people-watching, and chiringuitos.",
                        "category": "Beach",
                        "address": "Barceloneta, Barcelona",
                        "tips": "Head further north to Nova Icària for a less crowded experience.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1507619579562-f2e10da1ec86?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Tapas & Vermouth",
                "description": "Essential Barcelona food experiences",
                "places": [
                    {
                        "name": "La Boqueria Market",
                        "description": "Famous food market off La Rambla. Fresh juices, jamón, and seafood.",
                        "category": "Market",
                        "address": "La Rambla, 91",
                        "tips": "Avoid the touristy front stalls. The best food is in the back. Go before noon.",
                        "price_range": "$-$$",
                        "photo_url": "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "El Xampanyet",
                        "description": "Tiny, authentic tapas bar in El Born serving cava and anchovies since 1929.",
                        "category": "Bar",
                        "address": "Carrer de Montcada, 22",
                        "tips": "Standing room only. Order the house cava and boquerones (anchovies).",
                        "price_range": "$",
                        "photo_url": "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Miami & South Beach",
        "description": "Art deco architecture, Cuban food, incredible beaches, and legendary nightlife in Florida's tropical paradise.",
        "destination": "Miami, USA",
        "cover_image_url": "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&h=400&fit=crop",
        "tags": ["beaches", "nightlife", "food", "art"],
        "location_tags": ["miami", "florida", "usa", "south beach", "wynwood", "little havana", "key biscayne", "coconut grove"],
        "sections": [
            {
                "title": "Beaches & Art Deco",
                "description": "Sun, sand, and iconic architecture",
                "places": [
                    {
                        "name": "South Beach",
                        "description": "Miami's most famous beach with turquoise waters and iconic lifeguard stands.",
                        "category": "Beach",
                        "address": "Ocean Drive, Miami Beach",
                        "tips": "Walk along Ocean Drive at sunset. The art deco buildings look magical at dusk.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Art Deco Historic District",
                        "description": "The largest collection of Art Deco architecture in the world.",
                        "category": "Neighborhood",
                        "address": "Ocean Drive & Collins Avenue",
                        "tips": "Take the free Art Deco walking tour offered by the Miami Design Preservation League.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Cultural Neighborhoods",
                "description": "Miami's diverse communities",
                "places": [
                    {
                        "name": "Little Havana",
                        "description": "The heart of Cuban culture in Miami. Cigar shops, domino players, and incredible food.",
                        "category": "Neighborhood",
                        "address": "Calle Ocho (SW 8th Street)",
                        "tips": "Try a Cuban coffee at Versailles. Watch the domino players at Domino Park.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1562095241-8c6714fd4178?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Wynwood Walls",
                        "description": "World-famous outdoor street art museum with murals by renowned artists.",
                        "category": "Art District",
                        "address": "2520 NW 2nd Ave, Wynwood",
                        "tips": "Visit during the day for photos. The area comes alive at night with bars and clubs.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Food & Drink",
                "description": "Cuban cuisine and tropical cocktails",
                "places": [
                    {
                        "name": "Versailles Restaurant",
                        "description": "The most famous Cuban restaurant in Miami - a Little Havana institution since 1971.",
                        "category": "Restaurant",
                        "address": "3555 SW 8th St, Little Havana",
                        "tips": "Order the ropa vieja and a cortadito. Don't skip the pastelitos.",
                        "price_range": "$$",
                        "photo_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "San Francisco Bay Area",
        "description": "Golden Gate views, tech culture, world-class food, and charming neighborhoods in Northern California.",
        "destination": "San Francisco, USA",
        "cover_image_url": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=400&fit=crop",
        "tags": ["city", "food", "nature", "culture"],
        "location_tags": ["san francisco", "california", "usa", "golden gate", "bay area", "alcatraz", "castro", "mission", "haight ashbury"],
        "sections": [
            {
                "title": "Iconic San Francisco",
                "description": "The must-see landmarks",
                "places": [
                    {
                        "name": "Golden Gate Bridge",
                        "description": "Walk or bike across the most photographed bridge in the world.",
                        "category": "Landmark",
                        "address": "Golden Gate Bridge, San Francisco",
                        "tips": "Walk from the city side to Vista Point for the best views. Bring layers - it's windy!",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Alcatraz Island",
                        "description": "Tour the infamous former federal prison with stunning bay views.",
                        "category": "Historic Site",
                        "address": "Alcatraz Island, San Francisco Bay",
                        "tips": "Book tickets weeks in advance! The night tour is incredible if you can get it.",
                        "price_range": "$40",
                        "photo_url": "https://images.unsplash.com/photo-1557409518-691ebcd96038?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Fisherman's Wharf",
                        "description": "Touristy but fun - sea lions, sourdough bread bowls, and bay views.",
                        "category": "Neighborhood",
                        "address": "Fisherman's Wharf, San Francisco",
                        "tips": "Skip the chain restaurants. Grab clam chowder from Boudin and watch the sea lions at Pier 39.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Neighborhoods",
                "description": "SF's diverse districts",
                "places": [
                    {
                        "name": "Mission District",
                        "description": "Vibrant Latino neighborhood with incredible murals, burritos, and nightlife.",
                        "category": "Neighborhood",
                        "address": "Mission District, San Francisco",
                        "tips": "Walk down Clarion Alley for murals. Get a burrito from La Taqueria or El Farolito.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Haight-Ashbury",
                        "description": "Birthplace of the 1960s counterculture movement. Vintage shops and hippie history.",
                        "category": "Neighborhood",
                        "address": "Haight-Ashbury, San Francisco",
                        "tips": "Stop by Amoeba Music for vinyl. Walk to Golden Gate Park afterwards.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Beijing: Imperial China",
        "description": "Ancient palaces, the Great Wall, and vibrant hutongs in China's historic capital.",
        "destination": "Beijing, China",
        "cover_image_url": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=400&fit=crop",
        "tags": ["history", "culture", "food", "architecture"],
        "location_tags": ["beijing", "china", "asia", "great wall", "forbidden city", "tiananmen", "hutong", "temple of heaven"],
        "sections": [
            {
                "title": "Imperial Sites",
                "description": "China's ancient royal heritage",
                "places": [
                    {
                        "name": "Forbidden City",
                        "description": "The world's largest palace complex, home to 24 emperors over 500 years.",
                        "category": "Palace",
                        "address": "Dongcheng District, Beijing",
                        "tips": "Enter from the south (Tiananmen Gate). Allow at least 3 hours. Book tickets online.",
                        "price_range": "$8",
                        "photo_url": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Great Wall at Mutianyu",
                        "description": "Less crowded section of the Great Wall with stunning views and a cable car.",
                        "category": "Historic Site",
                        "address": "Mutianyu, Huairou District",
                        "tips": "Take the cable car up and toboggan down! Go early to avoid crowds.",
                        "price_range": "$15 + $15 cable car",
                        "photo_url": "https://images.unsplash.com/photo-1549893072-4bc678117f45?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Temple of Heaven",
                        "description": "Magnificent temple complex where emperors prayed for good harvests.",
                        "category": "Temple",
                        "address": "Dongcheng District, Beijing",
                        "tips": "Visit early morning to see locals doing tai chi and dancing in the park.",
                        "price_range": "$5",
                        "photo_url": "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Hutong Life",
                "description": "Traditional Beijing neighborhoods",
                "places": [
                    {
                        "name": "Nanluoguxiang Hutong",
                        "description": "Trendy hutong with cafes, boutiques, and traditional courtyard homes.",
                        "category": "Neighborhood",
                        "address": "Nanluoguxiang, Dongcheng",
                        "tips": "Wander the side alleys to escape the crowds and find hidden gems.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Food & Culture",
                "description": "Beijing's culinary traditions",
                "places": [
                    {
                        "name": "Peking Duck at Da Dong",
                        "description": "World-famous Peking duck restaurant known for crispy skin and minimal fat.",
                        "category": "Restaurant",
                        "address": "Multiple locations in Beijing",
                        "tips": "Make reservations. Order the duck with traditional pancakes, scallions, and sauce.",
                        "price_range": "$$$",
                        "photo_url": "https://images.unsplash.com/photo-1523905330026-b8bd1f5f320e?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Shanghai: East Meets West",
        "description": "Futuristic skyline, colonial architecture, and incredible street food in China's most cosmopolitan city.",
        "destination": "Shanghai, China",
        "cover_image_url": "https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800&h=400&fit=crop",
        "tags": ["city", "food", "nightlife", "shopping"],
        "location_tags": ["shanghai", "china", "asia", "pudong", "the bund", "french concession", "nanjing road", "lujiazui"],
        "sections": [
            {
                "title": "Iconic Shanghai",
                "description": "The must-see sights",
                "places": [
                    {
                        "name": "The Bund",
                        "description": "Historic waterfront promenade with colonial architecture and Pudong skyline views.",
                        "category": "Landmark",
                        "address": "Zhongshan East 1st Road, Huangpu",
                        "tips": "Walk here at night when the skyline lights up. Take the tunnel to Pudong for photos.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Oriental Pearl Tower",
                        "description": "Iconic TV tower with observation decks and a glass floor sky walk.",
                        "category": "Observation Deck",
                        "address": "1 Century Avenue, Pudong",
                        "tips": "The Shanghai Tower next door is taller and has better views.",
                        "price_range": "$25",
                        "photo_url": "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Historic Neighborhoods",
                "description": "Shanghai's charming districts",
                "places": [
                    {
                        "name": "French Concession",
                        "description": "Tree-lined streets with European architecture, boutiques, and excellent restaurants.",
                        "category": "Neighborhood",
                        "address": "Xuhui & Luwan Districts",
                        "tips": "Perfect for wandering. Stop for coffee on Wukang Road.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Yu Garden",
                        "description": "Classical Chinese garden from the Ming Dynasty with pavilions and rockeries.",
                        "category": "Garden",
                        "address": "218 Anren Street, Huangpu",
                        "tips": "Go early morning to avoid crowds. Have xiaolongbao at the nearby bazaar.",
                        "price_range": "$5",
                        "photo_url": "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Dumplings & Street Food",
                "description": "Shanghai's famous cuisine",
                "places": [
                    {
                        "name": "Din Tai Fung",
                        "description": "World-famous Taiwanese chain known for perfect xiaolongbao (soup dumplings).",
                        "category": "Restaurant",
                        "address": "Multiple locations",
                        "tips": "Watch the chefs hand-make dumplings through the glass. Order the truffle dumplings.",
                        "price_range": "$$",
                        "photo_url": "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Jamaica: Beyond the Resort",
        "description": "Reggae, jerk chicken, stunning beaches, and mountain adventures on this Caribbean island.",
        "destination": "Jamaica",
        "cover_image_url": "https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?w=800&h=400&fit=crop",
        "tags": ["beaches", "music", "food", "adventure"],
        "location_tags": ["jamaica", "caribbean", "montego bay", "negril", "ocho rios", "kingston", "portland", "blue mountains"],
        "sections": [
            {
                "title": "Beaches & Water",
                "description": "Jamaica's stunning coastline",
                "places": [
                    {
                        "name": "Seven Mile Beach",
                        "description": "Negril's famous stretch of white sand beach with incredible sunsets.",
                        "category": "Beach",
                        "address": "Negril, Westmoreland",
                        "tips": "Watch sunset at Rick's Cafe then head to the beach bars. Water is calm and warm.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Dunn's River Falls",
                        "description": "Climb 600 feet of cascading waterfalls - an iconic Jamaica experience.",
                        "category": "Waterfall",
                        "address": "Ocho Rios, St. Ann",
                        "tips": "Wear water shoes with good grip. Go early to beat the cruise ship crowds.",
                        "price_range": "$25",
                        "photo_url": "https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Culture & Music",
                "description": "The birthplace of reggae",
                "places": [
                    {
                        "name": "Bob Marley Museum",
                        "description": "Tour the home and recording studio of Jamaica's most famous son.",
                        "category": "Museum",
                        "address": "56 Hope Road, Kingston",
                        "tips": "Book ahead. The tour includes personal stories from people who knew him.",
                        "price_range": "$25",
                        "photo_url": "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Jerk & Local Eats",
                "description": "Jamaica's legendary food",
                "places": [
                    {
                        "name": "Boston Bay Jerk Center",
                        "description": "The birthplace of jerk cooking - multiple vendors serving the most authentic jerk.",
                        "category": "Food Stand",
                        "address": "Boston Bay, Portland",
                        "tips": "Try jerk chicken and pork. Order festival (fried dumplings) on the side.",
                        "price_range": "$",
                        "photo_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        "title": "Puerto Rico: Isla del Encanto",
        "description": "Old San Juan's colorful streets, bioluminescent bays, and pristine beaches in this US Caribbean territory.",
        "destination": "Puerto Rico",
        "cover_image_url": "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&h=400&fit=crop",
        "tags": ["beaches", "history", "food", "nature"],
        "location_tags": ["puerto rico", "caribbean", "san juan", "old san juan", "vieques", "el yunque", "rincon", "culebra"],
        "sections": [
            {
                "title": "Old San Juan",
                "description": "500 years of history in colorful streets",
                "places": [
                    {
                        "name": "Old San Juan",
                        "description": "Cobblestone streets, pastel buildings, and Spanish colonial architecture.",
                        "category": "Neighborhood",
                        "address": "Old San Juan, Puerto Rico",
                        "tips": "Wear comfortable shoes for the hills. Best explored on foot.",
                        "price_range": "Free",
                        "photo_url": "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "El Morro Fort",
                        "description": "16th-century Spanish fortress with stunning ocean views and fascinating history.",
                        "category": "Historic Site",
                        "address": "501 Calle Norzagaray, Old San Juan",
                        "tips": "Go late afternoon for golden hour photos. Fly a kite on the lawn like locals do.",
                        "price_range": "$10",
                        "photo_url": "https://images.unsplash.com/photo-1547481887-a26e2cacb5b2?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Natural Wonders",
                "description": "Puerto Rico's incredible nature",
                "places": [
                    {
                        "name": "El Yunque Rainforest",
                        "description": "The only tropical rainforest in the US National Forest System.",
                        "category": "Nature Reserve",
                        "address": "Rio Grande, Puerto Rico",
                        "tips": "Hike to La Mina Falls for a swim. Go early before afternoon rain.",
                        "price_range": "$8",
                        "photo_url": "https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=400&h=300&fit=crop"
                    },
                    {
                        "name": "Bioluminescent Bay",
                        "description": "Paddle through water that glows blue-green at night - truly magical.",
                        "category": "Natural Wonder",
                        "address": "Vieques or Fajardo",
                        "tips": "Go on a moonless night. Vieques has the brightest bay.",
                        "price_range": "$60 for kayak tour",
                        "photo_url": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop"
                    }
                ]
            },
            {
                "title": "Mofongo & More",
                "description": "Puerto Rican cuisine",
                "places": [
                    {
                        "name": "La Placita de Santurce",
                        "description": "Local market by day, epic street party by night. The heart of San Juan nightlife.",
                        "category": "Market/Nightlife",
                        "address": "Santurce, San Juan",
                        "tips": "Thursday and Saturday nights are best. Try a piña colada - it was invented here!",
                        "price_range": "$-$$",
                        "photo_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop"
                    }
                ]
            }
        ]
    },
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

        # Get existing guide titles to avoid duplicates
        result = await session.execute(select(Guide.title))
        existing_titles = {row[0] for row in result.fetchall()}

        for guide_data in PLACEHOLDER_GUIDES:
            if guide_data["title"] in existing_titles:
                print(f"Skipping existing guide: {guide_data['title']}")
                continue

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
