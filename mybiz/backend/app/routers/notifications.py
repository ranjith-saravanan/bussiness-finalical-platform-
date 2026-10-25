from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, Notification, Budget, Expense, Income, Savings, Business, Sale, BusinessTransaction
from app.schemas import NotificationOut
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id == current_user.id)\
        .order_by(Notification.created_at.desc()).limit(20).all()

@router.post("/generate", response_model=List[NotificationOut])
def evaluate_and_generate_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    m_str = f"{now.year}-{now.month:02d}"

    # 1. Check budget limits
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.month == now.month, Budget.year == now.year).all()
    for b in budgets:
        spent = db.query(func.coalesce(func.sum(Expense.amount), 0.0))\
            .filter(Expense.user_id == current_user.id, Expense.category == b.category, Expense.date.startswith(m_str)).scalar()
        if b.amount > 0 and spent >= (0.85 * b.amount):
            title = f"Budget Alert: {b.category}"
            # Check if recently notified
            exists = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.title == title).first()
            if not exists:
                pct = (spent / b.amount) * 100
                notif = Notification(
                    user_id=current_user.id,
                    title=title,
                    message=f"You have used {pct:.0f}% of your ${b.amount:,.2f} budget for {b.category} (${spent:,.2f} spent).",
                    type="warning" if pct < 100 else "alert"
                )
                db.add(notif)

    # 2. Check low cash flow
    income = db.query(func.coalesce(func.sum(Income.amount), 0.0))\
        .filter(Income.user_id == current_user.id, Income.date.startswith(m_str)).scalar()
    expense = db.query(func.coalesce(func.sum(Expense.amount), 0.0))\
        .filter(Expense.user_id == current_user.id, Expense.date.startswith(m_str)).scalar()
    
    if expense > income and income > 0:
        title = "Cash Flow Warning"
        exists = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.title == title).first()
        if not exists:
            db.add(Notification(
                user_id=current_user.id,
                title=title,
                message=f"Your expenses (${expense:,.2f}) exceed your income (${income:,.2f}) this month by ${expense - income:,.2f}.",
                type="alert"
            ))

    # 3. Savings reminder
    savings = db.query(Savings).filter(Savings.user_id == current_user.id).all()
    for s in savings:
        if s.target_amount > 0 and s.current_amount < (0.5 * s.target_amount):
            title = f"Savings Reminder: {s.goal_name}"
            exists = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.title == title).first()
            if not exists:
                db.add(Notification(
                    user_id=current_user.id,
                    title=title,
                    message=f"Your goal '{s.goal_name}' is currently at ${s.current_amount:,.2f} of ${s.target_amount:,.2f}. Consider making a contribution this week.",
                    type="info"
                ))

    # 4. Business performance alert
    biz_ids = [b.id for b in current_user.businesses]
    if biz_ids:
        sales_total = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
            .filter(Sale.business_id.in_(biz_ids), Sale.status == "paid").scalar()
        if sales_total > 1000:
            title = "Business Milestone Achieved"
            exists = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.title == title).first()
            if not exists:
                db.add(Notification(
                    user_id=current_user.id,
                    title=title,
                    message=f"Congratulations! Your business sales have surpassed ${sales_total:,.2f} in recorded revenue.",
                    type="success"
                ))

    db.commit()
    return db.query(Notification).filter(Notification.user_id == current_user.id)\
        .order_by(Notification.created_at.desc()).limit(20).all()

@router.put("/{notif_id}/read", response_model=NotificationOut)
def mark_notification_read(notif_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n

@router.post("/read-all")
def mark_all_notifications_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
