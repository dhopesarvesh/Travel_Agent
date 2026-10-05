from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models import User, UserPreference
from app.schemas import UserLogin, UserRegister


def register_user(db: Session, payload: UserRegister) -> User:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise ValueError("Email already registered")
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role="USER",
    )
    db.add(user)
    db.flush()
    db.add(UserPreference(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: UserLogin) -> User:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise ValueError("Invalid email or password")
    return user


def issue_tokens(user: User) -> dict[str, str]:
    return {
        "access_token": create_access_token(user.email),
        "refresh_token": create_refresh_token(user.email),
        "token_type": "bearer",
    }
