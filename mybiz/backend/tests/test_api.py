import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite with StaticPool so all connections share the same memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
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
