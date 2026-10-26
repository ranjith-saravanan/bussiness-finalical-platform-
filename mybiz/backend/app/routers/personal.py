from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
import calendar
from app.database import get_next_sequence_value
from app.models import User, Income, Expense, Budget, Savings
from app.schemas import (
    IncomeCreate, IncomeOut,
    ExpenseCreate, ExpenseOut,
    BudgetCreate, BudgetOut, BudgetStatusOut,
    SavingsCreate, SavingsOut,
    CommitmentSummary
)
from app.auth import get_current_user

router = APIRouter(tags=["Personal Finance"])

# ==================== INCOME ====================
@router.get("/income", response_model=List[IncomeOut])
async def get_incomes(current_user: User = Depends(get_current_user)):
    return await Income.find(Income.user_id == current_user.id).sort(-Income.date).to_list()

@router.post("/income", response_model=IncomeOut, status_code=status.HTTP_201_CREATED)
async def create_income(income_in: IncomeCreate, current_user: User = Depends(get_current_user)):
    inc_id = await get_next_sequence_value("incomes")
    income = Income(id=inc_id, **income_in.model_dump(), user_id=current_user.id)
    await income.insert()
    return income

@router.delete("/income/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income(income_id: int, current_user: User = Depends(get_current_user)):
    income = await Income.find_one(Income.id == income_id, Income.user_id == current_user.id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    await income.delete()
    return None

# ==================== EXPENSES ====================
@router.get("/expenses", response_model=List[ExpenseOut])
async def get_expenses(current_user: User = Depends(get_current_user)):
    return await Expense.find(Expense.user_id == current_user.id).sort(-Expense.date).to_list()

@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(expense_in: ExpenseCreate, current_user: User = Depends(get_current_user)):
    exp_id = await get_next_sequence_value("expenses")
    expense = Expense(id=exp_id, **expense_in.model_dump(), user_id=current_user.id)
    await expense.insert()
    return expense

@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: int, current_user: User = Depends(get_current_user)):
    expense = await Expense.find_one(Expense.id == expense_id, Expense.user_id == current_user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await expense.delete()
    return None

# ==================== BUDGETS ====================
@router.get("/budgets", response_model=List[BudgetOut])
async def get_budgets(current_user: User = Depends(get_current_user)):
    return await Budget.find(Budget.user_id == current_user.id).to_list()

@router.get("/budgets/status", response_model=List[BudgetStatusOut])
async def get_budget_statuses(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    m = month or now.month
    y = year or now.year
    date_prefix = f"{y}-{m:02d}"

    _, num_days = calendar.monthrange(y, m)
    if m == now.month and y == now.year:
        current_day = min(now.day, num_days)
        days_remaining = max(0, num_days - current_day)
        days_elapsed = max(1, current_day)
    elif (y < now.year) or (y == now.year and m < now.month):
        days_remaining = 0
        days_elapsed = num_days
    else:
        days_remaining = num_days
        days_elapsed = 1

    budgets = await Budget.find(
        Budget.user_id == current_user.id,
        Budget.month == m,
        Budget.year == y
    ).to_list()

    user_expenses = await Expense.find(Expense.user_id == current_user.id).to_list()

    statuses = []
    for b in budgets:
        # Calculate how much was spent in this category for this month
        spent = sum(
            e.amount for e in user_expenses
            if e.category == b.category and e.date.startswith(date_prefix)
        )

        remaining = b.amount - spent
        percentage = (spent / b.amount * 100) if b.amount > 0 else 0.0

        projected_month_end = round((spent / days_elapsed) * num_days, 2)
        potential_overspend = round(max(0.0, projected_month_end - b.amount), 2)
        
        if spent > b.amount:
            status_flag = "overspent"
        elif projected_month_end > b.amount or (b.amount > 0 and spent >= 0.85 * b.amount):
            status_flag = "warning"
        else:
            status_flag = "on_track"

        statuses.append(BudgetStatusOut(
            id=b.id,
            category=b.category,
            allocated=round(b.amount, 2),
            spent=round(spent, 2),
            remaining=round(remaining, 2),
            percentage=round(percentage, 1),
            month=b.month,
            year=b.year,
            days_remaining=days_remaining,
            projected_month_end=projected_month_end,
            potential_overspend=potential_overspend,
            status_flag=status_flag
        ))

    return statuses

@router.post("/budgets", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
async def create_budget(budget_in: BudgetCreate, current_user: User = Depends(get_current_user)):
    existing = await Budget.find_one(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    )
    if existing:
        existing.amount = budget_in.amount
        await existing.save()
        return existing

    b_id = await get_next_sequence_value("budgets")
    budget = Budget(id=b_id, **budget_in.model_dump(), user_id=current_user.id)
    await budget.insert()
    return budget

@router.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(budget_id: int, current_user: User = Depends(get_current_user)):
    b = await Budget.find_one(Budget.id == budget_id, Budget.user_id == current_user.id)
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    await b.delete()
    return None

# ==================== SAVINGS ====================
def enrich_savings(s: Savings) -> SavingsOut:
    rem = max(0.0, s.target_amount - s.current_amount)
    pct = round((s.current_amount / s.target_amount * 100), 1) if s.target_amount > 0 else 0.0
    
    req_monthly = None
    est_months = None
    
    if s.target_date:
        try:
            target_dt = datetime.strptime(s.target_date[:10], "%Y-%m-%d")
            now_dt = datetime.now()
            diff_months = (target_dt.year - now_dt.year) * 12 + (target_dt.month - now_dt.month)
            if diff_months > 0:
                req_monthly = round(rem / diff_months, 2)
                est_months = round(float(diff_months), 1)
            else:
                req_monthly = rem
                est_months = 0.0
        except Exception:
            pass

    if rem > 0 and s.current_amount > 0 and est_months is None:
        est_months = round(rem / max(100.0, s.current_amount * 0.2), 1)
    elif rem == 0:
        est_months = 0.0

    return SavingsOut(
        id=s.id,
        user_id=s.user_id,
        goal_name=s.goal_name,
        target_amount=round(s.target_amount, 2),
        current_amount=round(s.current_amount, 2),
        target_date=s.target_date,
        created_at=s.created_at,
        remaining_amount=round(rem, 2),
        progress_percentage=pct,
        required_monthly_contribution=req_monthly,
        estimated_completion_months=est_months
    )

@router.get("/savings", response_model=List[SavingsOut])
async def get_savings(current_user: User = Depends(get_current_user)):
    savings_list = await Savings.find(Savings.user_id == current_user.id).to_list()
    return [enrich_savings(s) for s in savings_list]

@router.post("/savings", response_model=SavingsOut, status_code=status.HTTP_201_CREATED)
async def create_savings(savings_in: SavingsCreate, current_user: User = Depends(get_current_user)):
    s_id = await get_next_sequence_value("savings")
    s = Savings(id=s_id, **savings_in.model_dump(), user_id=current_user.id)
    await s.insert()
    return enrich_savings(s)

@router.put("/savings/{savings_id}", response_model=SavingsOut)
async def update_savings(
    savings_id: int,
    current_amount: float,
    current_user: User = Depends(get_current_user)
):
    s = await Savings.find_one(Savings.id == savings_id, Savings.user_id == current_user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    s.current_amount = max(0.0, current_amount)
    await s.save()
    return enrich_savings(s)

@router.delete("/savings/{savings_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings(savings_id: int, current_user: User = Depends(get_current_user)):
    s = await Savings.find_one(Savings.id == savings_id, Savings.user_id == current_user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    await s.delete()
    return None

# ==================== COMMITMENTS ====================
@router.get("/commitments", response_model=CommitmentSummary)
async def get_recurring_commitments(current_user: User = Depends(get_current_user)):
    rec_incomes = await Income.find(Income.user_id == current_user.id, Income.is_recurring == True).to_list()
    rec_expenses = await Expense.find(Expense.user_id == current_user.id, Expense.is_recurring == True).to_list()

    inc_total = sum(i.amount for i in rec_incomes)
    exp_total = sum(e.amount for e in rec_expenses)
    net_monthly = inc_total - exp_total

    now = datetime.now(timezone.utc)
    m_prefix = f"{now.year}-{now.month:02d}"

    all_user_expenses = await Expense.find(Expense.user_id == current_user.id).to_list()

    items = []
    for exp in rec_expenses:
        paid_count = sum(
            1 for e in all_user_expenses
            if e.title == exp.title and e.date.startswith(m_prefix)
        )
        items.append({
            "id": exp.id,
            "type": "expense",
            "title": exp.title,
            "category": exp.category,
            "amount": round(exp.amount, 2),
            "status": "paid" if paid_count > 0 else "upcoming"
        })

    for inc in rec_incomes:
        items.append({
            "id": inc.id,
            "type": "income",
            "title": inc.source,
            "category": inc.category,
            "amount": round(inc.amount, 2),
            "status": "active"
        })

    upcoming_this_month = sum(it["amount"] for it in items if it["type"] == "expense" and it["status"] == "upcoming")
    upcoming_next_month = exp_total

    return CommitmentSummary(
        monthly_recurring_income=round(inc_total, 2),
        monthly_recurring_expenses=round(exp_total, 2),
        monthly_recurring_net=round(net_monthly, 2),
        upcoming_commitments_current_month=round(upcoming_this_month, 2),
        upcoming_commitments_next_month=round(upcoming_next_month, 2),
        recurring_items=items
    )

# ==================== CASH FLOW ====================
@router.get("/cashflow")
async def get_cash_flow(current_user: User = Depends(get_current_user)):
    incomes = await Income.find(Income.user_id == current_user.id).to_list()
    expenses = await Expense.find(Expense.user_id == current_user.id).to_list()

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

    results = []
    for m in sorted(monthly_data.keys()):
        d = monthly_data[m]
        d["net"] = round(d["income"] - d["expense"], 2)
        d["income"] = round(d["income"], 2)
        d["expense"] = round(d["expense"], 2)
        results.append(d)

    return results
