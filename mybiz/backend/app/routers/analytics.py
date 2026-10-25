from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Income, Expense, Budget, Savings, Business, Sale, BusinessTransaction
from app.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/personal")
def get_personal_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Expense Breakdown by Category
    expense_cats = db.query(
        Expense.category,
        func.coalesce(func.sum(Expense.amount), 0.0).label("total")
    ).filter(Expense.user_id == current_user.id)\
     .group_by(Expense.category).all()
    
    expense_breakdown = [{"category": c, "amount": round(float(t), 2)} for c, t in expense_cats]

    # 2. Income Breakdown by Category
    income_cats = db.query(
        Income.category,
        func.coalesce(func.sum(Income.amount), 0.0).label("total")
    ).filter(Income.user_id == current_user.id)\
     .group_by(Income.category).all()
    
    income_breakdown = [{"category": c, "amount": round(float(t), 2)} for c, t in income_cats]

    # 3. Monthly Income vs Expense Trend
    incomes = db.query(Income).filter(Income.user_id == current_user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()

    monthly_map = {}
    for i in incomes:
        m = i.date[:7] if len(i.date) >= 7 else "Unknown"
        if m not in monthly_map:
            monthly_map[m] = {"month": m, "income": 0.0, "expense": 0.0, "savings": 0.0}
        monthly_map[m]["income"] += i.amount

    for e in expenses:
        m = e.date[:7] if len(e.date) >= 7 else "Unknown"
        if m not in monthly_map:
            monthly_map[m] = {"month": m, "income": 0.0, "expense": 0.0, "savings": 0.0}
        monthly_map[m]["expense"] += e.amount

    monthly_trend = []
    for m in sorted(monthly_map.keys()):
        item = monthly_map[m]
        item["income"] = round(item["income"], 2)
        item["expense"] = round(item["expense"], 2)
        item["net"] = round(item["income"] - item["expense"], 2)
        monthly_trend.append(item)

    # 4. Budget Utilization
    now = datetime.now(timezone.utc)
    m_str = f"{now.year}-{now.month:02d}"
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == now.month,
        Budget.year == now.year
    ).all()

    budget_utilization = []
    for b in budgets:
        spent = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.user_id == current_user.id,
            Expense.category == b.category,
            Expense.date.startswith(m_str)
        ).scalar()
        pct = (spent / b.amount * 100) if b.amount > 0 else 0
        budget_utilization.append({
            "category": b.category,
            "allocated": round(b.amount, 2),
            "spent": round(spent, 2),
            "percentage": round(pct, 1)
        })

    # 5. Savings Progress
    savings_list = db.query(Savings).filter(Savings.user_id == current_user.id).all()
    savings_progress = [
        {
            "goal": s.goal_name,
            "current": round(s.current_amount, 2),
            "target": round(s.target_amount, 2),
            "percentage": round((s.current_amount / s.target_amount * 100) if s.target_amount > 0 else 0, 1)
        }
        for s in savings_list
    ]

    return {
        "expense_breakdown": expense_breakdown,
        "income_breakdown": income_breakdown,
        "monthly_trend": monthly_trend,
        "budget_utilization": budget_utilization,
        "savings_progress": savings_progress
    }

@router.get("/business")
def get_business_analytics(
    business_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    biz_ids = [b.id for b in current_user.businesses]
    if business_id and business_id in biz_ids:
        biz_ids = [business_id]

    if not biz_ids:
        return {
            "total_revenue": 0.0,
            "total_expenses": 0.0,
            "net_profit": 0.0,
            "profit_margin": 0.0,
            "sales_count": 0,
            "revenue_by_product": [],
            "monthly_business_trend": []
        }

    # Total Sales Revenue
    sales_total = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
        .filter(Sale.business_id.in_(biz_ids), Sale.status == "paid").scalar()
    
    # Extra Transaction Revenue
    tx_rev = db.query(func.coalesce(func.sum(BusinessTransaction.amount), 0.0))\
        .filter(BusinessTransaction.business_id.in_(biz_ids), BusinessTransaction.type == "revenue").scalar()
    
    total_rev = sales_total + tx_rev

    # Total Business Expenses
    total_exp = db.query(func.coalesce(func.sum(BusinessTransaction.amount), 0.0))\
        .filter(BusinessTransaction.business_id.in_(biz_ids), BusinessTransaction.type == "expense").scalar()

    net_profit = total_rev - total_exp
    profit_margin = round((net_profit / total_rev * 100), 1) if total_rev > 0 else 0.0
    sales_count = db.query(Sale).filter(Sale.business_id.in_(biz_ids)).count()

    # Monthly Trend
    sales = db.query(Sale).filter(Sale.business_id.in_(biz_ids), Sale.status == "paid").all()
    biz_txs = db.query(BusinessTransaction).filter(BusinessTransaction.business_id.in_(biz_ids)).all()

    monthly_map = {}
    for s in sales:
        m = s.date[:7] if len(s.date) >= 7 else "Unknown"
        if m not in monthly_map:
            monthly_map[m] = {"month": m, "revenue": 0.0, "expense": 0.0, "profit": 0.0}
        monthly_map[m]["revenue"] += s.total_amount

    for tx in biz_txs:
        m = tx.date[:7] if len(tx.date) >= 7 else "Unknown"
        if m not in monthly_map:
            monthly_map[m] = {"month": m, "revenue": 0.0, "expense": 0.0, "profit": 0.0}
        if tx.type == "revenue":
            monthly_map[m]["revenue"] += tx.amount
        else:
            monthly_map[m]["expense"] += tx.amount

    monthly_trend = []
    for m in sorted(monthly_map.keys()):
        item = monthly_map[m]
        item["revenue"] = round(item["revenue"], 2)
        item["expense"] = round(item["expense"], 2)
        item["profit"] = round(item["revenue"] - item["expense"], 2)
        monthly_trend.append(item)

    return {
        "total_revenue": round(total_rev, 2),
        "total_expenses": round(total_exp, 2),
        "net_profit": round(net_profit, 2),
        "profit_margin": profit_margin,
        "sales_count": sales_count,
        "monthly_business_trend": monthly_trend
    }
