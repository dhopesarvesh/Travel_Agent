from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models import User, UserPreference
from app.schemas import UserOut, UserPreferenceOut, UserPreferenceUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/me/preferences", response_model=UserPreferenceOut)
def get_preferences(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = user.preferences
    if not prefs:
        prefs = UserPreference(user_id=user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


@router.put("/me/preferences", response_model=UserPreferenceOut)
def update_preferences(
    payload: UserPreferenceUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prefs = user.preferences
    if not prefs:
        prefs = UserPreference(user_id=user.id)
        db.add(prefs)
        db.flush()
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, key, value)
    db.commit()
    db.refresh(prefs)
    return prefs
