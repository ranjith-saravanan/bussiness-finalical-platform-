import os
import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import User, Income, Expense, Budget, Savings, Business, Sale, BusinessTransaction
from app.schemas import AIRecommendation
from app.config import settings

def extract_financial_context(user: User, db: Session, business_id: int = None) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    m_str = f"{now.year}-{now.month:02d}"

    # Current month expenses
    curr_month_expense = db.query(func.coalesce(func.sum(Expense.amount), 0.0))\
        .filter(Expense.user_id == user.id, Expense.date.startswith(m_str)).scalar()
    
    # Total expenses
    total_expense = db.query(func.coalesce(func.sum(Expense.amount), 0.0))\
        .filter(Expense.user_id == user.id).scalar()

    # Current month income
    curr_month_income = db.query(func.coalesce(func.sum(Income.amount), 0.0))\
        .filter(Income.user_id == user.id, Income.date.startswith(m_str)).scalar()
    
    # Total income
    total_income = db.query(func.coalesce(func.sum(Income.amount), 0.0))\
        .filter(Income.user_id == user.id).scalar()

    # Top expense categories
    expense_cats = db.query(
        Expense.category,
        func.coalesce(func.sum(Expense.amount), 0.0).label("total")
    ).filter(Expense.user_id == user.id)\
     .group_by(Expense.category)\
     .order_by(func.sum(Expense.amount).desc()).limit(3).all()
    
    top_categories = [{"category": c, "amount": round(float(t), 2)} for c, t in expense_cats]

    # Savings
    savings_list = db.query(Savings).filter(Savings.user_id == user.id).all()
    savings_total_current = sum(s.current_amount for s in savings_list)
    savings_total_target = sum(s.target_amount for s in savings_list)

    # Budgets
    budgets = db.query(Budget).filter(Budget.user_id == user.id, Budget.month == now.month, Budget.year == now.year).all()
    budget_allocated = sum(b.amount for b in budgets)

    # Business data
    biz_ids = [business_id] if business_id else [b.id for b in user.businesses]
    biz_rev = 0.0
    biz_exp = 0.0
    if biz_ids:
        sales_rev = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
            .filter(Sale.business_id.in_(biz_ids), Sale.status == "paid").scalar()
        extra_rev = db.query(func.coalesce(func.sum(BusinessTransaction.amount), 0.0))\
            .filter(BusinessTransaction.business_id.in_(biz_ids), BusinessTransaction.type == "revenue").scalar()
        biz_rev = sales_rev + extra_rev
        biz_exp = db.query(func.coalesce(func.sum(BusinessTransaction.amount), 0.0))\
            .filter(BusinessTransaction.business_id.in_(biz_ids), BusinessTransaction.type == "expense").scalar()

    biz_profit = biz_rev - biz_exp

    return {
        "current_month": m_str,
        "current_month_income": round(curr_month_income, 2),
        "current_month_expense": round(curr_month_expense, 2),
        "current_month_net": round(curr_month_income - curr_month_expense, 2),
        "lifetime_income": round(total_income, 2),
        "lifetime_expense": round(total_expense, 2),
        "top_expense_categories": top_categories,
        "savings_current": round(savings_total_current, 2),
        "savings_target": round(savings_total_target, 2),
        "budget_allocated": round(budget_allocated, 2),
        "business_revenue": round(biz_rev, 2),
        "business_expense": round(biz_exp, 2),
        "business_profit": round(biz_profit, 2)
    }

def deterministic_advisor_response(question: str, ctx: Dict[str, Any]) -> str:
    q = question.lower()

    if "spend this month" in q or "spent this month" in q or "how much did i spend" in q:
        return (
            f"In {ctx['current_month']}, your total recorded personal expenses are "
            f"${ctx['current_month_expense']:,.2f}. "
            f"Your personal income this month is ${ctx['current_month_income']:,.2f}, "
            f"resulting in a net monthly cash flow of ${ctx['current_month_net']:,.2f}."
        )

    if "where" in q and "spending" in q:
        if not ctx['top_expense_categories']:
            return "You haven't recorded any expenses yet. Once you add expenses, I will analyze your top spending areas."
        top_str = ", ".join([f"{c['category']} (${c['amount']:,.2f})" for c in ctx['top_expense_categories']])
        return (
            f"Your highest spending categories to date are: {top_str}. "
            f"Consider reviewing budgets in these categories to identify potential savings."
        )

    if "afford" in q:
        net = ctx['current_month_net']
        if net > 0:
            return (
                f"You currently have a positive net cash flow of ${net:,.2f} this month. "
                f"You also have ${ctx['savings_current']:,.2f} in active savings goals. "
                f"As long as this expense is within ${net:,.2f} or you plan for it within your monthly budget, "
                f"it should not compromise your cash-flow buffer."
            )
        else:
            return (
                f"Caution: Your current net cash flow this month is negative (${net:,.2f}), "
                f"meaning expenses exceed income. We recommend holding off on non-essential purchases until next month."
            )

    if "business" in q and ("performing" in q or "performance" in q or "how is" in q):
        rev = ctx['business_revenue']
        exp = ctx['business_expense']
        profit = ctx['business_profit']
        margin = (profit / rev * 100) if rev > 0 else 0.0
        return (
            f"Your business metrics show ${rev:,.2f} in total revenue and ${exp:,.2f} in operating expenses, "
            f"delivering a net profit of ${profit:,.2f} ({margin:.1f}% profit margin). "
            + ("Your business is currently operating profitably!" if profit > 0 else "Notice: Expenses exceed revenue; look to accelerate unpaid sales or reduce OpEx.")
        )

    if "improve" in q or "what should i improve" in q:
        suggestions = []
        if ctx['current_month_expense'] > ctx['current_month_income']:
            suggestions.append("1. Reduce discretionary expenses to turn your monthly cash flow positive.")
        if ctx['savings_current'] < 0.2 * ctx['savings_target'] if ctx['savings_target'] > 0 else False:
            suggestions.append("2. Set up automated monthly allocations toward your emergency savings goal.")
        if ctx['business_profit'] <= 0:
            suggestions.append("3. Review business expenses and follow up on pending customer invoices.")
        if not suggestions:
            suggestions.append("1. Great financial health! Consider increasing your savings target or investing excess business profits into product expansion.")
        return "Key areas to improve this month:\n" + "\n".join(suggestions)

    if "savings" in q or "recommendation" in q:
        return (
            f"You have saved ${ctx['savings_current']:,.2f} toward your total goal of ${ctx['savings_target']:,.2f}. "
            f"Recommendation: Allocate at least 15-20% of your net monthly income (${max(0, ctx['current_month_net']) * 0.20:,.2f}) "
            f"directly into your primary savings goal on payday to build an emergency runway."
        )

    # General fallback
    return (
        f"Based on your verified records: Your current month's income is ${ctx['current_month_income']:,.2f}, "
        f"expenses are ${ctx['current_month_expense']:,.2f} (Net: ${ctx['current_month_net']:,.2f}), "
        f"and total business profit stands at ${ctx['business_profit']:,.2f}. "
        f"Feel free to ask specific questions about spending categories, affordability, business KPIs, or savings goals!"
    )

def generate_recommendations(ctx: Dict[str, Any]) -> List[AIRecommendation]:
    recs = []

    # 1. Budget & Expense Check
    if ctx['current_month_expense'] > ctx['current_month_income'] and ctx['current_month_income'] > 0:
        recs.append(AIRecommendation(
            id="rec-overspend",
            category="Cash Flow",
            priority="high",
            title="Monthly Expenses Exceed Income",
            description=f"Current month spending (${ctx['current_month_expense']:,.2f}) is higher than income (${ctx['current_month_income']:,.2f}).",
            impact="Avoid running a negative cash-flow balance by trimming flexible category spending."
        ))

    # 2. Top category optimization
    if ctx['top_expense_categories']:
        top = ctx['top_expense_categories'][0]
        recs.append(AIRecommendation(
            id="rec-top-cat",
            category="Expense Optimization",
            priority="medium",
            title=f"Review High Spend in {top['category']}",
            description=f"You have spent ${top['amount']:,.2f} in '{top['category']}'. This is your single highest expense driver.",
            impact=f"Reducing this category by 10% would save you ${top['amount'] * 0.10:,.2f}."
        ))

    # 3. Savings Goal Pace
    if ctx['savings_target'] > 0:
        pct = (ctx['savings_current'] / ctx['savings_target']) * 100
        recs.append(AIRecommendation(
            id="rec-savings",
            category="Savings",
            priority="medium",
            title=f"Savings Goals are at {pct:.1f}%",
            description=f"Saved ${ctx['savings_current']:,.2f} of ${ctx['savings_target']:,.2f}.",
            impact="Automating recurring monthly transfers will accelerate goal attainment."
        ))

    # 4. Business Profitability
    if ctx['business_revenue'] > 0:
        margin = (ctx['business_profit'] / ctx['business_revenue']) * 100
        recs.append(AIRecommendation(
            id="rec-biz-margin",
            category="Business Performance",
            priority="low" if margin > 20 else "high",
            title=f"Business Margin: {margin:.1f}%",
            description=f"Business has generated ${ctx['business_revenue']:,.2f} with ${ctx['business_profit']:,.2f} net profit.",
            impact="Healthy margins ensure ongoing liquidity to reinvest in marketing and client acquisition."
        ))

    if not recs:
        recs.append(AIRecommendation(
            id="rec-start",
            category="Getting Started",
            priority="info",
            title="Keep Recording Transactions",
            description="Add more personal income, expenses, and business sales to receive deeper personalized advice.",
            impact="Denser transaction history produces higher precision forecasting and advisory insights."
        ))

    return recs

async def ask_gemini_or_fallback(question: str, ctx: Dict[str, Any]) -> Tuple[str, str]:
    """Returns (answer, source)"""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return deterministic_advisor_response(question, ctx), "deterministic-advisor"

    # Call Gemini API if key is present
    system_prompt = (
        "You are the MyBIZ Personal Business Advisor & Financial Intelligence Assistant. "
        "Provide clear, professional, actionable financial guidance based ONLY on the user's verified financial context below. "
        "NEVER invent or hallucinate numbers; always refer to the numbers provided.\n\n"
        f"Verified Financial Context:\n{json.dumps(ctx, indent=2)}\n"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": f"{system_prompt}\nUser Question: {question}"}]}
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip(), "gemini"
    except Exception:
        pass

    # Fallback to deterministic advisor on any error or missing key
    return deterministic_advisor_response(question, ctx), "deterministic-advisor"
