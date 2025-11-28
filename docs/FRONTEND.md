# Frontend Guide

This guide covers the React frontend architecture, component patterns, and how to extend the application.

## Technology Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **React Router 7** - Client-side routing
- **shadcn/ui** - Accessible component primitives

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── progress.tsx
│   ├── questionnaire/      # Trip planning wizard
│   │   └── TripQuestionnaire.tsx
│   └── trip/               # Trip-specific components (future)
│
├── pages/                  # Route components
│   ├── Home.tsx            # Landing page
│   ├── Login.tsx           # Auth - login
│   ├── Register.tsx        # Auth - registration
│   ├── Dashboard.tsx       # User's trips list
│   ├── PlanTrip.tsx        # Trip creation wizard
│   ├── TripDetail.tsx      # Trip view/edit
│   └── JoinTrip.tsx        # Join via share link
│
├── lib/
│   ├── api.ts              # API client
│   └── utils.ts            # Utility functions (cn)
│
├── types/
│   └── index.ts            # TypeScript definitions
│
├── hooks/                  # Custom React hooks (future)
├── App.tsx                 # Router configuration
├── main.tsx                # Entry point
└── index.css               # Global styles + Tailwind
```

## Component Patterns

### UI Components (shadcn/ui)

Base components are in `components/ui/`. These are adapted from shadcn/ui and use:
- **Radix Primitives** for accessibility
- **class-variance-authority (cva)** for variant styling
- **tailwind-merge** for class merging

Example button with variants:

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Usage
<Button variant="outline" size="sm">Click me</Button>
```

### Adding New UI Components

1. Check [ui.shadcn.com](https://ui.shadcn.com) for available components
2. Copy the component code to `components/ui/`
3. Install any required Radix packages
4. Adjust imports to match project structure

```bash
# Example: Adding Dialog component
npm install @radix-ui/react-dialog
```

### Page Components

Pages are in the `pages/` directory and are connected to routes in `App.tsx`:

```tsx
// App.tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/trips/:id" element={<TripDetail />} />
</Routes>
```

### Protected Routes

Currently, protection is handled in each page component by checking auth state:

```tsx
// pages/Dashboard.tsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch {
      navigate('/login')  // Redirect if not authenticated
    }
  }
  fetchData()
}, [navigate])
```

**Future Improvement**: Create a `ProtectedRoute` wrapper component.

## API Integration

### API Client

The `lib/api.ts` file contains the API client:

```tsx
import { api } from '@/lib/api'

// Login
const response = await api.login(email, password)
api.setToken(response.access_token)

// Make authenticated requests
const trips = await api.getTrips()
const trip = await api.createTrip({ name: 'My Trip', ... })
```

### Adding New API Methods

```tsx
// lib/api.ts
class ApiClient {
  // Add new methods here
  async searchFlights(params: FlightSearchParams) {
    return this.request('/flights/search', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }
}
```

## Styling

### Tailwind CSS 4

The project uses Tailwind CSS 4 with the new `@theme` directive:

```css
/* index.css */
@import "tailwindcss";

@theme {
  --color-primary: hsl(221.2 83.2% 53.3%);
  --color-primary-foreground: hsl(210 40% 98%);
  /* ... more custom colors */
}
```

### Using Custom Colors

```tsx
<div className="bg-primary text-primary-foreground">
  Primary colored element
</div>

<div className="text-muted-foreground">
  Muted text
</div>
```

### The `cn()` Utility

Merge Tailwind classes conditionally:

```tsx
import { cn } from '@/lib/utils'

<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-primary",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  Click
</button>
```

## State Management

Currently using React's built-in hooks:
- `useState` for local component state
- `useEffect` for side effects and data fetching
- `useReducer` for complex state (see TripQuestionnaire)

### Future Considerations

For more complex state needs, consider:
- **Zustand** - Simple, minimal boilerplate
- **TanStack Query** - Server state management
- **React Context** - For auth/theme state

## Type Definitions

All types are centralized in `types/index.ts`:

```tsx
// types/index.ts
export interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  preferences: TripPreferences
  share_code: string
  owner_id: string
}

// Usage
import type { Trip } from '@/types'

const [trip, setTrip] = useState<Trip | null>(null)
```

## Extending the Application

### Adding a New Page

1. Create the page component:
```tsx
// pages/Settings.tsx
export function Settings() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
    </div>
  )
}
```

2. Add the route:
```tsx
// App.tsx
import { Settings } from '@/pages/Settings'

<Route path="/settings" element={<Settings />} />
```

### Adding a New Feature Component

1. Create component in appropriate directory:
```tsx
// components/trip/TripMap.tsx
interface TripMapProps {
  items: ItineraryItem[]
}

export function TripMap({ items }: TripMapProps) {
  // Map implementation
}
```

2. Import and use in pages:
```tsx
// pages/TripDetail.tsx
import { TripMap } from '@/components/trip/TripMap'

<TripMap items={items} />
```

## Development Tips

### Path Aliases

The project uses `@/` as an alias for `src/`:

```tsx
// Instead of:
import { Button } from '../../../components/ui/button'

// Use:
import { Button } from '@/components/ui/button'
```

### Hot Reload

Vite provides instant HMR. Changes to components reflect immediately without full page reload.

### Type Checking

Run type check separately from build:

```bash
npx tsc --noEmit
```

### Linting

ESLint is configured. Run with:

```bash
npm run lint
```
