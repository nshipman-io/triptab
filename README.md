# Triptab - Collaborative Travel Planning

Triptab is a travel planning application that helps users create, manage, and share trip itineraries with friends and family.

## Quick Start

```bash
# Start all services (database, backend, frontend)
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/v1
# API Docs: http://localhost:8000/api/v1/docs
```

## Features

- **Trip Planning Wizard** - Guided questionnaire to capture travel preferences
- **Itinerary Management** - Add flights, hotels, experiences, restaurants, and transport
- **Shareable Links** - Invite others to view and collaborate on trips
- **Member Tracking** - See who's joined and confirmed their bookings
- **Role-Based Access** - Owner, editor, and viewer permissions

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Frontend Guide](./docs/FRONTEND.md)
- [Development Guide](./docs/DEVELOPMENT.md)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| Routing | React Router v7 |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT tokens (python-jose) |
| Containerization | Docker, Docker Compose |

## Project Structure

```
triptab/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI and feature components
│   │   ├── pages/            # Route pages
│   │   ├── lib/              # Utilities and API client
│   │   └── types/            # TypeScript definitions
│   └── Dockerfile
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers and dependencies
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic (future)
│   └── Dockerfile
│
├── docker-compose.yml        # Development environment
└── docker-compose.prod.yml   # Production environment
```

## License

MIT
