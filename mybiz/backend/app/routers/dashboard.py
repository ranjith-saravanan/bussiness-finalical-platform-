from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Income, Expense, Budget, Savings, Business, Sale, BusinessTransaction
from app.schemas import DashboardSummary
from app.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Personal Income
    total_income = db.query(func.coalesce(func.sum(Income.amount), 0.0))\
        .filter(Income.user_id == current_user.id).scalar()

    # 2. Personal Expenses
    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0.0))\
        .filter(Expense.user_id == current_user.id).scalar()

    net_personal_cashflow = total_income - total_expenses

    # 3. Savings
    savings_stats = db.query(
        func.coalesce(func.sum(Savings.current_amount), 0.0),
        func.coalesce(func.sum(Savings.target_amount), 0.0)
    ).filter(Savings.user_id == current_user.id).first()
    savings_current, savings_target = savings_stats

    # 4. Budgets
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year

    total_budget_allocated = db.query(func.coalesce(func.sum(Budget.amount), 0.0))\
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == current_month,
            Budget.year == current_year
        ).scalar()

    # Calculate actual expenses for the budgeted month
    month_prefix = f"{current_year}-{current_month:02d}"
    total_budget_spent = db.query(func.coalesce(func.sum(Expense.amount), 0.0))\
        .filter(
            Expense.user_id == current_user.id,
            Expense.date.startswith(month_prefix)
        ).scalar()

    # 5. Business Stats (All businesses owned by user)
    user_biz_ids = [b.id for b in current_user.businesses]

    biz_revenue = 0.0
    biz_expenses = 0.0

    if user_biz_ids:
        # Revenue from recorded sales
        sales_total = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
            .filter(Sale.business_id.in_(user_biz_ids), Sale.status == "paid").scalar()
        
        # Additional revenue from transactions
        extra_rev = db.query(func.coalesce(func.sum(BusinessTransaction.amount), 0.0))\
            .filter(
                BusinessTransaction.business_id.in_(user_biz_ids),
                BusinessTransaction.type == "revenue"
            ).scalar()
        biz_revenue = sales_total + extra_rev

        # Business expenses
        biz_expenses = db.query(func.coalesce(func.sum(BusinessTransaction.amount), 0.0))\
            .filter(
                BusinessTransaction.business_id.in_(user_biz_ids),
                BusinessTransaction.type == "expense"
            ).scalar()

    biz_profit = biz_revenue - biz_expenses
    net_total_cashflow = net_personal_cashflow + biz_profit

    # 6. Recent transactions
    recent_txs = []

    # Get recent 5 personal expenses
    recent_expenses = db.query(Expense)\
        .filter(Expense.user_id == current_user.id)\
        .order_by(Expense.date.desc(), Expense.id.desc())\
        .limit(5).all()
    for e in recent_expenses:
        recent_txs.append({
            "id": f"exp-{e.id}",
            "type": "Personal Expense",
            "title": e.title,
            "category": e.category,
            "amount": -abs(e.amount),
            "date": e.date
        })

    # Get recent 5 personal incomes
    recent_incomes = db.query(Income)\
        .filter(Income.user_id == current_user.id)\
        .order_by(Income.date.desc(), Income.id.desc())\
        .limit(5).all()
    for i in recent_incomes:
        recent_txs.append({
            "id": f"inc-{i.id}",
            "type": "Personal Income",
            "title": i.source,
            "category": i.category,
            "amount": abs(i.amount),
            "date": i.date
        })

    # Sort combined recent transactions by date descending
    recent_txs.sort(key=lambda x: x["date"], reverse=True)
    recent_txs = recent_txs[:8]

    return DashboardSummary(
        total_personal_income=round(total_income, 2),
        total_personal_expense=round(total_expenses, 2),
        net_personal_cashflow=round(net_personal_cashflow, 2),
        total_savings_current=round(savings_current, 2),
        total_savings_target=round(savings_target, 2),
        total_budget_allocated=round(total_budget_allocated, 2),
        total_budget_spent=round(total_budget_spent, 2),
        business_revenue=round(biz_revenue, 2),
        business_expenses=round(biz_expenses, 2),
        business_profit=round(biz_profit, 2),
        net_total_cashflow=round(net_total_cashflow, 2),
        recent_transactions=recent_txs
    )
