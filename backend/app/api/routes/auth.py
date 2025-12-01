from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from typing import Annotated
from google.oauth2 import id_token
from google.auth.transport import requests

from app.api.deps import DbSession, CurrentUser
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, GoogleAuthRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: DbSession):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=get_password_hash(user_data.password),
        auth_provider="email"
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession
):
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)

    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/google", response_model=Token)
async def google_auth(auth_data: GoogleAuthRequest, db: DbSession):
    """Authenticate with Google OAuth"""
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            auth_data.credential,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        # Get user info from token
        email = idinfo.get("email")
        name = idinfo.get("name", email.split("@")[0])
        picture = idinfo.get("picture")
        google_id = idinfo.get("sub")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )

        # Check if user exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            # Update user info if needed
            if not user.auth_provider:
                user.auth_provider = "google"
                user.provider_id = google_id
            if picture and not user.avatar_url:
                user.avatar_url = picture
            await db.flush()
            await db.refresh(user)
        else:
            # Create new user
            user = User(
                email=email,
                name=name,
                avatar_url=picture,
                auth_provider="google",
                provider_id=google_id
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)

        access_token = create_access_token(subject=user.id)

        return Token(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return current_user
