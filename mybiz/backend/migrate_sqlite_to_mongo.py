#!/usr/bin/env python3
"""
SQLite to MongoDB Migration Script for MyBIZ
Migrates existing SQLite relational database tables into MongoDB collections
and initializes atomic sequence counters.
"""

import os
import sys
import sqlite3
import asyncio
from datetime import datetime
from app.config import settings
from app.database import init_db, close_db, set_sequence_value
from app.models import (
    User, Business, Income, Expense, Budget, Savings,
    Customer, Product, Sale, SaleItem, BusinessTransaction, Notification
)

def parse_iso_dt(dt_str):
    if not dt_str:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.utcnow()

async def migrate(sqlite_db_path: str = "mybiz.db"):
    if not os.path.exists(sqlite_db_path):
        print(f"[INFO] SQLite database file '{sqlite_db_path}' not found. Nothing to migrate.")
        return

    print(f"[START] Connecting to MongoDB ({settings.MONGODB_URL}/{settings.DATABASE_NAME})...")
    await init_db()

    print(f"[MIGRATE] Reading data from SQLite '{sqlite_db_path}'...")
    conn = sqlite3.connect(sqlite_db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Users
    try:
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        max_user_id = 0
        for u in users:
            uid = int(u["id"])
            max_user_id = max(max_user_id, uid)
            existing = await User.find_one(User.id == uid)
            if not existing:
                user = User(
                    id=uid,
                    email=u["email"],
                    hashed_password=u["hashed_password"],
                    full_name=u["full_name"],
                    created_at=parse_iso_dt(u["created_at"])
                )
                await user.insert()
        await set_sequence_value("users", max_user_id)
        print(f"  ✓ Users migrated: {len(users)} (max id: {max_user_id})")
    except sqlite3.OperationalError:
        print("  - Table 'users' not found in SQLite.")

    # 2. Businesses
    try:
        cursor.execute("SELECT * FROM businesses")
        businesses = cursor.fetchall()
        max_biz_id = 0
        for b in businesses:
            bid = int(b["id"])
            max_biz_id = max(max_biz_id, bid)
            existing = await Business.find_one(Business.id == bid)
            if not existing:
                biz = Business(
                    id=bid,
                    user_id=int(b["user_id"]),
                    name=b["name"],
                    industry=b["industry"] or "General",
                    currency=b["currency"] or "USD",
                    created_at=parse_iso_dt(b["created_at"])
                )
                await biz.insert()
        await set_sequence_value("businesses", max_biz_id)
        print(f"  ✓ Businesses migrated: {len(businesses)} (max id: {max_biz_id})")
    except sqlite3.OperationalError:
        print("  - Table 'businesses' not found in SQLite.")

    # 3. Incomes
    try:
        cursor.execute("SELECT * FROM incomes")
        incomes = cursor.fetchall()
        max_inc_id = 0
        for i in incomes:
            iid = int(i["id"])
            max_inc_id = max(max_inc_id, iid)
            existing = await Income.find_one(Income.id == iid)
            if not existing:
                inc = Income(
                    id=iid,
                    user_id=int(i["user_id"]),
                    source=i["source"],
                    amount=float(i["amount"]),
                    date=i["date"],
                    category=i["category"] or "Salary",
                    is_recurring=bool(i["is_recurring"]),
                    notes=i["notes"],
                    created_at=parse_iso_dt(i["created_at"])
                )
                await inc.insert()
        await set_sequence_value("incomes", max_inc_id)
        print(f"  ✓ Incomes migrated: {len(incomes)} (max id: {max_inc_id})")
    except sqlite3.OperationalError:
        print("  - Table 'incomes' not found in SQLite.")

    # 4. Expenses
    try:
        cursor.execute("SELECT * FROM expenses")
        expenses = cursor.fetchall()
        max_exp_id = 0
        for e in expenses:
            eid = int(e["id"])
            max_exp_id = max(max_exp_id, eid)
            existing = await Expense.find_one(Expense.id == eid)
            if not existing:
                exp = Expense(
                    id=eid,
                    user_id=int(e["user_id"]),
                    title=e["title"],
                    amount=float(e["amount"]),
                    date=e["date"],
                    category=e["category"] or "General",
                    is_recurring=bool(e["is_recurring"]),
                    notes=e["notes"],
                    created_at=parse_iso_dt(e["created_at"])
                )
                await exp.insert()
        await set_sequence_value("expenses", max_exp_id)
        print(f"  ✓ Expenses migrated: {len(expenses)} (max id: {max_exp_id})")
    except sqlite3.OperationalError:
        print("  - Table 'expenses' not found in SQLite.")

    # 5. Budgets
    try:
        cursor.execute("SELECT * FROM budgets")
        budgets = cursor.fetchall()
        max_b_id = 0
        for b in budgets:
            bid = int(b["id"])
            max_b_id = max(max_b_id, bid)
            existing = await Budget.find_one(Budget.id == bid)
            if not existing:
                budget = Budget(
                    id=bid,
                    user_id=int(b["user_id"]),
                    category=b["category"],
                    amount=float(b["amount"]),
                    month=int(b["month"]),
                    year=int(b["year"]),
                    created_at=parse_iso_dt(b["created_at"])
                )
                await budget.insert()
        await set_sequence_value("budgets", max_b_id)
        print(f"  ✓ Budgets migrated: {len(budgets)} (max id: {max_b_id})")
    except sqlite3.OperationalError:
        print("  - Table 'budgets' not found in SQLite.")

    # 6. Savings
    try:
        cursor.execute("SELECT * FROM savings")
        savings = cursor.fetchall()
        max_s_id = 0
        for s in savings:
            sid = int(s["id"])
            max_s_id = max(max_s_id, sid)
            existing = await Savings.find_one(Savings.id == sid)
            if not existing:
                sav = Savings(
                    id=sid,
                    user_id=int(s["user_id"]),
                    goal_name=s["goal_name"],
                    target_amount=float(s["target_amount"]),
                    current_amount=float(s["current_amount"] or 0.0),
                    target_date=s["target_date"],
                    created_at=parse_iso_dt(s["created_at"])
                )
                await sav.insert()
        await set_sequence_value("savings", max_s_id)
        print(f"  ✓ Savings migrated: {len(savings)} (max id: {max_s_id})")
    except sqlite3.OperationalError:
        print("  - Table 'savings' not found in SQLite.")

    # 7. Customers
    try:
        cursor.execute("SELECT * FROM customers")
        customers = cursor.fetchall()
        max_c_id = 0
        for c in customers:
            cid = int(c["id"])
            max_c_id = max(max_c_id, cid)
            existing = await Customer.find_one(Customer.id == cid)
            if not existing:
                cust = Customer(
                    id=cid,
                    business_id=int(c["business_id"]),
                    name=c["name"],
                    email=c["email"],
                    phone=c["phone"],
                    company=c["company"],
                    status=c["status"] or "active",
                    created_at=parse_iso_dt(c["created_at"])
                )
                await cust.insert()
        await set_sequence_value("customers", max_c_id)
        print(f"  ✓ Customers migrated: {len(customers)} (max id: {max_c_id})")
    except sqlite3.OperationalError:
        print("  - Table 'customers' not found in SQLite.")

    # 8. Products
    try:
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        max_p_id = 0
        for p in products:
            pid = int(p["id"])
            max_p_id = max(max_p_id, pid)
            existing = await Product.find_one(Product.id == pid)
            if not existing:
                prod = Product(
                    id=pid,
                    business_id=int(p["business_id"]),
                    name=p["name"],
                    description=p["description"],
                    price=float(p["price"]),
                    type=p["type"] or "product",
                    sku=p["sku"],
                    created_at=parse_iso_dt(p["created_at"])
                )
                await prod.insert()
        await set_sequence_value("products", max_p_id)
        print(f"  ✓ Products migrated: {len(products)} (max id: {max_p_id})")
    except sqlite3.OperationalError:
        print("  - Table 'products' not found in SQLite.")

    # 9. Sales & SaleItems
    try:
        cursor.execute("SELECT * FROM sales")
        sales = cursor.fetchall()
        max_sale_id = 0
        max_si_id = 0
        for s in sales:
            sid = int(s["id"])
            max_sale_id = max(max_sale_id, sid)
            cursor.execute("SELECT * FROM sale_items WHERE sale_id = ?", (sid,))
            items = cursor.fetchall()
            sale_items = []
            for it in items:
                it_id = int(it["id"])
                max_si_id = max(max_si_id, it_id)
                sale_items.append(SaleItem(
                    id=it_id,
                    product_id=int(it["product_id"]) if it["product_id"] else None,
                    quantity=int(it["quantity"]),
                    unit_price=float(it["unit_price"]),
                    total_price=float(it["total_price"])
                ))
            existing = await Sale.find_one(Sale.id == sid)
            if not existing:
                sale = Sale(
                    id=sid,
                    business_id=int(s["business_id"]),
                    customer_id=int(s["customer_id"]) if s["customer_id"] else None,
                    total_amount=float(s["total_amount"]),
                    status=s["status"] or "paid",
                    date=s["date"],
                    items=sale_items,
                    created_at=parse_iso_dt(s["created_at"])
                )
                await sale.insert()
        await set_sequence_value("sales", max_sale_id)
        await set_sequence_value("sale_items", max_si_id)
        print(f"  ✓ Sales migrated: {len(sales)} (max sale id: {max_sale_id}, max item id: {max_si_id})")
    except sqlite3.OperationalError:
        print("  - Table 'sales' not found in SQLite.")

    # 10. Business Transactions
    try:
        cursor.execute("SELECT * FROM business_transactions")
        txs = cursor.fetchall()
        max_tx_id = 0
        for t in txs:
            tid = int(t["id"])
            max_tx_id = max(max_tx_id, tid)
            existing = await BusinessTransaction.find_one(BusinessTransaction.id == tid)
            if not existing:
                tx = BusinessTransaction(
                    id=tid,
                    business_id=int(t["business_id"]),
                    type=t["type"],
                    category=t["category"] or "General",
                    amount=float(t["amount"]),
                    date=t["date"],
                    description=t["description"],
                    created_at=parse_iso_dt(t["created_at"])
                )
                await tx.insert()
        await set_sequence_value("business_transactions", max_tx_id)
        print(f"  ✓ Business Transactions migrated: {len(txs)} (max id: {max_tx_id})")
    except sqlite3.OperationalError:
        print("  - Table 'business_transactions' not found in SQLite.")

    # 11. Notifications
    try:
        cursor.execute("SELECT * FROM notifications")
        notifs = cursor.fetchall()
        max_notif_id = 0
        for n in notifs:
            nid = int(n["id"])
            max_notif_id = max(max_notif_id, nid)
            existing = await Notification.find_one(Notification.id == nid)
            if not existing:
                col_keys = [k[0] for k in cursor.description]
                category_val = n["category"] if "category" in col_keys else "GENERAL"
                notif = Notification(
                    id=nid,
                    user_id=int(n["user_id"]),
                    title=n["title"],
                    message=n["message"],
                    category=category_val or "GENERAL",
                    type=n["type"] or "info",
                    is_read=bool(n["is_read"]),
                    created_at=parse_iso_dt(n["created_at"])
                )
                await notif.insert()
        await set_sequence_value("notifications", max_notif_id)
        print(f"  ✓ Notifications migrated: {len(notifs)} (max id: {max_notif_id})")
    except sqlite3.OperationalError:
        print("  - Table 'notifications' not found in SQLite.")

    conn.close()
    await close_db()
    print("[SUCCESS] All SQLite data successfully migrated into MongoDB!")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "mybiz.db"
    asyncio.run(migrate(path))
