import csv
import io
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from app.models import User, Income, Expense, Sale, Customer, Product, BusinessTransaction, Business
from app.auth import get_current_user

router = APIRouter(prefix="/export", tags=["Data Export"])

@router.get("/csv")
async def export_csv(
    data_type: str = Query(..., description="income, expenses, sales, customers, products, transactions"),
    current_user: User = Depends(get_current_user)
):
    output = io.StringIO()
    writer = csv.writer(output)

    user_businesses = await Business.find(Business.user_id == current_user.id).to_list()
    user_biz_ids = [b.id for b in user_businesses]

    if data_type == "income":
        writer.writerow(["ID", "Date", "Source", "Category", "Amount", "Is Recurring", "Notes"])
        items = await Income.find(Income.user_id == current_user.id).to_list()
        for i in items:
            writer.writerow([i.id, i.date, i.source, i.category, i.amount, i.is_recurring, i.notes or ""])

    elif data_type == "expenses":
        writer.writerow(["ID", "Date", "Title", "Category", "Amount", "Is Recurring", "Notes"])
        items = await Expense.find(Expense.user_id == current_user.id).to_list()
        for e in items:
            writer.writerow([e.id, e.date, e.title, e.category, e.amount, e.is_recurring, e.notes or ""])

    elif data_type == "sales":
        writer.writerow(["ID", "Date", "Business ID", "Customer ID", "Total Amount", "Status"])
        items = await Sale.find({"business_id": {"$in": user_biz_ids}}).to_list()
        for s in items:
            writer.writerow([s.id, s.date, s.business_id, s.customer_id or "", s.total_amount, s.status])

    elif data_type == "customers":
        writer.writerow(["ID", "Business ID", "Name", "Email", "Phone", "Company", "Status"])
        items = await Customer.find({"business_id": {"$in": user_biz_ids}}).to_list()
        for c in items:
            writer.writerow([c.id, c.business_id, c.name, c.email or "", c.phone or "", c.company or "", c.status])

    elif data_type == "products":
        writer.writerow(["ID", "Business ID", "Name", "Type", "Price", "SKU", "Description"])
        items = await Product.find({"business_id": {"$in": user_biz_ids}}).to_list()
        for p in items:
            writer.writerow([p.id, p.business_id, p.name, p.type, p.price, p.sku or "", p.description or ""])

    elif data_type == "transactions":
        writer.writerow(["ID", "Date", "Business ID", "Type", "Category", "Amount", "Description"])
        items = await BusinessTransaction.find({"business_id": {"$in": user_biz_ids}}).to_list()
        for t in items:
            writer.writerow([t.id, t.date, t.business_id, t.type, t.category, t.amount, t.description or ""])

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported data type: {data_type}")

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mybiz_{data_type}.csv"}
    )
