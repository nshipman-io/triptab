# Architecture Overview

This document explains the architectural decisions and patterns used in Triptab.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │     API Client          │  │
│  │             │  │             │  │  (lib/api.ts)           │  │
│  │ - Home      │  │ - UI        │  │                         │  │
│  │ - Login     │  │ - Question- │  │  Handles all HTTP       │  │
│  │ - Dashboard │  │   naire     │  │  requests to backend    │  │
│  │ - TripDetail│  │ - Trip      │  │  with JWT auth          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routes    │  │   Schemas   │  │      Security           │  │
│  │             │  │  (Pydantic) │  │                         │  │
│  │ - /auth     │  │             │  │  - JWT token creation   │  │
│  │ - /trips    │  │ Validate    │  │  - Password hashing     │  │
│  │ - /itinerary│  │ request/    │  │  - Auth dependencies    │  │
│  │             │  │ response    │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Models (SQLAlchemy)                       │ │
│  │   User  ─────<  Trip  ─────<  ItineraryItem                 │ │
│  │                  │                                           │ │
│  │                  └────<  TripMember                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Async SQL
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
│                                                                  │
│   users │ trips │ trip_members │ itinerary_items                │
└─────────────────────────────────────────────────────────────────┘
```

## Design Decisions

### 1. Frontend Architecture

**React with TypeScript**
- Type safety reduces runtime errors
- Better IDE support and refactoring
- Self-documenting code through types

**Vite over Create React App**
- Significantly faster development builds
- Native ES modules support
- Better production optimization

**shadcn/ui Components**
- Not a component library - actual source code you own
- Built on Radix primitives for accessibility
- Fully customizable with Tailwind CSS
- No dependency lock-in

**Component Organization**
```
components/
├── ui/           # Base UI primitives (button, card, input)
├── questionnaire/# Trip planning wizard components
└── trip/         # Trip-specific components (future)
```

### 2. Backend Architecture

**FastAPI Framework**
- Async-first for high concurrency
- Automatic OpenAPI documentation
- Pydantic integration for validation
- Type hints throughout

**Layered Architecture**
```
api/routes/     → HTTP handlers, request/response
schemas/        → Data validation and serialization
models/         → Database entities
services/       → Business logic (to be added)
core/           → Configuration and utilities
```

**Async SQLAlchemy**
- Non-blocking database operations
- Connection pooling with asyncpg
- Modern SQLAlchemy 2.0 patterns

### 3. Database Design

**Entity Relationships**
```
User (1) ────< (N) Trip           # User owns many trips
Trip (1) ────< (N) TripMember     # Trip has many members
Trip (1) ────< (N) ItineraryItem  # Trip has many items
User (1) ────< (N) TripMember     # User can be member of many trips
```

**Key Design Choices**

1. **UUID Primary Keys**
   - No sequential ID exposure
   - Safe to expose in URLs
   - Works well with distributed systems

2. **Share Codes**
   - Short, URL-safe tokens for sharing
   - Separate from trip IDs for security
   - Can be regenerated if needed

3. **JSON Preferences**
   - Flexible schema for trip preferences
   - Easy to extend without migrations
   - Queried infrequently

4. **Soft Relationships**
   - TripMember links Users to Trips
   - Enables role-based permissions
   - Tracks join status and confirmations

### 4. Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────>│  Login   │────>│  Store   │
│          │     │  API     │     │  Token   │
└──────────┘     └──────────┘     └──────────┘
     │                                  │
     │  Authorization: Bearer <token>   │
     │<─────────────────────────────────│
     │                                  │
     ▼                                  ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Protected│────>│  Verify  │────>│  Return  │
│  Request │     │  Token   │     │  Data    │
└──────────┘     └──────────┘     └──────────┘
```

**Token Strategy**
- JWT tokens with 7-day expiry
- Stored in localStorage (consider httpOnly cookies for production)
- Refresh token flow not implemented (future enhancement)

### 5. API Design Principles

**RESTful Conventions**
```
GET    /trips              # List user's trips
POST   /trips              # Create trip
GET    /trips/{id}         # Get single trip
PUT    /trips/{id}         # Update trip
DELETE /trips/{id}         # Delete trip

GET    /trips/{id}/itinerary        # List items
POST   /trips/{id}/itinerary        # Add item
PUT    /trips/{id}/itinerary/{item} # Update item
DELETE /trips/{id}/itinerary/{item} # Delete item
```

**Response Patterns**
- Consistent JSON structure
- Pydantic models ensure type safety
- Proper HTTP status codes

## Future Considerations

### Scalability
- Add Redis for caching and sessions
- Consider read replicas for database
- CDN for static assets

### Real-time Features
- WebSocket support for live collaboration
- Presence indicators for active users
- Real-time itinerary updates

### External Integrations
- Flight search APIs (Amadeus, Skyscanner)
- Hotel booking APIs (Booking.com, Hotels.com)
- Maps integration (Google Maps, Mapbox)

### Security Enhancements
- Rate limiting
- OAuth2 social login
- Refresh token rotation
- CSRF protection
