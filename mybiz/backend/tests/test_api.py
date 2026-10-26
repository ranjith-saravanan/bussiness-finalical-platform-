import asyncio
import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
from app.main import app
from app.database import init_db

app.state.testing = True

# Initialize mock Mongo database for isolated test execution
mock_client = AsyncMongoMockClient()
asyncio.run(init_db(client_override=mock_client, db_name_override="test_mybiz_api"))

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    # Register test user
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "testuser@mybiz.app",
        "password": "Password123!",
        "full_name": "Test Founder"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_healthz():
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    assert resp.json()["database"] == "mongodb"

def test_user_login(auth_headers):
    resp = client.post("/api/v1/auth/login", json={
        "email": "testuser@mybiz.app",
        "password": "Password123!"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_income_crud(auth_headers):
    # Create income
    resp = client.post("/api/v1/income", headers=auth_headers, json={
        "source": "Software Consulting",
        "amount": 5000.0,
        "date": "2026-10-01",
        "category": "Salary"
    })
    assert resp.status_code == 201
    income_id = resp.json()["id"]

    # Read income
    get_resp = client.get("/api/v1/income", headers=auth_headers)
    assert get_resp.status_code == 200
    assert any(i["id"] == income_id for i in get_resp.json())

def test_expense_crud(auth_headers):
    resp = client.post("/api/v1/expenses", headers=auth_headers, json={
        "title": "Cloud Hosting",
        "amount": 250.0,
        "date": "2026-10-05",
        "category": "Technology"
    })
    assert resp.status_code == 201
    expense_id = resp.json()["id"]

    get_resp = client.get("/api/v1/expenses", headers=auth_headers)
    assert get_resp.status_code == 200
    assert any(e["id"] == expense_id for e in get_resp.json())

def test_budget_and_status(auth_headers):
    resp = client.post("/api/v1/budgets", headers=auth_headers, json={
        "category": "Technology",
        "amount": 500.0,
        "month": 10,
        "year": 2026
    })
    assert resp.status_code == 201

    status_resp = client.get("/api/v1/budgets/status?month=10&year=2026", headers=auth_headers)
    assert status_resp.status_code == 200
    tech_budget = next((b for b in status_resp.json() if b["category"] == "Technology"), None)
    assert tech_budget is not None
    assert tech_budget["allocated"] == 500.0
    assert tech_budget["spent"] == 250.0

def test_savings(auth_headers):
    resp = client.post("/api/v1/savings", headers=auth_headers, json={
        "goal_name": "Emergency Fund",
        "target_amount": 10000.0,
        "current_amount": 2500.0,
        "target_date": "2026-12-31"
    })
    assert resp.status_code == 201
    assert resp.json()["current_amount"] == 2500.0

def test_business_and_sales(auth_headers):
    # Get active businesses
    biz_resp = client.get("/api/v1/businesses", headers=auth_headers)
    assert biz_resp.status_code == 200
    biz_id = biz_resp.json()[0]["id"]

    # Create customer
    cust_resp = client.post("/api/v1/customers", headers=auth_headers, json={
        "business_id": biz_id,
        "name": "Acme Corp",
        "email": "contact@acme.com"
    })
    assert cust_resp.status_code == 201
    cust_id = cust_resp.json()["id"]

    # Create product
    prod_resp = client.post("/api/v1/products", headers=auth_headers, json={
        "business_id": biz_id,
        "name": "Website Audit",
        "price": 1200.0,
        "type": "service"
    })
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # Record sale
    sale_resp = client.post("/api/v1/sales", headers=auth_headers, json={
        "business_id": biz_id,
        "customer_id": cust_id,
        "date": "2026-10-10",
        "status": "paid",
        "items": [
            {"product_id": prod_id, "quantity": 1, "unit_price": 1200.0}
        ]
    })
    assert sale_resp.status_code == 201
    assert sale_resp.json()["total_amount"] == 1200.0

def test_dashboard_metrics(auth_headers):
    resp = client.get("/api/v1/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_personal_income"] == 5000.0
    assert data["total_personal_expense"] == 250.0
    assert data["net_personal_cashflow"] == 4750.0
    assert data["business_revenue"] == 1200.0

def test_ai_advisor(auth_headers):
    resp = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "question": "How much did I spend this month?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "$250.00" in data["answer"]

def test_forecast(auth_headers):
    resp = client.get("/api/v1/forecast", headers=auth_headers)
    assert resp.status_code == 200
    assert "forecasted_income" in resp.json()
    assert "trend_direction" in resp.json()

def test_notifications_generate(auth_headers):
    resp = client.post("/api/v1/notifications/generate", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_export_csv(auth_headers):
    resp = client.get("/api/v1/export/csv?data_type=income", headers=auth_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "Software Consulting" in resp.text

def test_safe_to_spend_and_five_questions(auth_headers):
    resp = client.get("/api/v1/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "available_personal_cash" in data
    assert "upcoming_personal_commitments" in data
    assert "savings_reserve_requirement" in data
    assert "safety_buffer" in data
    assert "safe_personal_spending" in data
    assert "safe_to_spend_breakdown" in data
    assert "five_questions" in data
    assert "suggested_tax_reserve" in data
    assert "tax_reserve_rate" in data

    # Check breakdown formula and explanation
    breakdown = data["safe_to_spend_breakdown"]
    assert breakdown["safe_personal_spending"] == data["safe_personal_spending"]
    assert "disclaimer" in breakdown

    # Check 5 Decision Questions
    fq = data["five_questions"]
    assert "1_money_in" in fq
    assert "2_money_out" in fq
    assert "3_money_kept" in fq
    assert "4_attention" in fq
    assert "5_next_action" in fq

def test_commitments_endpoint(auth_headers):
    # Add a recurring expense
    client.post("/api/v1/expenses", headers=auth_headers, json={
        "title": "Software Subscriptions",
        "amount": 150.0,
        "date": "2026-10-01",
        "category": "Technology",
        "is_recurring": True
    })

    resp = client.get("/api/v1/commitments", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "monthly_recurring_expenses" in data
    assert data["monthly_recurring_expenses"] >= 150.0
    assert "recurring_items" in data

def test_customer_profitability_metrics(auth_headers):
    resp = client.get("/api/v1/customers", headers=auth_headers)
    assert resp.status_code == 200
    customers = resp.json()
    assert len(customers) > 0
    c = customers[0]
    assert "total_revenue" in c
    assert "sales_count" in c
    assert "average_order_value" in c
    assert c["total_revenue"] >= 1200.0
    assert c["sales_count"] >= 1

def test_product_revenue_metrics(auth_headers):
    resp = client.get("/api/v1/products", headers=auth_headers)
    assert resp.status_code == 200
    products = resp.json()
    assert len(products) > 0
    p = products[0]
    assert "total_revenue" in p
    assert "units_sold" in p
    assert p["total_revenue"] >= 1200.0
    assert p["units_sold"] >= 1

def test_sales_summary_and_validation(auth_headers):
    # Sales summary
    resp = client.get("/api/v1/sales/summary", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "paid_sales_count" in data
    assert "paid_sales_amount" in data
    assert "average_order_value" in data

    # Defensive validation: zero or negative quantity should fail
    biz_resp = client.get("/api/v1/businesses", headers=auth_headers)
    biz_id = biz_resp.json()[0]["id"]
    bad_sale = client.post("/api/v1/sales", headers=auth_headers, json={
        "business_id": biz_id,
        "date": "2026-10-15",
        "status": "paid",
        "items": [{"quantity": 0, "unit_price": 500.0}]
    })
    assert bad_sale.status_code == 422 or bad_sale.status_code == 400

def test_budget_pacing_and_projections(auth_headers):
    resp = client.get("/api/v1/budgets/status?month=10&year=2026", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    b = data[0]
    assert "days_remaining" in b
    assert "projected_month_end" in b
    assert "potential_overspend" in b
    assert "status_flag" in b

def test_savings_intelligence(auth_headers):
    resp = client.get("/api/v1/savings", headers=auth_headers)
    assert resp.status_code == 200
    goals = resp.json()
    assert len(goals) > 0
    g = goals[0]
    assert "remaining_amount" in g
    assert "progress_percentage" in g
    assert g["remaining_amount"] == 7500.0
    assert g["progress_percentage"] == 25.0

def test_business_analytics_enhancements(auth_headers):
    resp = client.get("/api/v1/analytics/business", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "suggested_tax_reserve" in data
    assert "tax_disclaimer" in data
    assert "top_customers" in data
    assert "revenue_by_product" in data
    assert "expense_by_category" in data

def test_ai_affordability_and_grounded_intent(auth_headers):
    # Test intent and affordability check
    resp = client.post("/api/v1/ai/chat", headers=auth_headers, json={
        "question": "Can I safely spend $1,000 on a new monitor?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "AFFORDABILITY_CHECK"
    assert "decision_rubric" in data
    assert data["decision_rubric"] is not None
    assert "verdict" in data["decision_rubric"]
    assert "Safe Personal Spending" in data["answer"] or "Affordability" in data["answer"]

    # Test recommendations with evidence
    rec_resp = client.get("/api/v1/ai/recommendations", headers=auth_headers)
    assert rec_resp.status_code == 200
    recs = rec_resp.json()
    assert len(recs) > 0
    for r in recs:
        assert "evidence" in r
        assert r["evidence"] is not None

def test_notifications_categorization_and_deduplication(auth_headers):
    resp1 = client.post("/api/v1/notifications/generate", headers=auth_headers)
    assert resp1.status_code == 200
    notifs1 = resp1.json()
    for n in notifs1:
        assert "category" in n
        assert n["category"] in ["BUDGET", "CASH_FLOW", "SAVINGS", "BUSINESS", "EXPENSE", "FORECAST", "GENERAL"]

    # Calling generate a second time should not duplicate unread notifications
    resp2 = client.post("/api/v1/notifications/generate", headers=auth_headers)
    assert resp2.status_code == 200
    notifs2 = resp2.json()
    titles = [n["title"] for n in notifs2]
    # Check that there are no duplicate titles among unread
    assert len(titles) == len(set(titles))
