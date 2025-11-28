# Development Guide

This guide covers setting up your development environment, running the application, and contributing to the codebase.

## Prerequisites

- **Docker & Docker Compose** - For containerized development
- **Node.js 20+** - For frontend development outside Docker
- **Python 3.12+** - For backend development outside Docker
- **Git** - Version control

## Quick Start with Docker

The fastest way to get started:

```bash
# Clone and enter the project
cd triply

# Start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:5173
# - Backend:  http://localhost:8000
# - API Docs: http://localhost:8000/api/v1/docs
# - Database: localhost:5432
```

### Docker Commands

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild after dependency changes
docker-compose up --build
```

## Local Development (Without Docker)

### Database Setup

Start only the database with Docker:

```bash
docker-compose up -d db
```

Or install PostgreSQL locally and create the database:

```sql
CREATE DATABASE triply;
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Run the server
uvicorn app.main:app --reload

# Server runs at http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run the development server
npm run dev

# App runs at http://localhost:5173
```

## Project Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/triply
DATABASE_URL_SYNC=postgresql://postgres:postgres@localhost:5432/triply

# Security
SECRET_KEY=your-secret-key-at-least-32-characters

# CORS (JSON array of allowed origins)
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Debug mode
DEBUG=true
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Database Migrations

The application uses SQLAlchemy with auto-migration on startup. For production, consider using Alembic:

```bash
cd backend

# Initialize Alembic (first time only)
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Testing

### Backend Tests

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# With coverage
pytest --cov=app
```

### Frontend Tests

```bash
cd frontend

# Install test dependencies
npm install -D vitest @testing-library/react

# Run tests
npm test

# With coverage
npm run test:coverage
```

## Code Style

### Backend (Python)

The project follows PEP 8. Use these tools:

```bash
# Format with Black
pip install black
black app/

# Sort imports with isort
pip install isort
isort app/

# Type checking with mypy
pip install mypy
mypy app/

# Lint with ruff
pip install ruff
ruff check app/
```

### Frontend (TypeScript)

ESLint and Prettier are configured:

```bash
# Lint
npm run lint

# Format (if Prettier is configured)
npx prettier --write src/
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create/update the model** (if needed):
```python
# backend/app/models/new_model.py
class NewModel(Base):
    __tablename__ = "new_models"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    # ... fields
```

2. **Create the schema**:
```python
# backend/app/schemas/new_model.py
class NewModelCreate(BaseModel):
    field: str

class NewModelResponse(BaseModel):
    id: str
    field: str

    class Config:
        from_attributes = True
```

3. **Create the route**:
```python
# backend/app/api/routes/new_route.py
from fastapi import APIRouter
router = APIRouter(prefix="/new", tags=["new"])

@router.get("", response_model=list[NewModelResponse])
async def list_items(db: DbSession, current_user: CurrentUser):
    # Implementation
```

4. **Register the route**:
```python
# backend/app/main.py
from app.api.routes import new_route
app.include_router(new_route.router, prefix=settings.API_V1_PREFIX)
```

### Adding a New Frontend Page

1. **Create the page component**:
```tsx
// frontend/src/pages/NewPage.tsx
export function NewPage() {
  return <div>New Page Content</div>
}
```

2. **Add the route**:
```tsx
// frontend/src/App.tsx
import { NewPage } from '@/pages/NewPage'

<Route path="/new" element={<NewPage />} />
```

3. **Add API methods** (if needed):
```tsx
// frontend/src/lib/api.ts
async getNewItems() {
  return this.request('/new')
}
```

### Adding a New UI Component

1. Check [ui.shadcn.com](https://ui.shadcn.com) for the component
2. Install required Radix packages
3. Copy component code to `frontend/src/components/ui/`
4. Adjust imports

Example adding Dialog:

```bash
npm install @radix-ui/react-dialog
```

```tsx
// frontend/src/components/ui/dialog.tsx
// Copy from shadcn/ui and adjust imports
```

## Debugging

### Backend Debugging

1. **Enable debug logging**:
```python
# In app/core/config.py
DEBUG: bool = True
```

2. **Use print statements** or logging:
```python
import logging
logger = logging.getLogger(__name__)
logger.info("Debug info here")
```

3. **VSCode debugging**:
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### Frontend Debugging

1. **React DevTools** - Browser extension
2. **Console logging**:
```tsx
console.log('Debug:', variable)
```
3. **VSCode debugging** with browser debug extension

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs db

# Connect directly to database
docker-compose exec db psql -U postgres -d triply
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # or :5173

# Kill process
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Backend
pip install -r requirements.txt

# Frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

Check that the frontend URL is in `CORS_ORIGINS` in backend config.

## Production Deployment

### Using Docker Compose (Production)

```bash
# Create production .env file
cp .env.example .env.prod
# Edit with production values

# Build and run
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Environment Variables for Production

```env
POSTGRES_USER=triply_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=triply_prod
SECRET_KEY=<32+-character-secret>
CORS_ORIGINS=["https://yourdomain.com"]
DEBUG=false
```

## Getting Help

- Check existing documentation in `/docs`
- Review the API docs at `/api/v1/docs`
- Open an issue on GitHub for bugs
- Check FastAPI and React documentation for framework-specific questions
