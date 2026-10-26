import os
import re
import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from app.models import User, Income, Expense, Budget, Savings, Business, Sale, BusinessTransaction
from app.schemas import AIRecommendation
from app.config import settings

async def extract_financial_context(user: User, business_id: Optional[int] = None) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    m_str = f"{now.year}-{now.month:02d}"

    # Personal expenses & income
    expenses = await Expense.find(Expense.user_id == user.id).to_list()
    incomes = await Income.find(Income.user_id == user.id).to_list()

    curr_month_expense = sum(e.amount for e in expenses if e.date.startswith(m_str))
    total_expense = sum(e.amount for e in expenses)

    curr_month_income = sum(i.amount for i in incomes if i.date.startswith(m_str))
    total_income = sum(i.amount for i in incomes)

    # Top expense categories
    exp_cats: Dict[str, float] = {}
    for e in expenses:
        exp_cats[e.category] = exp_cats.get(e.category, 0.0) + e.amount
    sorted_cats = sorted(exp_cats.items(), key=lambda x: x[1], reverse=True)[:3]
    top_categories = [{"category": c, "amount": round(float(t), 2)} for c, t in sorted_cats]

    # Savings
    savings_list = await Savings.find(Savings.user_id == user.id).to_list()
    savings_total_current = sum(s.current_amount for s in savings_list)
    savings_total_target = sum(s.target_amount for s in savings_list)

    # Budgets
    budgets = await Budget.find(
        Budget.user_id == user.id,
        Budget.month == now.month,
        Budget.year == now.year
    ).to_list()
    budget_allocated = sum(b.amount for b in budgets)

    # Recurring personal commitments
    recurring_expenses_sum = sum(e.amount for e in expenses if e.is_recurring)
    remaining_budget_commitment = max(0.0, budget_allocated - curr_month_expense)
    upcoming_commitments = recurring_expenses_sum if recurring_expenses_sum > 0 else remaining_budget_commitment

    # Business data
    if business_id:
        biz_ids = [business_id]
    else:
        user_businesses = await Business.find(Business.user_id == user.id).to_list()
        biz_ids = [b.id for b in user_businesses]

    biz_rev = 0.0
    biz_exp = 0.0
    if biz_ids:
        paid_sales = await Sale.find({"business_id": {"$in": biz_ids}, "status": "paid"}).to_list()
        sales_rev = sum(s.total_amount for s in paid_sales)
        biz_txs = await BusinessTransaction.find({"business_id": {"$in": biz_ids}}).to_list()
        extra_rev = sum(t.amount for t in biz_txs if t.type == "revenue")
        biz_exp = sum(t.amount for t in biz_txs if t.type == "expense")
        biz_rev = sales_rev + extra_rev

    biz_profit = biz_rev - biz_exp
    biz_margin = round((biz_profit / biz_rev * 100), 1) if biz_rev > 0 else 0.0
    suggested_tax_reserve = round(max(0.0, biz_profit * 0.25), 2)

    # Personal liquidity and Safe-to-Spend
    available_personal_cash = total_income - total_expense
    savings_reserve_req = min(float(savings_total_current), max(2000.0, float(savings_total_target) * 0.10)) if savings_total_target > 0 else 0.0
    safety_buffer = 1000.0
    safe_personal_spending = max(0.0, available_personal_cash - upcoming_commitments - savings_reserve_req - safety_buffer)

    return {
        "current_month": m_str,
        "current_month_income": round(curr_month_income, 2),
        "current_month_expense": round(curr_month_expense, 2),
        "current_month_net": round(curr_month_income - curr_month_expense, 2),
        "lifetime_income": round(total_income, 2),
        "lifetime_expense": round(total_expense, 2),
        "available_personal_cash": round(available_personal_cash, 2),
        "upcoming_personal_commitments": round(upcoming_commitments, 2),
        "savings_reserve_requirement": round(savings_reserve_req, 2),
        "safety_buffer": safety_buffer,
        "safe_personal_spending": round(safe_personal_spending, 2),
        "top_expense_categories": top_categories,
        "savings_current": round(savings_total_current, 2),
        "savings_target": round(savings_total_target, 2),
        "budget_allocated": round(budget_allocated, 2),
        "business_revenue": round(biz_rev, 2),
        "business_expense": round(biz_exp, 2),
        "business_profit": round(biz_profit, 2),
        "business_margin": biz_margin,
        "suggested_tax_reserve": suggested_tax_reserve,
        "tax_disclaimer": "Estimate — not official tax advice."
    }

def classify_intent(question: str) -> str:
    q = question.lower()
    if any(k in q for k in ["afford", "can i spend", "can i buy", "safely spend", "safe to spend"]):
        return "AFFORDABILITY_CHECK"
    if any(k in q for k in ["budget", "allocated", "overspend", "limit", "pacing"]):
        return "BUDGET_ANALYSIS"
    if any(k in q for k in ["forecast", "predict", "next month", "future", "projection"]):
        return "FORECAST_EXPLANATION"
    if any(k in q for k in ["anomaly", "spike", "unusual", "increase", "software expense"]):
        return "EXPENSE_ANOMALY"
    if any(k in q for k in ["business", "revenue", "profit", "margin", "customer"]):
        return "BUSINESS_PERFORMANCE"
    if any(k in q for k in ["growth", "scale", "pipeline", "strategy"]):
        return "BUSINESS_GROWTH"
    if any(k in q for k in ["savings", "emergency fund", "goal", "target date"]):
        return "SAVINGS_ANALYSIS"
    if any(k in q for k in ["cash flow", "cashflow", "inflow", "outflow", "burn"]):
        return "CASH_FLOW_ANALYSIS"
    return "SPENDING_SUMMARY"

def evaluate_affordability(question: str, ctx: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    # Extract dollar amount from question
    matches = re.findall(r"\$?\s*([0-9,]+(?:\.[0-9]{2})?)", question)
    amount = 2000.0  # default test amount if none specified
    if matches:
        clean_num = matches[0].replace(",", "")
        try:
            amount = float(clean_num)
        except ValueError:
            amount = 2000.0

    safe_spend = ctx["safe_personal_spending"]
    avail_cash = ctx["available_personal_cash"]
    commitments = ctx["upcoming_personal_commitments"]
    savings_reserve = ctx["savings_reserve_requirement"]
    buffer_amt = ctx["safety_buffer"]

    rubric = {
        "requested_amount": amount,
        "available_personal_cash": avail_cash,
        "upcoming_commitments": commitments,
        "savings_reserve": savings_reserve,
        "safety_buffer": buffer_amt,
        "safe_personal_spending": safe_spend,
        "business_profit": ctx["business_profit"],
        "tax_reserve_set_aside": ctx["suggested_tax_reserve"]
    }

    if amount <= safe_spend and avail_cash > 0:
        rubric["verdict"] = "AFFORDABLE"
        rubric["status_code"] = "green"
        remaining_discretionary = safe_spend - amount
        text = (
            f"### Affordability Assessment: SAFE TO SPEND\n\n"
            f"**Verified Financial Context:**\n"
            f"- Available Personal Cash: **${avail_cash:,.2f}**\n"
            f"- Upcoming Personal Commitments: **${commitments:,.2f}**\n"
            f"- Savings Reserve Requirement: **${savings_reserve:,.2f}**\n"
            f"- Safety Buffer: **${buffer_amt:,.2f}**\n"
            f"- Estimated Safe Discretionary Limit: **${safe_spend:,.2f}**\n\n"
            f"**Verdict:** YES, you can safely spend **${amount:,.2f}**. "
            f"After this purchase, you will retain **${remaining_discretionary:,.2f}** in discretionary cushion without dipping into commitments or reserves.\n\n"
            f"**Operational Guardrails:**\n"
            f"- Withdraw only from personal funds; do not deplete business working capital.\n"
            f"- Ensure business tax reserve of **${ctx['suggested_tax_reserve']:,.2f}** remains preserved in your business ledger.\n\n"
            f"*(Notice: Estimated discretionary calculation, not certified financial advice.)*"
        )
    elif amount <= avail_cash:
        rubric["verdict"] = "CAUTION"
        rubric["status_code"] = "amber"
        shortfall = amount - safe_spend
        text = (
            f"### Affordability Assessment: PROCEED WITH CAUTION\n\n"
            f"**Verified Financial Context:**\n"
            f"- Available Personal Cash: **${avail_cash:,.2f}**\n"
            f"- Upcoming Commitments: **${commitments:,.2f}**\n"
            f"- Calculated Safe Limit: **${safe_spend:,.2f}**\n\n"
            f"**Verdict:** Spending **${amount:,.2f}** exceeds your recommended safe spending limit by **${shortfall:,.2f}**, "
            f"though it is technically within your total liquid cash balance (${avail_cash:,.2f}).\n\n"
            f"**Risks:** Making this purchase will partially erode your emergency safety buffer or upcoming monthly commitment funds.\n\n"
            f"*(Notice: Estimated calculation, not certified financial advice.)*"
        )
    else:
        rubric["verdict"] = "NOT_RECOMMENDED"
        rubric["status_code"] = "red"
        deficit = amount - avail_cash
        text = (
            f"### Affordability Assessment: NOT RECOMMENDED\n\n"
            f"**Verified Financial Context:**\n"
            f"- Available Personal Cash: **${avail_cash:,.2f}**\n"
            f"- Requested Amount: **${amount:,.2f}**\n\n"
            f"**Verdict:** A purchase of **${amount:,.2f}** exceeds your available personal liquidity by **${deficit:,.2f}**. "
            f"This would produce a cash-flow deficit or force an improper draw from business capital.\n\n"
            f"*(Notice: Estimated calculation, not certified financial advice.)*"
        )

    return text, rubric

def deterministic_advisor_response(question: str, ctx: Dict[str, Any], intent: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    q = question.lower()

    if intent == "AFFORDABILITY_CHECK":
        return evaluate_affordability(question, ctx)

    if intent == "BUDGET_ANALYSIS":
        allocated = ctx["budget_allocated"]
        spent = ctx["current_month_expense"]
        pct = (spent / allocated * 100) if allocated > 0 else 0
        rem = max(0.0, allocated - spent)
        return (
            f"Your total monthly budget allocation is **${allocated:,.2f}**. "
            f"To date, you have spent **${spent:,.2f}** ({pct:.1f}% utilized), leaving **${rem:,.2f}** remaining for this billing cycle. "
            + ("You are pacing within limits." if pct <= 85 else "Warning: You have reached or exceeded 85% of your monthly budget limit."),
            {"budget_allocated": allocated, "budget_spent": spent, "utilization_pct": round(pct, 1)}
        )

    if intent == "BUSINESS_PERFORMANCE":
        rev = ctx["business_revenue"]
        exp = ctx["business_expense"]
        profit = ctx["business_profit"]
        margin = ctx["business_margin"]
        tax_res = ctx["suggested_tax_reserve"]
        return (
            f"**Apex Digital Studio Business Performance:**\n"
            f"- Inbound Revenue: **${rev:,.2f}**\n"
            f"- Operating Expenses: **${exp:,.2f}**\n"
            f"- Net Operating Profit: **${profit:,.2f}**\n"
            f"- Operating Margin: **{margin:.1f}%**\n"
            f"- Suggested Tax Reserve (25%): **${tax_res:,.2f}**\n\n"
            + ("Your business is operating at healthy profitability! Remember to retain the tax reserve before taking founder draws."
               if profit > 0 else "Notice: Expenses exceed revenue; accelerate collection of pending sales."),
            {"revenue": rev, "expenses": exp, "profit": profit, "margin": margin, "tax_reserve": tax_res}
        )

    if intent == "SAVINGS_ANALYSIS":
        cur = ctx["savings_current"]
        tgt = ctx["savings_target"]
        pct = (cur / tgt * 100) if tgt > 0 else 0.0
        rem = max(0.0, tgt - cur)
        return (
            f"You have accumulated **${cur:,.2f}** toward your total savings goals of **${tgt:,.2f}** ({pct:.1f}% progress). "
            f"Remaining requirement: **${rem:,.2f}**. "
            f"Recommended action: Maintain automated monthly transfers of at least 15% of personal net cash flow to sustain goal velocity.",
            {"savings_current": cur, "savings_target": tgt, "progress_pct": round(pct, 1), "remaining": rem}
        )

    if intent == "CASH_FLOW_ANALYSIS":
        net = ctx["current_month_net"]
        inc = ctx["current_month_income"]
        exp = ctx["current_month_expense"]
        return (
            f"**Current Month Personal Cash Flow:**\n"
            f"- Inflow (Income): **${inc:,.2f}**\n"
            f"- Outflow (Expenses): **${exp:,.2f}**\n"
            f"- Net Cash Flow: **${net:,.2f}**\n\n"
            + ("Positive cash flow generation is bolstering your personal runway." if net >= 0 else "Outflows currently exceed inflows; defer discretionary spend."),
            {"income": inc, "expenses": exp, "net": net}
        )

    # SPENDING_SUMMARY or fallback
    top_str = ", ".join([f"{c['category']} (${c['amount']:,.2f})" for c in ctx['top_expense_categories']]) or "None"
    return (
        f"**Financial Position Summary:**\n"
        f"- Lifetime Personal Net Cash Flow: **${ctx['available_personal_cash']:,.2f}** (Income: ${ctx['lifetime_income']:,.2f}, Expenses: ${ctx['lifetime_expense']:,.2f})\n"
        f"- Safe Personal Spending Estimate: **${ctx['safe_personal_spending']:,.2f}**\n"
        f"- Active Savings: **${ctx['savings_current']:,.2f}** of **${ctx['savings_target']:,.2f}**\n"
        f"- Business Net Profit: **${ctx['business_profit']:,.2f}** (Margin: {ctx['business_margin']}%)\n"
        f"- Top Personal Expense Categories: {top_str}\n\n"
        f"Ask me any question regarding your safe-to-spend capacity, budget utilization, business profit margin, or tax reserves!",
        {"available_cash": ctx["available_personal_cash"], "safe_spending": ctx["safe_personal_spending"]}
    )

def generate_recommendations(ctx: Dict[str, Any]) -> List[AIRecommendation]:
    recs = []

    # 1. Tax Reserve Withholding (BUSINESS)
    if ctx['business_profit'] > 0:
        tax_res = ctx['suggested_tax_reserve']
        recs.append(AIRecommendation(
            id="rec-tax-reserve",
            category="Tax Obligation",
            priority="high",
            title="Set Aside Estimated Tax Reserve",
            description=f"Your business has generated ${ctx['business_profit']:,.2f} net profit. Withhold ${tax_res:,.2f} (25%) for quarterly taxes.",
            impact=f"Avoids surprise year-end penalty or tax underpayment interest.",
            evidence=f"Business Net Profit: ${ctx['business_profit']:,.2f} (Calculated 25% reserve: ${tax_res:,.2f})"
        ))

    # 2. Safe Personal Spending Capacity (CASH_FLOW)
    safe_spend = ctx['safe_personal_spending']
    recs.append(AIRecommendation(
        id="rec-safe-spend",
        category="Cash Flow",
        priority="high" if safe_spend < 1000 else "medium",
        title=f"Safe Discretionary Spend: ${safe_spend:,.2f}",
        description=f"Available cash (${ctx['available_personal_cash']:,.2f}) less commitments (${ctx['upcoming_personal_commitments']:,.2f}), savings reserve (${ctx['savings_reserve_requirement']:,.2f}), and safety buffer (${ctx['safety_buffer']:,.2f}).",
        impact="Protects business liquidity and covers all fixed personal obligations.",
        evidence=f"Personal Net: ${ctx['available_personal_cash']:,.2f} | Commitments: ${ctx['upcoming_personal_commitments']:,.2f} | Buffer: ${ctx['safety_buffer']:,.2f}"
    ))

    # 3. Top category optimization (EXPENSE)
    if ctx['top_expense_categories']:
        top = ctx['top_expense_categories'][0]
        recs.append(AIRecommendation(
            id="rec-top-cat",
            category="Expense Optimization",
            priority="medium",
            title=f"Review High Spend in {top['category']}",
            description=f"Recorded spending in '{top['category']}' stands at ${top['amount']:,.2f}.",
            impact=f"Trimming this category by 10% would save ${top['amount'] * 0.10:,.2f}.",
            evidence=f"Category spend: ${top['amount']:,.2f} across active ledger entries."
        ))

    # 4. Savings Goal Pace (SAVINGS)
    if ctx['savings_target'] > 0:
        pct = (ctx['savings_current'] / ctx['savings_target']) * 100
        rem = ctx['savings_target'] - ctx['savings_current']
        recs.append(AIRecommendation(
            id="rec-savings",
            category="Savings",
            priority="medium",
            title=f"Savings Goals are at {pct:.1f}%",
            description=f"Current savings balance is ${ctx['savings_current']:,.2f} toward ${ctx['savings_target']:,.2f} target ($ {rem:,.2f} left).",
            impact="Automating monthly transfers of 15-20% of net cash flow accelerates runway.",
            evidence=f"Current: ${ctx['savings_current']:,.2f} / Target: ${ctx['savings_target']:,.2f} ({pct:.1f}%)"
        ))

    # 5. Business Margin Discipline (BUSINESS)
    if ctx['business_revenue'] > 0:
        margin = ctx['business_margin']
        recs.append(AIRecommendation(
            id="rec-biz-margin",
            category="Business Performance",
            priority="low" if margin > 50 else "high",
            title=f"Operating Margin: {margin:.1f}%",
            description=f"Apex Digital Studio generated ${ctx['business_revenue']:,.2f} with ${ctx['business_profit']:,.2f} profit.",
            impact="High margins protect solo founder runway during consulting sales lulls.",
            evidence=f"Revenue: ${ctx['business_revenue']:,.2f} | OpEx: ${ctx['business_expense']:,.2f} | Net: ${ctx['business_profit']:,.2f}"
        ))

    return recs[:4]

async def ask_gemini_or_fallback(question: str, ctx: Dict[str, Any]) -> Tuple[str, str, str, Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """Returns (answer, source, intent, decision_rubric, evidence)"""
    intent = classify_intent(question)
    
    # Deterministic generation
    det_answer, rubric_or_ev = deterministic_advisor_response(question, ctx, intent)
    decision_rubric = rubric_or_ev if intent == "AFFORDABILITY_CHECK" else None
    evidence = rubric_or_ev if intent != "AFFORDABILITY_CHECK" else None

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return det_answer, "deterministic-advisor", intent, decision_rubric, evidence

    # Call Gemini API if key is present
    system_prompt = (
        "You are the MyBIZ Personal Business Advisor & Financial Intelligence Assistant for solo founders. "
        "Provide grounded, concise, professional financial guidance based ONLY on the verified financial context below. "
        "NEVER hallucinate or alter any numbers; refer strictly to the authoritative calculated numbers.\n\n"
        f"Verified Financial Context:\n{json.dumps(ctx, indent=2)}\n"
        f"Detected Intent: {intent}\n"
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
                return text.strip(), "gemini", intent, decision_rubric, evidence
    except Exception:
        pass

    return det_answer, "deterministic-advisor", intent, decision_rubric, evidence
