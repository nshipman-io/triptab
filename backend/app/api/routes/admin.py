from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_

from app.api.deps import AdminUser, DbSession
from app.models.user import User
from app.models.trip import Trip
from app.models.guide import Guide, GuideVisibility
from app.models.expense import Expense

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Response Schemas ---

class TopGuide(BaseModel):
    id: str
    title: str
    destination: str
    view_count: int
    author_name: str
    visibility: str


class DailyCount(BaseModel):
    date: str
    count: int


class TrendData(BaseModel):
    daily_signups: list[DailyCount]
    daily_guide_views: list[DailyCount]


class AdminStats(BaseModel):
    total_users: int
    new_users_30d: int
    users_by_auth_provider: dict[str, int]
    total_trips: int
    active_trips: int
    total_guides: int
    public_guides: int
    total_guide_views: int
    total_expenses_count: int
    top_guides: list[TopGuide]


class UserListItem(BaseModel):
    id: str
    email: str
    name: str
    auth_provider: str | None
    is_admin: bool
    created_at: datetime
    trip_count: int
    guide_count: int


class PaginatedUsers(BaseModel):
    users: list[UserListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class GuideListItem(BaseModel):
    id: str
    title: str
    destination: str
    visibility: str
    view_count: int
    author_name: str
    author_email: str
    created_at: datetime


class GuideAnalytics(BaseModel):
    total_guides: int
    public_guides: int
    private_guides: int
    unlisted_guides: int
    total_views: int
    guides: list[GuideListItem]


# --- Endpoints ---

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(admin: AdminUser, db: DbSession):
    """Get overview metrics for the admin dashboard."""

    # Total users
    total_users = await db.scalar(select(func.count(User.id))) or 0

    # New users in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users_30d = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= thirty_days_ago)
    ) or 0

    # Users by auth provider
    provider_result = await db.execute(
        select(User.auth_provider, func.count(User.id))
        .group_by(User.auth_provider)
    )
    users_by_auth_provider = {
        (provider or "email"): count
        for provider, count in provider_result.all()
    }

    # Total trips
    total_trips = await db.scalar(select(func.count(Trip.id))) or 0

    # Active trips (end_date >= today)
    today = date.today()
    active_trips = await db.scalar(
        select(func.count(Trip.id)).where(Trip.end_date >= today)
    ) or 0

    # Total guides
    total_guides = await db.scalar(select(func.count(Guide.id))) or 0

    # Public guides
    public_guides = await db.scalar(
        select(func.count(Guide.id)).where(Guide.visibility == GuideVisibility.PUBLIC)
    ) or 0

    # Total guide views
    total_guide_views = await db.scalar(select(func.sum(Guide.view_count))) or 0

    # Total expenses count
    total_expenses_count = await db.scalar(select(func.count(Expense.id))) or 0

    # Top 5 guides by view count
    top_guides_result = await db.execute(
        select(Guide, User.name)
        .join(User, Guide.author_id == User.id)
        .order_by(Guide.view_count.desc())
        .limit(5)
    )
    top_guides = [
        TopGuide(
            id=str(guide.id),
            title=guide.title,
            destination=guide.destination,
            view_count=guide.view_count,
            author_name=author_name,
            visibility=guide.visibility.value
        )
        for guide, author_name in top_guides_result.all()
    ]

    return AdminStats(
        total_users=total_users,
        new_users_30d=new_users_30d,
        users_by_auth_provider=users_by_auth_provider,
        total_trips=total_trips,
        active_trips=active_trips,
        total_guides=total_guides,
        public_guides=public_guides,
        total_guide_views=total_guide_views,
        total_expenses_count=total_expenses_count,
        top_guides=top_guides
    )


@router.get("/stats/trends", response_model=TrendData)
async def get_admin_trends(
    admin: AdminUser,
    db: DbSession,
    days: int = Query(30, ge=7, le=90)
):
    """Get time-series data for charts."""

    start_date = datetime.utcnow() - timedelta(days=days)

    # Daily signups - group by date
    signup_result = await db.execute(
        select(
            func.date(User.created_at).label('signup_date'),
            func.count(User.id).label('count')
        )
        .where(User.created_at >= start_date)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )

    daily_signups = [
        DailyCount(date=str(row.signup_date), count=row.count)
        for row in signup_result.all()
    ]

    # For guide views, we don't have daily view tracking yet,
    # so we'll show guide creation trends instead (with view_count as indicator)
    guide_result = await db.execute(
        select(
            func.date(Guide.created_at).label('created_date'),
            func.count(Guide.id).label('count')
        )
        .where(Guide.created_at >= start_date)
        .group_by(func.date(Guide.created_at))
        .order_by(func.date(Guide.created_at))
    )

    daily_guide_views = [
        DailyCount(date=str(row.created_date), count=row.count)
        for row in guide_result.all()
    ]

    return TrendData(
        daily_signups=daily_signups,
        daily_guide_views=daily_guide_views
    )


@router.get("/users", response_model=PaginatedUsers)
async def get_admin_users(
    admin: AdminUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", pattern="^(created_at|email|name)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(None)
):
    """Get paginated user list with search and sort."""

    # Base query
    query = select(User)
    count_query = select(func.count(User.id))

    # Apply search filter
    if search:
        search_filter = User.email.ilike(f"%{search}%") | User.name.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    total = await db.scalar(count_query) or 0

    # Apply sorting
    sort_column = getattr(User, sort_by)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()

    # Get trip and guide counts for each user
    user_items = []
    for user in users:
        trip_count = await db.scalar(
            select(func.count(Trip.id)).where(Trip.owner_id == user.id)
        ) or 0
        guide_count = await db.scalar(
            select(func.count(Guide.id)).where(Guide.author_id == user.id)
        ) or 0

        user_items.append(UserListItem(
            id=str(user.id),
            email=user.email,
            name=user.name,
            auth_provider=user.auth_provider,
            is_admin=user.is_admin,
            created_at=user.created_at,
            trip_count=trip_count,
            guide_count=guide_count
        ))

    total_pages = (total + per_page - 1) // per_page

    return PaginatedUsers(
        users=user_items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/guides", response_model=GuideAnalytics)
async def get_admin_guides(
    admin: AdminUser,
    db: DbSession,
    visibility: Optional[str] = Query(None, pattern="^(public|private|unlisted)$"),
    sort_by: str = Query("view_count", pattern="^(view_count|created_at|title)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(20, ge=1, le=100)
):
    """Get guide analytics and list."""

    # Total counts by visibility
    total_guides = await db.scalar(select(func.count(Guide.id))) or 0
    public_guides = await db.scalar(
        select(func.count(Guide.id)).where(Guide.visibility == GuideVisibility.PUBLIC)
    ) or 0
    private_guides = await db.scalar(
        select(func.count(Guide.id)).where(Guide.visibility == GuideVisibility.PRIVATE)
    ) or 0
    unlisted_guides = await db.scalar(
        select(func.count(Guide.id)).where(Guide.visibility == GuideVisibility.UNLISTED)
    ) or 0

    # Total views
    total_views = await db.scalar(select(func.sum(Guide.view_count))) or 0

    # Query guides with author info
    query = (
        select(Guide, User.name, User.email)
        .join(User, Guide.author_id == User.id)
    )

    # Apply visibility filter
    if visibility:
        vis_enum = GuideVisibility(visibility)
        query = query.where(Guide.visibility == vis_enum)

    # Apply sorting
    sort_column = getattr(Guide, sort_by)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column).limit(limit)

    # Execute query
    result = await db.execute(query)
    guides = [
        GuideListItem(
            id=str(guide.id),
            title=guide.title,
            destination=guide.destination,
            visibility=guide.visibility.value,
            view_count=guide.view_count,
            author_name=author_name,
            author_email=author_email,
            created_at=guide.created_at
        )
        for guide, author_name, author_email in result.all()
    ]

    return GuideAnalytics(
        total_guides=total_guides,
        public_guides=public_guides,
        private_guides=private_guides,
        unlisted_guides=unlisted_guides,
        total_views=total_views,
        guides=guides
    )
