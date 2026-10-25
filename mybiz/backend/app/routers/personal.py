from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, Income, Expense, Budget, Savings
from app.schemas import (
    IncomeCreate, IncomeOut,
    ExpenseCreate, ExpenseOut,
    BudgetCreate, BudgetOut, BudgetStatusOut,
    SavingsCreate, SavingsOut
)
from app.auth import get_current_user

router = APIRouter(tags=["Personal Finance"])

# ==================== INCOME ====================
@router.get("/income", response_model=List[IncomeOut])
def get_incomes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Income).filter(Income.user_id == current_user.id).order_by(Income.date.desc()).all()

@router.post("/income", response_model=IncomeOut, status_code=status.HTTP_201_CREATED)
def create_income(income_in: IncomeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    income = Income(**income_in.model_dump(), user_id=current_user.id)
    db.add(income)
    db.commit()
    db.refresh(income)
    return income

@router.delete("/income/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(income_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == current_user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    db.delete(income)
    db.commit()
    return None

# ==================== EXPENSES ====================
@router.get("/expenses", response_model=List[ExpenseOut])
def get_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Expense).filter(Expense.user_id == current_user.id).order_by(Expense.date.desc()).all()

@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(expense_in: ExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = Expense(**expense_in.model_dump(), user_id=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return None

# ==================== BUDGETS ====================
@router.get("/budgets", response_model=List[BudgetOut])
def get_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()

@router.get("/budgets/status", response_model=List[BudgetStatusOut])
def get_budget_statuses(
    month: int = None,
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    m = month or now.month
    y = year or now.year
    date_prefix = f"{y}-{m:02d}"

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == m,
        Budget.year == y
    ).all()

    statuses = []
    for b in budgets:
        # Calculate how much was spent in this category for this month
        spent = db.query(func.coalesce(func.sum(Expense.amount), 0.0))\
            .filter(
                Expense.user_id == current_user.id,
                Expense.category == b.category,
                Expense.date.startswith(date_prefix)
            ).scalar()

        remaining = b.amount - spent
        percentage = (spent / b.amount * 100) if b.amount > 0 else 0.0

        statuses.append(BudgetStatusOut(
            id=b.id,
            category=b.category,
            allocated=round(b.amount, 2),
            spent=round(spent, 2),
            remaining=round(remaining, 2),
            percentage=round(percentage, 1),
            month=b.month,
            year=b.year
        ))

    return statuses

@router.post("/budgets", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(budget_in: BudgetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if budget already exists for this category, month, year
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()
    if existing:
        existing.amount = budget_in.amount
        db.commit()
        db.refresh(existing)
        return existing

    budget = Budget(**budget_in.model_dump(), user_id=current_user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(b)
    db.commit()
    return None

# ==================== SAVINGS ====================
@router.get("/savings", response_model=List[SavingsOut])
def get_savings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Savings).filter(Savings.user_id == current_user.id).all()

@router.post("/savings", response_model=SavingsOut, status_code=status.HTTP_201_CREATED)
def create_savings(savings_in: SavingsCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = Savings(**savings_in.model_dump(), user_id=current_user.id)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.put("/savings/{savings_id}", response_model=SavingsOut)
def update_savings(
    savings_id: int,
    current_amount: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    s = db.query(Savings).filter(Savings.id == savings_id, Savings.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    s.current_amount = max(0.0, current_amount)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/savings/{savings_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings(savings_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Savings).filter(Savings.id == savings_id, Savings.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    db.delete(s)
    db.commit()
    return None

# ==================== CASH FLOW ====================
@router.get("/cashflow")
def get_cash_flow(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Group personal incomes and expenses by month (YYYY-MM)
    incomes = db.query(Income).filter(Income.user_id == current_user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()

    monthly_data = {}
    for inc in incomes:
        m = inc.date[:7] if len(inc.date) >= 7 else "Unknown"
        if m not in monthly_data:
            monthly_data[m] = {"month": m, "income": 0.0, "expense": 0.0, "net": 0.0}
        monthly_data[m]["income"] += inc.amount

    for exp in expenses:
        m = exp.date[:7] if len(exp.date) >= 7 else "Unknown"
        if m not in monthly_data:
            monthly_data[m] = {"month": m, "income": 0.0, "expense": 0.0, "net": 0.0}
        monthly_data[m]["expense"] += exp.amount

    # Compute net and round
    results = []
    for m in sorted(monthly_data.keys()):
        d = monthly_data[m]
        d["net"] = round(d["income"] - d["expense"], 2)
        d["income"] = round(d["income"], 2)
        d["expense"] = round(d["expense"], 2)
        results.append(d)

    return results
