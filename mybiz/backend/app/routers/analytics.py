from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.models import User, Income, Expense, Budget, Savings, Business, Sale, Customer, Product, BusinessTransaction
from app.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/personal")
async def get_personal_analytics(current_user: User = Depends(get_current_user)):
    incomes = await Income.find(Income.user_id == current_user.id).to_list()
    expenses = await Expense.find(Expense.user_id == current_user.id).to_list()

    # 1. Expense Breakdown by Category
    exp_cat_map = {}
    for e in expenses:
        exp_cat_map[e.category] = exp_cat_map.get(e.category, 0.0) + e.amount
    expense_breakdown = [
        {"category": c, "amount": round(float(t), 2)}
        for c, t in sorted(exp_cat_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # 2. Income Breakdown by Category
    inc_cat_map = {}
    for i in incomes:
        inc_cat_map[i.category] = inc_cat_map.get(i.category, 0.0) + i.amount
    income_breakdown = [
        {"category": c, "amount": round(float(t), 2)}
        for c, t in sorted(inc_cat_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # 3. Monthly Income vs Expense Trend
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
    budgets = await Budget.find(
        Budget.user_id == current_user.id,
        Budget.month == now.month,
        Budget.year == now.year
    ).to_list()

    budget_utilization = []
    for b in budgets:
        spent = sum(
            e.amount for e in expenses
            if e.category == b.category and e.date.startswith(m_str)
        )
        pct = (spent / b.amount * 100) if b.amount > 0 else 0
        budget_utilization.append({
            "category": b.category,
            "allocated": round(b.amount, 2),
            "spent": round(spent, 2),
            "percentage": round(pct, 1)
        })

    # 5. Savings Progress
    savings_list = await Savings.find(Savings.user_id == current_user.id).to_list()
    savings_progress = [
        {
            "goal": s.goal_name,
            "current": round(s.current_amount, 2),
            "target": round(s.target_amount, 2),
            "percentage": round((s.current_amount / s.target_amount * 100) if s.target_amount > 0 else 0, 1)
        }
        for s in savings_list
    ]

    # 6. Expense Intelligence & MoM Trends
    total_spent = sum(item["amount"] for item in expense_breakdown)
    highest_category = None
    if expense_breakdown:
        top_cat = max(expense_breakdown, key=lambda x: x["amount"])
        highest_category = {
            "category": top_cat["category"],
            "amount": top_cat["amount"],
            "percentage": round((top_cat["amount"] / total_spent * 100), 1) if total_spent > 0 else 0.0
        }

    all_months = sorted(list(monthly_map.keys()))
    mom_changes = []
    if len(all_months) >= 2:
        curr_m = all_months[-1]
        prev_m = all_months[-2]
        
        curr_cat_spends = {c: 0.0 for c in exp_cat_map}
        prev_cat_spends = {c: 0.0 for c in exp_cat_map}

        for e in expenses:
            m = e.date[:7]
            if m == curr_m and e.category in curr_cat_spends:
                curr_cat_spends[e.category] += e.amount
            elif m == prev_m and e.category in prev_cat_spends:
                prev_cat_spends[e.category] += e.amount

        for cat in curr_cat_spends:
            curr_val = curr_cat_spends[cat]
            prev_val = prev_cat_spends[cat]
            if prev_val > 0 and curr_val > 0:
                pct_change = round(((curr_val - prev_val) / prev_val) * 100, 1)
                mom_changes.append({
                    "category": cat,
                    "current": round(curr_val, 2),
                    "previous": round(prev_val, 2),
                    "pct_change": pct_change,
                    "direction": "up" if pct_change > 0 else "down"
                })

    return {
        "expense_breakdown": expense_breakdown,
        "income_breakdown": income_breakdown,
        "monthly_trend": monthly_trend,
        "budget_utilization": budget_utilization,
        "savings_progress": savings_progress,
        "expense_intelligence": {
            "highest_category": highest_category,
            "mom_changes": mom_changes,
            "total_expenses_recorded": round(total_spent, 2)
        }
    }

@router.get("/business")
async def get_business_analytics(
    business_id: int = None,
    tax_rate: float = 0.25,
    current_user: User = Depends(get_current_user)
):
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    biz_ids = [b.id for b in user_businesses]
    if business_id and business_id in biz_ids:
        biz_ids = [business_id]

    if not biz_ids:
        return {
            "total_revenue": 0.0,
            "total_expenses": 0.0,
            "net_profit": 0.0,
            "profit_margin": 0.0,
            "sales_count": 0,
            "tax_reserve_rate": tax_rate,
            "suggested_tax_reserve": 0.0,
            "tax_disclaimer": "Estimate — not official tax advice.",
            "top_customers": [],
            "revenue_by_product": [],
            "expense_by_category": [],
            "monthly_business_trend": []
        }

    paid_sales = await Sale.find({"business_id": {"$in": biz_ids}, "status": "paid"}).to_list()
    all_sales = await Sale.find({"business_id": {"$in": biz_ids}}).to_list()
    sales_total = sum(s.total_amount for s in paid_sales)
    sales_count = len(all_sales)

    biz_txs = await BusinessTransaction.find({"business_id": {"$in": biz_ids}}).to_list()
    tx_rev = sum(t.amount for t in biz_txs if t.type == "revenue")
    total_exp = sum(t.amount for t in biz_txs if t.type == "expense")
    total_rev = sales_total + tx_rev

    net_profit = total_rev - total_exp
    profit_margin = round((net_profit / total_rev * 100), 1) if total_rev > 0 else 0.0

    eff_tax_rate = max(0.0, min(0.5, float(tax_rate)))
    suggested_tax_reserve = round(max(0.0, net_profit * eff_tax_rate), 2)

    # Monthly Trend
    monthly_map = {}
    for s in paid_sales:
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

    # Top Customers Leaderboard
    customers = await Customer.find({"business_id": {"$in": biz_ids}}).to_list()
    top_customers = []
    for c in customers:
        c_sales = [s for s in paid_sales if s.customer_id == c.id]
        if c_sales:
            c_rev = sum(s.total_amount for s in c_sales)
            top_customers.append({
                "id": c.id,
                "name": c.name,
                "company": c.company or c.name,
                "total_revenue": round(c_rev, 2),
                "sales_count": len(c_sales),
                "average_sale_value": round(c_rev / len(c_sales), 2)
            })
    top_customers.sort(key=lambda x: x["total_revenue"], reverse=True)
    top_customers = top_customers[:5]

    # Revenue by Product / Service Leaderboard
    products = await Product.find({"business_id": {"$in": biz_ids}}).to_list()
    product_leaderboard = []
    for p in products:
        items = [it for s in paid_sales for it in s.items if it.product_id == p.id]
        if items:
            p_rev = sum(it.total_price for it in items)
            units = sum(it.quantity for it in items)
            product_leaderboard.append({
                "id": p.id,
                "name": p.name,
                "type": p.type,
                "price": p.price,
                "total_revenue": round(p_rev, 2),
                "units_sold": units
            })
    product_leaderboard.sort(key=lambda x: x["total_revenue"], reverse=True)

    # Business Expense by Category
    exp_cat_map = {}
    for tx in biz_txs:
        if tx.type == "expense":
            exp_cat_map[tx.category] = exp_cat_map.get(tx.category, 0.0) + tx.amount
    expense_by_category = [{"category": c, "amount": round(float(t), 2)} for c, t in exp_cat_map.items()]

    return {
        "total_revenue": round(total_rev, 2),
        "total_expenses": round(total_exp, 2),
        "net_profit": round(net_profit, 2),
        "profit_margin": profit_margin,
        "sales_count": sales_count,
        "tax_reserve_rate": eff_tax_rate,
        "suggested_tax_reserve": suggested_tax_reserve,
        "tax_disclaimer": "Estimate — not official tax advice. Consult a qualified CPA for state and federal compliance.",
        "top_customers": top_customers,
        "revenue_by_product": product_leaderboard,
        "expense_by_category": expense_by_category,
        "monthly_business_trend": monthly_trend
    }
