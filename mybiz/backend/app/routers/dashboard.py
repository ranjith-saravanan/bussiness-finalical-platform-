from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.models import User, Income, Expense, Budget, Savings, Business, Sale, BusinessTransaction
from app.schemas import DashboardSummary
from app.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummary)
async def get_dashboard_summary(
    tax_rate: float = 0.25,
    custom_safety_buffer: float = 1000.0,
    current_user: User = Depends(get_current_user)
):
    # 1. Personal Income
    user_incomes = await Income.find(Income.user_id == current_user.id).to_list()
    total_income = sum(i.amount for i in user_incomes)

    # 2. Personal Expenses
    user_expenses = await Expense.find(Expense.user_id == current_user.id).to_list()
    total_expenses = sum(e.amount for e in user_expenses)

    net_personal_cashflow = total_income - total_expenses
    available_personal_cash = net_personal_cashflow

    # 3. Savings
    user_savings = await Savings.find(Savings.user_id == current_user.id).to_list()
    savings_current = sum(s.current_amount for s in user_savings)
    savings_target = sum(s.target_amount for s in user_savings)

    # 4. Budgets
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year

    user_budgets = await Budget.find(
        Budget.user_id == current_user.id,
        Budget.month == current_month,
        Budget.year == current_year
    ).to_list()
    total_budget_allocated = sum(b.amount for b in user_budgets)

    # Calculate actual expenses for the budgeted month
    month_prefix = f"{current_year}-{current_month:02d}"
    total_budget_spent = sum(
        e.amount for e in user_expenses
        if e.date.startswith(month_prefix)
    )

    # 5. Recurring Commitments
    recurring_expenses_sum = sum(e.amount for e in user_expenses if e.is_recurring)
    remaining_budget_commitment = max(0.0, total_budget_allocated - total_budget_spent)
    upcoming_personal_commitments = recurring_expenses_sum if recurring_expenses_sum > 0 else remaining_budget_commitment

    # Savings reserve requirement: if goals exist, reserve up to $2,000 or 10% of target
    if savings_target > 0:
        savings_reserve_req = min(float(savings_current), max(2000.0, float(savings_target) * 0.10))
    else:
        savings_reserve_req = 0.0

    safety_buffer = float(max(0.0, custom_safety_buffer))
    safe_spending = max(0.0, available_personal_cash - upcoming_personal_commitments - savings_reserve_req - safety_buffer)

    safe_breakdown = {
        "available_personal_cash": round(available_personal_cash, 2),
        "upcoming_personal_commitments": round(upcoming_personal_commitments, 2),
        "savings_reserve_requirement": round(savings_reserve_req, 2),
        "safety_buffer": round(safety_buffer, 2),
        "safe_personal_spending": round(safe_spending, 2),
        "formula": (
            f"Available Cash (${available_personal_cash:,.2f}) - "
            f"Upcoming Commitments (${upcoming_personal_commitments:,.2f}) - "
            f"Savings Reserve (${savings_reserve_req:,.2f}) - "
            f"Safety Buffer (${safety_buffer:,.2f}) = "
            f"${safe_spending:,.2f}"
        ),
        "disclaimer": "Estimate only — not guaranteed financial advice. Discretionary spending should not compromise business capital or fixed obligations."
    }

    # 6. Business Stats (All businesses owned by user)
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]

    biz_revenue = 0.0
    biz_expenses = 0.0

    if user_biz_ids:
        # Revenue from recorded sales
        paid_sales = await Sale.find({"business_id": {"$in": user_biz_ids}, "status": "paid"}).to_list()
        sales_total = sum(s.total_amount for s in paid_sales)
        
        # Additional revenue from transactions
        biz_txs = await BusinessTransaction.find({"business_id": {"$in": user_biz_ids}}).to_list()
        extra_rev = sum(t.amount for t in biz_txs if t.type == "revenue")
        biz_expenses = sum(t.amount for t in biz_txs if t.type == "expense")
        biz_revenue = sales_total + extra_rev

    biz_profit = biz_revenue - biz_expenses
    biz_margin = round((biz_profit / biz_revenue * 100), 1) if biz_revenue > 0 else 0.0
    
    # 7. Tax Reserve Planning
    effective_tax_rate = max(0.0, min(0.5, float(tax_rate)))
    suggested_tax_reserve = round(max(0.0, biz_profit * effective_tax_rate), 2)
    net_total_cashflow = net_personal_cashflow + biz_profit

    # 8. Five Decision Questions
    attention_items = []
    if total_budget_allocated > 0 and total_budget_spent >= (0.75 * total_budget_allocated):
        pct = (total_budget_spent / total_budget_allocated) * 100
        attention_items.append(f"Monthly budget is at {pct:.1f}% utilization (${total_budget_spent:,.2f} of ${total_budget_allocated:,.2f}).")
    if biz_profit > 0:
        attention_items.append(f"Recommended tax reserve: ${suggested_tax_reserve:,.2f} ({effective_tax_rate*100:.0f}% of business profit).")
    if safe_spending < 1000 and available_personal_cash > 0:
        attention_items.append("Discretionary spending capacity is restricted by upcoming commitments or reserves.")

    five_questions = {
        "1_money_in": {
            "personal_income": round(total_income, 2),
            "business_revenue": round(biz_revenue, 2),
            "total_inflow": round(total_income + biz_revenue, 2),
            "summary": f"Personal: ${total_income:,.2f} | Business: ${biz_revenue:,.2f}"
        },
        "2_money_out": {
            "personal_expenses": round(total_expenses, 2),
            "business_expenses": round(biz_expenses, 2),
            "total_outflow": round(total_expenses + biz_expenses, 2),
            "summary": f"Personal: ${total_expenses:,.2f} | Business: ${biz_expenses:,.2f}"
        },
        "3_money_kept": {
            "personal_net_cashflow": round(net_personal_cashflow, 2),
            "business_profit": round(biz_profit, 2),
            "business_margin": biz_margin,
            "after_tax_business_profit": round(biz_profit - suggested_tax_reserve, 2),
            "summary": f"Personal Net: ${net_personal_cashflow:,.2f} | Business Profit: ${biz_profit:,.2f} ({biz_margin}% margin)"
        },
        "4_attention": attention_items or ["All personal and business metrics are within target operating thresholds."],
        "5_next_action": (
            f"You have an estimated ${safe_spending:,.2f} safe personal spending capacity after obligations. "
            f"Reserve ${suggested_tax_reserve:,.2f} for upcoming tax obligations."
        )
    }

    # 9. Recent transactions
    recent_txs = []

    # Get recent 5 personal expenses
    recent_expenses = await Expense.find(Expense.user_id == current_user.id).sort(-Expense.date, -Expense.id).limit(5).to_list()
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
    recent_incomes = await Income.find(Income.user_id == current_user.id).sort(-Income.date, -Income.id).limit(5).to_list()
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
        available_personal_cash=round(available_personal_cash, 2),
        upcoming_personal_commitments=round(upcoming_personal_commitments, 2),
        savings_reserve_requirement=round(savings_reserve_req, 2),
        safety_buffer=round(safety_buffer, 2),
        safe_personal_spending=round(safe_spending, 2),
        safe_to_spend_breakdown=safe_breakdown,
        total_savings_current=round(savings_current, 2),
        total_savings_target=round(savings_target, 2),
        total_budget_allocated=round(total_budget_allocated, 2),
        total_budget_spent=round(total_budget_spent, 2),
        business_revenue=round(biz_revenue, 2),
        business_expenses=round(biz_expenses, 2),
        business_profit=round(biz_profit, 2),
        business_margin=biz_margin,
        tax_reserve_rate=round(effective_tax_rate, 2),
        suggested_tax_reserve=suggested_tax_reserve,
        net_total_cashflow=round(net_total_cashflow, 2),
        recurring_monthly_commitments=round(upcoming_personal_commitments, 2),
        five_questions=five_questions,
        recent_transactions=recent_txs
    )
