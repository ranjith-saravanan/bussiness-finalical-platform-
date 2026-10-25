from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, Income, Expense
from app.schemas import ForecastResponse
from app.auth import get_current_user
from app.services.forecast_service import forecast_next_period

router = APIRouter(prefix="/forecast", tags=["Forecasting"])

@router.get("", response_model=ForecastResponse)
def get_financial_forecast(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    incomes = db.query(Income).filter(Income.user_id == current_user.id).order_by(Income.date.asc()).all()
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).order_by(Expense.date.asc()).all()

    # Aggregate by month
    monthly_incomes = {}
    monthly_expenses = {}

    for i in incomes:
        m = i.date[:7] if len(i.date) >= 7 else "Unknown"
        monthly_incomes[m] = monthly_incomes.get(m, 0.0) + i.amount

    for e in expenses:
        m = e.date[:7] if len(e.date) >= 7 else "Unknown"
        monthly_expenses[m] = monthly_expenses.get(m, 0.0) + e.amount

    all_months = sorted(list(set(list(monthly_incomes.keys()) + list(monthly_expenses.keys()))))
    
    # Filter valid months
    all_months = [m for m in all_months if len(m) == 7 and m.startswith("20")]

    income_series = [monthly_incomes.get(m, 0.0) for m in all_months]
    expense_series = [monthly_expenses.get(m, 0.0) for m in all_months]

    # Calculate next month string
    now = datetime.now(timezone.utc)
    next_m_val = now.month + 1 if now.month < 12 else 1
    next_y_val = now.year if now.month < 12 else now.year + 1
    forecast_month = f"{next_y_val}-{next_m_val:02d}"

    forecast_inc = forecast_next_period(income_series, fallback_avg=sum(income_series)/len(income_series) if income_series else 0.0)
    forecast_exp = forecast_next_period(expense_series, fallback_avg=sum(expense_series)/len(expense_series) if expense_series else 0.0)
    forecast_net = forecast_inc - forecast_exp

    if forecast_net > 0:
        trend = "positive"
    elif forecast_net < 0:
        trend = "negative"
    else:
        trend = "neutral"

    return ForecastResponse(
        historical_months=all_months,
        forecast_month=forecast_month,
        forecasted_income=round(forecast_inc, 2),
        forecasted_expenses=round(forecast_exp, 2),
        forecasted_net_cashflow=round(forecast_net, 2),
        trend_direction=trend,
        disclaimer="Estimated projection using statistical linear regression and moving average. This is not guaranteed financial advice."
    )
