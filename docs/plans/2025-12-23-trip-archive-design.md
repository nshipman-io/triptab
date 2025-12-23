# Trip Archive Feature Design

## Overview

Allow users to mark trips as complete and archive them. Archived trips remain fully accessible but are visually separated from active trips on the dashboard.

## Requirements

- Members retain full access to archived trips (viewing and editing)
- Dashboard displays "Active Trips" and "Completed Trips" as separate sections
- Archive action available on both trip detail page and dashboard trip cards
- Easy reactivation with visible button on archived trips
- Simple confirmation modal before archiving

## Data Model

### Backend (Trip Model)

Add a single boolean field:

```python
# In backend/app/models/trip.py
is_archived: bool = Column(Boolean, default=False, nullable=False)
```

### Database Migration

- Add `is_archived` column with default `False`
- Add index on `(owner_id, is_archived)` for efficient queries

### API Changes

New endpoints:
- `POST /trips/{trip_id}/archive` - Mark trip as complete
- `POST /trips/{trip_id}/unarchive` - Reactivate trip

Both return the updated trip. Owner and editors can archive/unarchive.

### Frontend Types

```typescript
interface Trip {
  // ... existing fields
  is_archived: boolean
}
```

## Dashboard UI

### Layout

```
┌─────────────────────────────────────┐
│  Your Trips                         │
├─────────────────────────────────────┤
│  [Trip Card] [Trip Card] [Trip Card]│
│  [Trip Card] [+ New Trip]           │
├─────────────────────────────────────┤
│  Completed Trips              (3)   │  ← Collapsible header with count
├─────────────────────────────────────┤
│  [Trip Card] [Trip Card] [Trip Card]│  ← Muted styling
└─────────────────────────────────────┘
```

### Active Trip Cards

- Add kebab menu (⋮) with "Mark Complete" option

### Completed Trip Cards

- Muted/grayed styling (reduced opacity)
- Small "Completed" badge
- Kebab menu shows "Reactivate" instead
- Full navigation to trip detail preserved

### Completed Section

- Collapsible header (collapsed by default if active trips exist)
- Shows count badge
- Hidden if no completed trips

### Confirmation Modal

- "Mark trip as complete?"
- "You can reactivate it anytime from your dashboard."
- [Cancel] [Complete] buttons

## Trip Detail Page UI

### Archive Action Location

In trip settings area (sidebar on desktop, Info tab on mobile):

```
┌─────────────────────────┐
│  Trip Settings          │
├─────────────────────────┤
│  [Edit Trip]            │
│  [Share Trip]           │
│  [Mark Complete]        │
│  [Delete Trip]          │
└─────────────────────────┘
```

### Archived Trip Appearance

Banner at top when viewing completed trip:

```
┌─────────────────────────────────────────────┐
│ ℹ️ This trip is complete    [Reactivate]    │
├─────────────────────────────────────────────┤
│  [Itinerary] [Expenses] [Checklists] ...    │
```

- "Mark Complete" button changes to "Reactivate"
- All content remains fully accessible and editable

## Permissions

| Role   | Can Archive/Unarchive |
|--------|----------------------|
| Owner  | Yes                  |
| Editor | Yes                  |
| Viewer | No (buttons hidden)  |

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Archived trip with upcoming dates | Allowed |
| Deleting an archived trip | Same as active (owner only) |
| Joining archived trip via share code | Allowed |
| Editing archived trip content | Allowed |

## Implementation Notes

- Client-side filtering for dashboard sections (simpler than separate API calls)
- No notifications when archiving (keep it simple)
- Reuse existing modal component for confirmation
