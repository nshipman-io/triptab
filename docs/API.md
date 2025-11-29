# API Documentation

The Triptab API is a RESTful API built with FastAPI. Full interactive documentation is available at `/api/v1/docs` when running the server.

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

## Checklists

Manage packing lists, to-do lists, and shopping lists for trips.

### List Checklists

```http
GET /trips/{trip_id}/checklists
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "trip_id": "uuid",
    "name": "Packing List",
    "type": "packing",
    "order": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "items": [
      {
        "id": "uuid",
        "checklist_id": "uuid",
        "content": "Passport",
        "is_checked": false,
        "order": 0
      }
    ]
  }
]
```

### Create Checklist

```http
POST /trips/{trip_id}/checklists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Packing List",
  "type": "packing",
  "order": 0
}
```

**Checklist Types**
- `packing` - Packing items
- `todo` - General to-do tasks
- `shopping` - Shopping items

### Update Checklist

```http
PUT /trips/{trip_id}/checklists/{checklist_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Checklist

```http
DELETE /trips/{trip_id}/checklists/{checklist_id}
Authorization: Bearer <token>
```

### Add Checklist Item

```http
POST /trips/{trip_id}/checklists/{checklist_id}/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Passport",
  "order": 0
}
```

### Update Checklist Item

```http
PUT /trips/{trip_id}/checklists/{checklist_id}/items/{item_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_checked": true
}
```

### Delete Checklist Item

```http
DELETE /trips/{trip_id}/checklists/{checklist_id}/items/{item_id}
Authorization: Bearer <token>
```

### Reorder Checklist Items

```http
PUT /trips/{trip_id}/checklists/{checklist_id}/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Expenses

Track and split expenses among trip members.

### List Expenses

```http
GET /trips/{trip_id}/expenses
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "trip_id": "uuid",
    "paid_by_id": "uuid",
    "description": "Dinner at restaurant",
    "amount": 120.00,
    "currency": "USD",
    "category": "food",
    "split_type": "equal",
    "expense_date": "2024-06-02",
    "notes": "Group dinner",
    "created_at": "2024-01-01T00:00:00Z",
    "splits": [
      {
        "id": "uuid",
        "expense_id": "uuid",
        "user_id": "uuid",
        "amount": 60.00,
        "is_settled": false
      }
    ]
  }
]
```

### Create Expense

```http
POST /trips/{trip_id}/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Dinner at restaurant",
  "amount": 120.00,
  "category": "food",
  "split_type": "equal",
  "expense_date": "2024-06-02",
  "notes": "Group dinner"
}
```

**Expense Categories**
- `food` - Food & drinks
- `transport` - Transportation
- `lodging` - Accommodation
- `activity` - Activities & entertainment
- `shopping` - Shopping
- `other` - Other expenses

**Split Types**
- `equal` - Split equally among all members
- `percentage` - Custom percentage per person
- `shares` - Split by number of shares
- `exact` - Exact amount per person

### Update Expense

```http
PUT /trips/{trip_id}/expenses/{expense_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description"
}
```

### Delete Expense

```http
DELETE /trips/{trip_id}/expenses/{expense_id}
Authorization: Bearer <token>
```

### Get Expense Summary

Get total spending and per-person breakdown.

```http
GET /trips/{trip_id}/expenses/summary
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "total": 500.00,
  "currency": "USD",
  "by_category": {
    "food": 200.00,
    "transport": 150.00,
    "activity": 150.00
  },
  "by_person": {
    "uuid1": {
      "paid": 300.00,
      "owes": 250.00,
      "balance": 50.00
    }
  }
}
```

### Get Settlements

Calculate optimized settlements to minimize transactions.

```http
GET /trips/{trip_id}/expenses/settlements
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "settlements": [
    {
      "from_user_id": "uuid1",
      "from_user_name": "John",
      "to_user_id": "uuid2",
      "to_user_name": "Jane",
      "amount": 50.00
    }
  ]
}
```

### Settle Expense Split

Mark a split as settled.

```http
POST /trips/{trip_id}/expenses/{expense_id}/settle?split_id={split_id}
Authorization: Bearer <token>
```

---

## Import Reservations

Parse confirmation emails and automatically add to itinerary using AI.

### Parse Email

Extract reservation details from email content (preview only, doesn't save).

```http
POST /trips/{trip_id}/import/parse
Authorization: Bearer <token>
Content-Type: application/json

{
  "email_content": "Your flight confirmation for Delta #1234..."
}
```

**Response (200 OK)**
```json
{
  "type": "flight",
  "title": "Delta Flight LAX to JFK",
  "start_date": "2024-06-01",
  "end_date": null,
  "start_time": "08:00",
  "end_time": "16:30",
  "location": "LAX to JFK",
  "confirmation_number": "ABC123",
  "flight_details": {
    "airline": "Delta",
    "flight_number": "1234",
    "departure_airport": "LAX",
    "arrival_airport": "JFK",
    "cabin_class": "economy"
  },
  "confidence": 0.95
}
```

**Reservation Types**
- `flight` - Air travel
- `hotel` - Accommodation
- `car` - Car rental
- `activity` - Tours/activities
- `restaurant` - Restaurant reservations

### Confirm Import

Confirm parsed data and create itinerary item.

```http
POST /trips/{trip_id}/import/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "parsed_data": { /* data from parse response */ },
  "adjustments": {
    "title": "Custom title override"
  }
}
```

**Response (200 OK)**
```json
{
  "id": "uuid",
  "trip_id": "uuid",
  "user_id": "uuid",
  "source": "email_paste",
  "status": "success",
  "created_items": ["uuid"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Import History

```http
GET /trips/{trip_id}/import/history
Authorization: Bearer <token>
```

---

## AI Recommendations

Get AI-powered personalized recommendations for activities, restaurants, and attractions.

### Get Recommendations

```http
GET /trips/{trip_id}/recommendations?category=activities&count=5
Authorization: Bearer <token>
```

**Query Parameters**
- `category` - Type of recommendations: `restaurants`, `activities`, `attractions`
- `count` - Number of recommendations (default: 5, max: 10)

**Response (200 OK)**
```json
{
  "recommendations": [
    {
      "name": "Eiffel Tower",
      "category": "attractions",
      "description": "Iconic iron lattice tower with panoramic city views",
      "location": {
        "address": "Champ de Mars, 5 Avenue Anatole France",
        "lat": 48.8584,
        "lng": 2.2945
      },
      "rating": 4.7,
      "estimated_cost": "$25-30",
      "duration": "2-3 hours",
      "why_recommended": "Must-see landmark that matches your interest in culture",
      "tags": ["landmark", "views", "romantic"]
    }
  ]
}
```

### Add Recommendation to Itinerary

```http
POST /trips/{trip_id}/recommendations/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "recommendation": { /* recommendation object */ },
  "date": "2024-06-02",
  "time": "10:00"
}
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

### ChecklistType
`"packing"` | `"todo"` | `"shopping"`

### ExpenseCategory
`"food"` | `"transport"` | `"lodging"` | `"activity"` | `"shopping"` | `"other"`

### SplitType
`"equal"` | `"percentage"` | `"shares"` | `"exact"`

### ImportSource
`"email_paste"` | `"email_forward"` | `"manual"`

### ImportStatus
`"pending"` | `"success"` | `"failed"`
