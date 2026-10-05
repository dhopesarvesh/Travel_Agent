from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models import Expense, User
from app.schemas import BudgetSummary, ExpenseCreate, ExpenseOut
from app.services import trip_service

router = APIRouter(tags=["expenses"])


@router.get("/trips/{trip_id}/expenses", response_model=list[ExpenseOut])
def list_expenses(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = trip_service.get_user_trip(db, trip_id, user)
    return trip.expenses


@router.post(
    "/trips/{trip_id}/expenses",
    response_model=ExpenseOut,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    trip_id: int,
    payload: ExpenseCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = trip_service.get_user_trip(db, trip_id, user)
    return trip_service.add_expense(db, trip, payload)


@router.get("/trips/{trip_id}/budget", response_model=BudgetSummary)
def get_budget(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = trip_service.get_user_trip(db, trip_id, user)
    return trip_service.budget_summary(trip)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    trip_service.get_user_trip(db, expense.trip_id, user)
    db.delete(expense)
    db.commit()
    return None
