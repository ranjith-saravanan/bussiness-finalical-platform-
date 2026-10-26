import asyncio
import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
from app.main import app
from app.database import init_db

app.state.testing = True

# Isolated in-memory MongoDB mock database
mock_client = AsyncMongoMockClient()
asyncio.run(init_db(client_override=mock_client, db_name_override="test_mybiz_alex"))

client = TestClient(app)

def test_alex_rivera_full_e2e_demonstration():
    # 1. Alex registers & logs in
    reg = client.post("/api/v1/auth/register", json={
        "email": "alex@apexdigital.studio",
        "password": "ApexPassword2026!",
        "full_name": "Alex Rivera"
    })
    assert reg.status_code == 200, reg.text
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup Apex Digital Studio
    biz_list = client.get("/api/v1/businesses", headers=headers).json()
    biz_id = biz_list[0]["id"]
    # Update business name to Apex Digital Studio if needed or create one
    client.post("/api/v1/businesses", headers=headers, json={
        "name": "Apex Digital Studio",
        "industry": "Digital Consulting",
        "currency": "USD"
    })
    bizs = client.get("/api/v1/businesses", headers=headers).json()
    apex_biz = next((b for b in bizs if b["name"] == "Apex Digital Studio"), bizs[0])
    biz_id = apex_biz["id"]

    # 3. Create Customer & Product for Apex Digital Studio
    cust_res = client.post("/api/v1/customers", headers=headers, json={
        "business_id": biz_id,
        "name": "Acme Global Enterprise",
        "email": "invoicing@acmeglobal.com",
        "company": "Acme Global",
        "status": "active"
    })
    assert cust_res.status_code == 201
    cust_id = cust_res.json()["id"]

    prod_res = client.post("/api/v1/products", headers=headers, json={
        "business_id": biz_id,
        "name": "Enterprise Consulting Retainer",
        "description": "Monthly advisory & full-stack development retainer",
        "price": 2500.0,
        "type": "service",
        "sku": "ADV-RETAINER-01"
    })
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 4. Alex records a $5,000 client sale (2 units @ $2,500)
    sale_res = client.post("/api/v1/sales", headers=headers, json={
        "business_id": biz_id,
        "customer_id": cust_id,
        "date": "2026-10-10",
        "status": "paid",
        "items": [
            {"product_id": prod_id, "quantity": 2, "unit_price": 2500.0}
        ]
    })
    assert sale_res.status_code == 201
    assert sale_res.json()["total_amount"] == 5000.0

    # 5. Alex records $1,200 in business expenses (OpEx)
    biz_exp_res = client.post("/api/v1/business-transactions", headers=headers, json={
        "business_id": biz_id,
        "type": "expense",
        "category": "Cloud Infrastructure & Software",
        "amount": 1200.0,
        "date": "2026-10-12",
        "description": "AWS Hosting, Github Enterprise, Figma, and Contractor Stipend"
    })
    assert biz_exp_res.status_code == 201

    # 6. Alex records personal income: $10,000 (e.g. $6,000 + $4,000)
    inc1 = client.post("/api/v1/income", headers=headers, json={
        "source": "Consulting Draw 1",
        "amount": 6000.0,
        "date": "2026-10-01",
        "category": "Draw",
        "is_recurring": True
    })
    assert inc1.status_code == 201

    inc2 = client.post("/api/v1/income", headers=headers, json={
        "source": "Consulting Draw 2",
        "amount": 4000.0,
        "date": "2026-10-15",
        "category": "Draw",
        "is_recurring": False
    })
    assert inc2.status_code == 201

    # 7. Alex records personal expenses: $2,000 ($1,500 Housing recurring, $500 Food/General)
    exp1 = client.post("/api/v1/expenses", headers=headers, json={
        "title": "Apartment Rent & Utilities",
        "amount": 1500.0,
        "date": "2026-10-02",
        "category": "Housing",
        "is_recurring": True
    })
    assert exp1.status_code == 201

    exp2 = client.post("/api/v1/expenses", headers=headers, json={
        "title": "Groceries & Dining",
        "amount": 500.0,
        "date": "2026-10-14",
        "category": "Food",
        "is_recurring": False
    })
    assert exp2.status_code == 201

    # 8. Alex configures Housing Budget: $2,000
    b_res = client.post("/api/v1/budgets", headers=headers, json={
        "category": "Housing",
        "amount": 2000.0,
        "month": 10,
        "year": 2026
    })
    assert b_res.status_code == 201

    # 9. Alex sets Savings Goal: $7,500 / $20,000
    sav_res = client.post("/api/v1/savings", headers=headers, json={
        "goal_name": "Emergency Runway Reserve",
        "target_amount": 20000.0,
        "current_amount": 7500.0,
        "target_date": "2027-10-01"
    })
    assert sav_res.status_code == 201

    # 10. VERIFY ALL 5 MATHEMATICAL EQUATIONS FROM DATABASE

    # A. Dashboard Summary
    dash = client.get("/api/v1/dashboard", headers=headers).json()

    # Equation 1: Personal Net Cash Flow = $10,000 - $2,000 = $8,000
    assert dash["total_personal_income"] == 10000.0, f"Expected 10000, got {dash['total_personal_income']}"
    assert dash["total_personal_expense"] == 2000.0, f"Expected 2000, got {dash['total_personal_expense']}"
    assert dash["net_personal_cashflow"] == 8000.0, f"Expected 8000, got {dash['net_personal_cashflow']}"

    # Equation 2: Business Operating Profit = $5,000 - $1,200 = $3,800
    assert dash["business_revenue"] == 5000.0, f"Expected 5000, got {dash['business_revenue']}"
    assert dash["business_expenses"] == 1200.0, f"Expected 1200, got {dash['business_expenses']}"
    assert dash["business_profit"] == 3800.0, f"Expected 3800, got {dash['business_profit']}"

    # Equation 3: Business Margin = $3,800 / $5,000 = 76.0%
    assert dash["business_margin"] == 76.0, f"Expected 76.0, got {dash['business_margin']}"

    # Equation 4: Savings Goal Progress = $7,500 / $20,000 = 37.5%
    assert dash["total_savings_current"] == 7500.0, f"Expected 7500, got {dash['total_savings_current']}"
    assert dash["total_savings_target"] == 20000.0, f"Expected 20000, got {dash['total_savings_target']}"
    savings_list = client.get("/api/v1/savings", headers=headers).json()
    assert savings_list[0]["progress_percentage"] == 37.5, f"Expected 37.5, got {savings_list[0]['progress_percentage']}"

    # Equation 5: Budget Utilization = $1,500 / $2,000 = 75.0%
    budget_statuses = client.get("/api/v1/budgets/status?month=10&year=2026", headers=headers).json()
    housing_budget = next(b for b in budget_statuses if b["category"] == "Housing")
    assert housing_budget["allocated"] == 2000.0
    assert housing_budget["spent"] == 1500.0
    assert housing_budget["percentage"] == 75.0
    assert housing_budget["remaining"] == 500.0

    # Equation 6: SAFE TO SPEND CALCULATION
    # Safe Personal Spending = Available Personal Cash ($8,000) - Upcoming Personal Commitments ($1,500) - Savings Reserve Requirement ($2,000) - Safety Buffer ($1,000) = $3,500
    assert dash["available_personal_cash"] == 8000.0
    assert dash["upcoming_personal_commitments"] == 1500.0
    assert dash["savings_reserve_requirement"] == 2000.0
    assert dash["safety_buffer"] == 1000.0
    assert dash["safe_personal_spending"] == 3500.0, f"Expected 3500.0, got {dash['safe_personal_spending']}"

    # Tax Reserve on Business Profit = $3,800 * 0.25 = $950.00
    assert dash["tax_reserve_rate"] == 0.25
    assert dash["suggested_tax_reserve"] == 950.0

    # 11. Check Customer CRM Enrichment
    cust_data = client.get(f"/api/v1/customers?business_id={biz_id}", headers=headers).json()
    acme_cust = next(c for c in cust_data if c["id"] == cust_id)
    assert acme_cust["total_revenue"] == 5000.0
    assert acme_cust["sales_count"] == 1
    assert acme_cust["average_order_value"] == 5000.0

    # 12. Check Forecast
    fc_res = client.get("/api/v1/forecast", headers=headers)
    assert fc_res.status_code == 200
    assert "disclaimer" in fc_res.json()

    # 13. Check Notifications
    notifs_res = client.post("/api/v1/notifications/generate", headers=headers)
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert any(n["category"] == "BUSINESS" for n in notifs)

    # 14. Alex asks AI: "Can I safely spend $2,000 this month?"
    ai_res = client.post("/api/v1/ai/chat", headers=headers, json={
        "question": "Can I safely spend $2,000 this month?"
    })
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert ai_data["intent"] == "AFFORDABILITY_CHECK"
    assert ai_data["decision_rubric"]["verdict"] == "AFFORDABLE"
    assert ai_data["decision_rubric"]["safe_personal_spending"] == 3500.0
    assert "$3,500" in ai_data["answer"] or "SAFE TO SPEND" in ai_data["answer"]
    assert "tax reserve" in ai_data["answer"].lower()

    # 15. CSV Export verification
    exp_csv = client.get("/api/v1/export/csv?data_type=sales", headers=headers)
    assert exp_csv.status_code == 200
    assert "text/csv" in exp_csv.headers["content-type"]
