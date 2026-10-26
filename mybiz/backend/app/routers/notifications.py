from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone
from app.database import get_next_sequence_value
from app.models import User, Notification, Budget, Expense, Income, Savings, Business, Sale, BusinessTransaction
from app.schemas import NotificationOut
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
async def get_notifications(current_user: User = Depends(get_current_user)):
    return await Notification.find(Notification.user_id == current_user.id)\
        .sort(-Notification.created_at).limit(20).to_list()

@router.post("/generate", response_model=List[NotificationOut])
async def evaluate_and_generate_notifications(current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    m_str = f"{now.year}-{now.month:02d}"

    unread_notifications = await Notification.find(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).to_list()
    existing_unread_titles = set(n.title for n in unread_notifications)

    user_expenses = await Expense.find(Expense.user_id == current_user.id).to_list()
    user_incomes = await Income.find(Income.user_id == current_user.id).to_list()

    # 1. Check budget limits (BUDGET)
    budgets = await Budget.find(
        Budget.user_id == current_user.id,
        Budget.month == now.month,
        Budget.year == now.year
    ).to_list()

    for b in budgets:
        spent = sum(
            e.amount for e in user_expenses
            if e.category == b.category and e.date.startswith(m_str)
        )
        if b.amount > 0 and spent >= (0.85 * b.amount):
            title = f"Budget Alert: {b.category}"
            if title not in existing_unread_titles:
                pct = (spent / b.amount) * 100
                nid = await get_next_sequence_value("notifications")
                notif = Notification(
                    id=nid,
                    user_id=current_user.id,
                    title=title,
                    message=f"You have used {pct:.0f}% of your ${b.amount:,.2f} budget for {b.category} (${spent:,.2f} spent).",
                    category="BUDGET",
                    type="warning" if pct < 100 else "alert"
                )
                await notif.insert()
                existing_unread_titles.add(title)

    # 2. Check low cash flow (CASH_FLOW)
    income = sum(i.amount for i in user_incomes if i.date.startswith(m_str))
    expense = sum(e.amount for e in user_expenses if e.date.startswith(m_str))
    
    if expense > income and income > 0:
        title = "Cash Flow Warning"
        if title not in existing_unread_titles:
            nid = await get_next_sequence_value("notifications")
            notif = Notification(
                id=nid,
                user_id=current_user.id,
                title=title,
                message=f"Your expenses (${expense:,.2f}) exceed your income (${income:,.2f}) this month by ${expense - income:,.2f}.",
                category="CASH_FLOW",
                type="alert"
            )
            await notif.insert()
            existing_unread_titles.add(title)

    # 3. Savings reminder (SAVINGS)
    savings = await Savings.find(Savings.user_id == current_user.id).to_list()
    for s in savings:
        if s.target_amount > 0 and s.current_amount < (0.5 * s.target_amount):
            title = f"Savings Reminder: {s.goal_name}"
            if title not in existing_unread_titles:
                nid = await get_next_sequence_value("notifications")
                notif = Notification(
                    id=nid,
                    user_id=current_user.id,
                    title=title,
                    message=f"Your goal '{s.goal_name}' is currently at ${s.current_amount:,.2f} of ${s.target_amount:,.2f}. Consider making a contribution this week.",
                    category="SAVINGS",
                    type="info"
                )
                await notif.insert()
                existing_unread_titles.add(title)

    # 4. Business performance & tax reserve (BUSINESS)
    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    biz_ids = [b.id for b in user_businesses]
    if biz_ids:
        paid_sales = await Sale.find({"business_id": {"$in": biz_ids}, "status": "paid"}).to_list()
        sales_total = sum(s.total_amount for s in paid_sales)
        biz_txs = await BusinessTransaction.find({"business_id": {"$in": biz_ids}}).to_list()
        biz_exp = sum(t.amount for t in biz_txs if t.type == "expense")
        profit = sales_total - biz_exp

        if profit > 1000:
            title = "Tax Reserve Recommendation"
            if title not in existing_unread_titles:
                tax_res = profit * 0.25
                nid = await get_next_sequence_value("notifications")
                notif = Notification(
                    id=nid,
                    user_id=current_user.id,
                    title=title,
                    message=f"Your business has generated ${profit:,.2f} in net profit. We recommend withholding ~25% (${tax_res:,.2f}) into a tax reserve account.",
                    category="BUSINESS",
                    type="info"
                )
                await notif.insert()
                existing_unread_titles.add(title)

        if sales_total > 1000:
            title = "Business Milestone Achieved"
            if title not in existing_unread_titles:
                nid = await get_next_sequence_value("notifications")
                notif = Notification(
                    id=nid,
                    user_id=current_user.id,
                    title=title,
                    message=f"Congratulations! Your business sales have surpassed ${sales_total:,.2f} in recorded revenue.",
                    category="BUSINESS",
                    type="success"
                )
                await notif.insert()
                existing_unread_titles.add(title)

    # 5. Expense intelligence alerts (EXPENSE)
    if len(user_expenses) >= 5:
        avg_exp = sum(e.amount for e in user_expenses) / len(user_expenses)
        large_exp = [e for e in user_expenses if e.amount > (2.5 * avg_exp) and e.amount > 500]
        if large_exp:
            top_single = max(large_exp, key=lambda x: x.amount)
            title = f"High Outflow Detected: {top_single.title}"
            if title not in existing_unread_titles:
                nid = await get_next_sequence_value("notifications")
                notif = Notification(
                    id=nid,
                    user_id=current_user.id,
                    title=title,
                    message=f"An expense of ${top_single.amount:,.2f} in category '{top_single.category}' was significantly higher than your typical average (${avg_exp:,.2f}).",
                    category="EXPENSE",
                    type="warning"
                )
                await notif.insert()
                existing_unread_titles.add(title)

    return await Notification.find(Notification.user_id == current_user.id)\
        .sort(-Notification.created_at).limit(20).to_list()

@router.put("/{notif_id}/read", response_model=NotificationOut)
async def mark_notification_read(notif_id: int, current_user: User = Depends(get_current_user)):
    n = await Notification.find_one(Notification.id == notif_id, Notification.user_id == current_user.id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    await n.save()
    return n

@router.post("/read-all")
async def mark_all_notifications_read(current_user: User = Depends(get_current_user)):
    await Notification.find(Notification.user_id == current_user.id).update({"$set": {"is_read": True}})
    return {"message": "All notifications marked as read"}
