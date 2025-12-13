from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func

from app.api.deps import AdminUser, DbSession
from app.models.user import User
from app.models.trip import Trip
from app.models.guide import Guide, GuideVisibility
from app.models.expense import Expense
from app.models.weather import ApiCallLog

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


# --- Admin Management ---

class SetAdminRequest(BaseModel):
    is_admin: bool


class SetAdminResponse(BaseModel):
    id: str
    email: str
    name: str
    is_admin: bool


@router.patch("/users/{user_id}/admin", response_model=SetAdminResponse)
async def set_user_admin_status(
    user_id: str,
    request: SetAdminRequest,
    admin: AdminUser,
    db: DbSession
):
    """Grant or revoke admin access for a user."""

    # Find the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent removing your own admin access
    if user.id == admin.id and not request.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin access"
        )

    # Update admin status
    user.is_admin = request.is_admin
    await db.commit()
    await db.refresh(user)

    return SetAdminResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        is_admin=user.is_admin
    )


# --- API Usage Analytics ---

class ApiServiceStats(BaseModel):
    service: str
    today_count: int
    month_count: int
    daily_limit: int | None
    cache_hit_rate: float
    avg_response_time_ms: float
    error_rate: float


class ApiDailyCall(BaseModel):
    date: str
    count: int
    cache_hits: int


class ApiUsageAnalytics(BaseModel):
    services: list[ApiServiceStats]
    daily_calls: list[ApiDailyCall]


# Service limits (free tier)
SERVICE_LIMITS = {
    "openweathermap": 1000,  # per day
    "google_places": None,  # varies by plan
    "openai": None,  # varies by plan
}


@router.get("/api-usage", response_model=ApiUsageAnalytics)
async def get_api_usage(
    admin: AdminUser,
    db: DbSession,
    days: int = Query(7, ge=1, le=30)
):
    """Get API usage statistics for monitoring external service calls."""

    today = date.today()
    start_of_today = datetime.combine(today, datetime.min.time())
    start_of_month = datetime.combine(today.replace(day=1), datetime.min.time())
    start_of_range = datetime.combine(today - timedelta(days=days), datetime.min.time())

    # Get unique services
    services_result = await db.execute(
        select(ApiCallLog.service).distinct()
    )
    services = [row[0] for row in services_result.all()]

    service_stats = []
    for service in services:
        # Today's count
        today_count = await db.scalar(
            select(func.count(ApiCallLog.id))
            .where(
                ApiCallLog.service == service,
                ApiCallLog.created_at >= start_of_today,
                ApiCallLog.cache_hit == False  # Only actual API calls
            )
        ) or 0

        # Month's count
        month_count = await db.scalar(
            select(func.count(ApiCallLog.id))
            .where(
                ApiCallLog.service == service,
                ApiCallLog.created_at >= start_of_month,
                ApiCallLog.cache_hit == False
            )
        ) or 0

        # Cache hit rate (all time for this service)
        total_requests = await db.scalar(
            select(func.count(ApiCallLog.id))
            .where(ApiCallLog.service == service)
        ) or 0
        cache_hits = await db.scalar(
            select(func.count(ApiCallLog.id))
            .where(
                ApiCallLog.service == service,
                ApiCallLog.cache_hit == True
            )
        ) or 0
        cache_hit_rate = (cache_hits / total_requests * 100) if total_requests > 0 else 0

        # Average response time (non-cache hits only)
        avg_response_time = await db.scalar(
            select(func.avg(ApiCallLog.response_time_ms))
            .where(
                ApiCallLog.service == service,
                ApiCallLog.cache_hit == False,
                ApiCallLog.response_time_ms.isnot(None)
            )
        ) or 0

        # Error rate (non-2xx responses)
        error_count = await db.scalar(
            select(func.count(ApiCallLog.id))
            .where(
                ApiCallLog.service == service,
                ApiCallLog.cache_hit == False,
                ApiCallLog.status_code.isnot(None),
                ~ApiCallLog.status_code.between(200, 299)
            )
        ) or 0
        api_calls = await db.scalar(
            select(func.count(ApiCallLog.id))
            .where(
                ApiCallLog.service == service,
                ApiCallLog.cache_hit == False
            )
        ) or 0
        error_rate = (error_count / api_calls * 100) if api_calls > 0 else 0

        service_stats.append(ApiServiceStats(
            service=service,
            today_count=today_count,
            month_count=month_count,
            daily_limit=SERVICE_LIMITS.get(service),
            cache_hit_rate=round(cache_hit_rate, 1),
            avg_response_time_ms=round(float(avg_response_time), 0),
            error_rate=round(error_rate, 1)
        ))

    # Daily calls breakdown
    daily_result = await db.execute(
        select(
            func.date(ApiCallLog.created_at).label('call_date'),
            func.count(ApiCallLog.id).label('count'),
            func.sum(func.cast(ApiCallLog.cache_hit, type_=func.Integer)).label('cache_hits')
        )
        .where(ApiCallLog.created_at >= start_of_range)
        .group_by(func.date(ApiCallLog.created_at))
        .order_by(func.date(ApiCallLog.created_at))
    )

    daily_calls = [
        ApiDailyCall(
            date=str(row.call_date),
            count=row.count,
            cache_hits=row.cache_hits or 0
        )
        for row in daily_result.all()
    ]

    return ApiUsageAnalytics(
        services=service_stats,
        daily_calls=daily_calls
    )
