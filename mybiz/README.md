# MyBIZ – Personal Business Advisor & Financial Management System

A cohesive, production-grade full-stack web application designed for entrepreneurs and founders to manage both personal finances and business operations under one unified intelligence roof.

---

## Key Features

1. **Unified Dashboard**: Instant cross-realm snapshot of personal income, expenses, savings, budget utilization, business revenue, expenses, and net profit.
2. **Personal Finance Management**:
   - Incomes (one-off and recurring)
   - Expenses (categorized with notes)
   - Category-level budgets with monthly spending cap alerts
   - Target-based savings goals with progress tracking
   - Monthly cash-flow timelines
3. **Business Operations**:
   - Multi-business entity support with currency configuration
   - Customer CRM directory
   - Product & services catalog with custom pricing and SKUs
   - Multi-line invoice and sales recording with automated total calculation
   - Business OpEx & miscellaneous revenue tracking
4. **AI Financial & Business Advisor**:
   - Natural language queries answered using real database numbers
   - Dual-engine: Google Gemini 1.5 Flash + deterministic fallback
   - Zero hallucination guarantee on math and balances
   - Actionable recommendation cards ranked by priority
5. **Statistical Forecasting**:
   - Least-squares linear regression model blended with moving averages
   - Projected next month income, expenses, and net cashflow
6. **Data Export & Portability**:
   - One-click CSV export for Incomes, Expenses, Sales, Customers, Products, and Transactions
7. **Notification Center**:
   - Automated triggers for budget limits, cash flow warnings, and business milestones

---

## Project Structure

```
mybiz/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS
├── backend/              # FastAPI + SQLAlchemy ORM + SQLite + Bcrypt + JWT
├── docker-compose.yml    # Complete local container orchestration
├── .env.example          # Environment variables template
├── README.md             # Project documentation
└── docs/                 # Architecture, API & User documentation
```

---

## Quickstart Guide

### Option 1: Running Locally (Fastest)

#### 1. Backend (FastAPI)
```bash
cd backend
# Run server directly with python
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API is available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/api/v1/docs`.

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The web dashboard opens at `http://localhost:5173`.

---

### Option 2: Running with Docker Compose

```bash
docker compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/api/v1/docs`

---

## Running Backend Tests

```bash
cd backend
PYTHONPATH=. pytest -v
```
All 12 comprehensive unit and integration tests will run against an in-memory SQLite database.
