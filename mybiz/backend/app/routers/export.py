import csv
import io
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Income, Expense, Sale, Customer, Product, BusinessTransaction, Business
from app.auth import get_current_user

router = APIRouter(prefix="/export", tags=["Data Export"])

@router.get("/csv")
def export_csv(
    data_type: str = Query(..., description="income, expenses, sales, customers, products, transactions"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    user_biz_ids = [b.id for b in current_user.businesses]

    if data_type == "income":
        writer.writerow(["ID", "Date", "Source", "Category", "Amount", "Is Recurring", "Notes"])
        items = db.query(Income).filter(Income.user_id == current_user.id).all()
        for i in items:
            writer.writerow([i.id, i.date, i.source, i.category, i.amount, i.is_recurring, i.notes or ""])

    elif data_type == "expenses":
        writer.writerow(["ID", "Date", "Title", "Category", "Amount", "Is Recurring", "Notes"])
        items = db.query(Expense).filter(Expense.user_id == current_user.id).all()
        for e in items:
            writer.writerow([e.id, e.date, e.title, e.category, e.amount, e.is_recurring, e.notes or ""])

    elif data_type == "sales":
        writer.writerow(["ID", "Date", "Business ID", "Customer ID", "Total Amount", "Status"])
        items = db.query(Sale).filter(Sale.business_id.in_(user_biz_ids)).all()
        for s in items:
            writer.writerow([s.id, s.date, s.business_id, s.customer_id or "", s.total_amount, s.status])

    elif data_type == "customers":
        writer.writerow(["ID", "Business ID", "Name", "Email", "Phone", "Company", "Status"])
        items = db.query(Customer).filter(Customer.business_id.in_(user_biz_ids)).all()
        for c in items:
            writer.writerow([c.id, c.business_id, c.name, c.email or "", c.phone or "", c.company or "", c.status])

    elif data_type == "products":
        writer.writerow(["ID", "Business ID", "Name", "Type", "Price", "SKU", "Description"])
        items = db.query(Product).filter(Product.business_id.in_(user_biz_ids)).all()
        for p in items:
            writer.writerow([p.id, p.business_id, p.name, p.type, p.price, p.sku or "", p.description or ""])

    elif data_type == "transactions":
        writer.writerow(["ID", "Date", "Business ID", "Type", "Category", "Amount", "Description"])
        items = db.query(BusinessTransaction).filter(BusinessTransaction.business_id.in_(user_biz_ids)).all()
        for t in items:
            writer.writerow([t.id, t.date, t.business_id, t.type, t.category, t.amount, t.description or ""])

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid data_type: {data_type}. Choose from income, expenses, sales, customers, products, transactions."
        )

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mybiz_{data_type}.csv"}
    )
