"""CrediWiseAI - Authentication API Endpoints.

Provides registration, login, and user profile retrieval with JWT token generation,
password hashing, duplicate protection, and audit logging.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user
from backend.app.core.security import create_access_token, get_password_hash, verify_password
from backend.app.db.session import get_db
from backend.app.models.models import AuditLog, User
from backend.app.schemas.schemas import AuthResponse, UserLoginRequest, UserRegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new applicant account",
)
def register_user(
    payload: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Registers a new applicant account with role='user'.

    Public registration never creates administrator accounts.
    """
    normalized_email = payload.email.lower().strip()

    # 1. Check for existing user
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 2. Create new user with forced role='user'
    hashed_pwd = get_password_hash(payload.password)
    user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hashed_pwd,
        role="user",  # Immutable role assignment for public registration
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 3. Create Audit Log
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=user.id,
        action="USER_REGISTER",
        details=f"User registered with email {user.email}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    # 4. Generate JWT
    token = create_access_token(subject=user.email, role=user.role)

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate user or administrator",
)
def login_user(
    payload: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Authenticates credentials and issues a signed JWT access token."""
    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated.",
        )

    # Record Audit Log
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN",
        details=f"User logged in successfully with email {user.email}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    # Generate JWT
    token = create_access_token(subject=user.email, role=user.role)

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve current user profile",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Returns the authenticated user's profile."""
    return UserResponse.model_validate(current_user)
