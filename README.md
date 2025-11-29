# Triptab - Collaborative Travel Planning

Triptab is a travel planning application that helps users create, manage, and share trip itineraries with friends and family. Features AI-powered email parsing, expense tracking, and personalized recommendations.

## Quick Start

```bash
# Start all services (database, backend, frontend)
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/v1
# API Docs: http://localhost:8000/api/v1/docs
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required for AI features (import parsing, recommendations)
OPENAI_API_KEY=your_openai_api_key

# Database (defaults provided for development)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=triptab

# Backend
SECRET_KEY=your_secret_key
```

## Features

### Core Features
- **Trip Planning Wizard** - Guided questionnaire to capture travel preferences
- **Itinerary Management** - Add flights, hotels, experiences, restaurants, and transport
- **Shareable Links** - Invite others to view and collaborate on trips
- **Member Tracking** - See who's joined and confirmed their bookings
- **Role-Based Access** - Owner, editor, and viewer permissions

### New MVP Features
- **AI Email Import** - Paste confirmation emails to automatically extract and add reservations
- **Expense Tracking** - Track expenses with multiple split options (equal, percentage, shares, exact)
- **Settlement Calculator** - Optimized settlements to minimize transactions between travelers
- **Checklists** - Packing lists, to-do lists, and shopping lists
- **AI Recommendations** - Get personalized suggestions for restaurants, activities, and attractions
- **Affiliate Booking Links** - Quick links to Booking.com, Hotels.com, Airbnb, Kayak, Skyscanner, and more

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Frontend Guide](./docs/FRONTEND.md)
- [Development Guide](./docs/DEVELOPMENT.md)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| Routing | React Router v7 |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT tokens (python-jose) |
| AI | OpenAI GPT-4o-mini via Pydantic AI |
| Containerization | Docker, Docker Compose |

## Project Structure

```
triptab/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI and feature components
│   │   │   ├── checklists/   # Checklist management
│   │   │   ├── expenses/     # Expense tracking
│   │   │   ├── import/       # Email import dialog
│   │   │   ├── itinerary/    # Itinerary item forms
│   │   │   ├── recommendations/ # AI recommendations
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── pages/            # Route pages
│   │   ├── lib/              # Utilities, API client, affiliates
│   │   └── types/            # TypeScript definitions
│   └── Dockerfile
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   └── routes/       # Endpoint modules
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── checklist.py  # Checklist & ChecklistItem
│   │   │   ├── expense.py    # Expense & ExpenseSplit
│   │   │   └── import_log.py # Import tracking
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   │       ├── ai/           # Pydantic AI agents
│   │       │   ├── agents.py # Email parser & recommendations agents
│   │       │   ├── schemas.py # AI output schemas
│   │       │   ├── email_parser.py
│   │       │   └── recommendations.py
│   │       └── expense/      # Expense calculations
│   │           ├── split_calculator.py
│   │           └── settlement.py
│   └── Dockerfile
│
├── docs/                     # Documentation
├── docker-compose.yml        # Development environment
└── docker-compose.prod.yml   # Production environment
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Get access token
- `GET /auth/me` - Get current user

### Trips
- `GET /trips` - List user's trips
- `POST /trips` - Create trip
- `GET /trips/{id}` - Get trip details
- `PUT /trips/{id}` - Update trip
- `DELETE /trips/{id}` - Delete trip
- `GET /trips/share/{code}` - Get trip by share code
- `POST /trips/join/{code}` - Join trip

### Itinerary
- `GET /trips/{id}/itinerary` - List items
- `POST /trips/{id}/itinerary` - Create item
- `PUT /trips/{id}/itinerary/{item_id}` - Update item
- `DELETE /trips/{id}/itinerary/{item_id}` - Delete item

### Checklists
- `GET /trips/{id}/checklists` - List checklists
- `POST /trips/{id}/checklists` - Create checklist
- `PUT /trips/{id}/checklists/{checklist_id}` - Update checklist
- `DELETE /trips/{id}/checklists/{checklist_id}` - Delete checklist
- `POST /trips/{id}/checklists/{checklist_id}/items` - Add item
- `PUT /trips/{id}/checklists/{checklist_id}/items/{item_id}` - Update item
- `DELETE /trips/{id}/checklists/{checklist_id}/items/{item_id}` - Delete item

### Expenses
- `GET /trips/{id}/expenses` - List expenses
- `POST /trips/{id}/expenses` - Create expense
- `PUT /trips/{id}/expenses/{expense_id}` - Update expense
- `DELETE /trips/{id}/expenses/{expense_id}` - Delete expense
- `GET /trips/{id}/expenses/summary` - Get expense summary
- `GET /trips/{id}/expenses/settlements` - Get optimized settlements

### Import (AI-powered)
- `POST /trips/{id}/import/parse` - Parse email content
- `POST /trips/{id}/import/confirm` - Confirm and create item
- `GET /trips/{id}/import/history` - Get import history

### Recommendations (AI-powered)
- `GET /trips/{id}/recommendations` - Get personalized recommendations
- `POST /trips/{id}/recommendations/add` - Add to itinerary

## License

MIT
