from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select
from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create admin user if ADMIN_PASSWORD is set
    if settings.ADMIN_PASSWORD:
        await create_admin_user()


async def create_admin_user():
    """Create or update the base admin user on startup."""
    from app.models.user import User
    from app.core.security import get_password_hash

    async with async_session_maker() as session:
        # Check if admin user exists
        result = await session.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        admin_user = result.scalar_one_or_none()

        if admin_user:
            # Update existing admin user password and ensure is_admin is True
            admin_user.hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin_user.is_admin = True
            print(f"Admin user updated: {settings.ADMIN_EMAIL}")
        else:
            # Create new admin user
            admin_user = User(
                email=settings.ADMIN_EMAIL,
                name="Triptab Admin",
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                is_admin=True,
                auth_provider="email",
            )
            session.add(admin_user)
            print(f"Admin user created: {settings.ADMIN_EMAIL}")

        await session.commit()
