from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.models import User
from app.schemas import TokenPair, TokenRefresh, UserLogin, UserOut, UserRegister
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return user


@router.post("/login", response_model=TokenPair)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    try:
        user = auth_service.authenticate_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return auth_service.issue_tokens(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: TokenRefresh, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(User).filter(User.email == data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return auth_service.issue_tokens(user)
