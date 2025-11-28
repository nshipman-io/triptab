# API Documentation

The Triply API is a RESTful API built with FastAPI. Full interactive documentation is available at `/api/v1/docs` when running the server.

## Base URL

```
Development: http://localhost:8000/api/v1
Production:  https://your-domain.com/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Register

Create a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (201 Created)**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Login

Authenticate and receive an access token.

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=securepassword
```

**Response (200 OK)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

---

## Trips

### List Trips

Get all trips where the user is owner or member.

```http
GET /trips
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "name": "Trip to Paris",
    "destination": "Paris, France",
    "start_date": "2024-06-01",
    "end_date": "2024-06-07",
    "preferences": {
      "travel_type": "couple",
      "budget_range": "moderate",
      "activities": ["culture", "food"]
    },
    "share_code": "abc123xyz",
    "owner_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Trip

```http
POST /trips
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Trip to Paris",
  "destination": "Paris, France",
  "start_date": "2024-06-01",
  "end_date": "2024-06-07",
  "preferences": {
    "travel_type": "couple",
    "budget_range": "moderate",
    "activities": ["culture", "food"],
    "num_travelers": 2
  }
}
```

### Get Trip

```http
GET /trips/{trip_id}
Authorization: Bearer <token>
```

### Get Trip by Share Code

Public endpoint - no authentication required.

```http
GET /trips/share/{share_code}
```

### Update Trip

Requires owner or editor role.

```http
PUT /trips/{trip_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Trip Name"
}
```

### Delete Trip

Requires owner role.

```http
DELETE /trips/{trip_id}
Authorization: Bearer <token>
```

---

## Trip Members

### Join Trip

Join a trip using a share code.

```http
POST /trips/join/{share_code}
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "id": "uuid",
  "trip_id": "uuid",
  "user_id": "uuid",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "role": "viewer",
  "status": "accepted",
  "tickets_confirmed": false,
  "joined_at": "2024-01-01T00:00:00Z"
}
```

### List Trip Members

```http
GET /trips/{trip_id}/members
Authorization: Bearer <token>
```

### Update Member

Update role, status, or ticket confirmation. Users can update their own ticket status; owners can update roles.

```http
PUT /trips/{trip_id}/members/{member_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "editor",
  "tickets_confirmed": true
}
```

### Remove Member

Requires owner role.

```http
DELETE /trips/{trip_id}/members/{member_id}
Authorization: Bearer <token>
```

---

## Itinerary Items

### List Items

```http
GET /trips/{trip_id}/itinerary
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "trip_id": "uuid",
    "type": "flight",
    "title": "Flight to Paris",
    "description": "Direct flight from JFK",
    "location": "JFK → CDG",
    "start_time": "2024-06-01T08:00:00Z",
    "end_time": "2024-06-01T20:00:00Z",
    "price": 450.00,
    "currency": "USD",
    "booking_url": "https://...",
    "booking_confirmed": true,
    "notes": "Window seat requested",
    "order": 0
  }
]
```

### Create Item

Requires owner or editor role.

```http
POST /trips/{trip_id}/itinerary
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "flight",
  "title": "Flight to Paris",
  "start_time": "2024-06-01T08:00:00Z",
  "price": 450.00,
  "order": 0
}
```

**Item Types**
- `flight` - Air travel
- `hotel` - Accommodation
- `experience` - Activities, tours, attractions
- `restaurant` - Dining
- `transport` - Ground transportation

### Update Item

```http
PUT /trips/{trip_id}/itinerary/{item_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_confirmed": true
}
```

### Delete Item

```http
DELETE /trips/{trip_id}/itinerary/{item_id}
Authorization: Bearer <token>
```

### Reorder Item

```http
PUT /trips/{trip_id}/itinerary/{item_id}/reorder?new_order=2
Authorization: Bearer <token>
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Error message here"
}
```

**Common Status Codes**
| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Invalid data format |
| 500 | Server Error - Something went wrong |

---

## Data Types

### TravelType
`"solo"` | `"couple"` | `"friends"` | `"family"`

### BudgetRange
`"budget"` | `"moderate"` | `"luxury"`

### ActivityPreference
`"adventure"` | `"relaxation"` | `"culture"` | `"food"` | `"nature"` | `"nightlife"`

### MemberRole
`"owner"` | `"editor"` | `"viewer"`

### MemberStatus
`"pending"` | `"accepted"` | `"declined"`

### ItineraryItemType
`"flight"` | `"hotel"` | `"experience"` | `"restaurant"` | `"transport"`
