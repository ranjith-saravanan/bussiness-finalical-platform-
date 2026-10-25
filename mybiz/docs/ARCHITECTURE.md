# MyBIZ Architecture Overview

MyBIZ is an end-to-end Personal Business Advisor and Financial Management System built as a unified, cohesive full-stack web application.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide Icons.
- **Backend**: FastAPI (Python 3.11+ / 3.14), Uvicorn, SQLAlchemy ORM, Pydantic V2, Bcrypt, Python-JOSE (JWT).
- **Database**: SQLite (local single-file ACID transactional database with zero configuration; easily upgraded to PostgreSQL).
- **AI Intelligence**: Dual pipeline: Google Gemini 1.5 Flash + deterministic financial computation engine. Zero-hallucination math guarantee.
- **Forecasting**: Least-squares linear regression model blended with a 3-month moving average dampener.
- **Containerization**: Docker & Docker Compose.

## Database Schema Design
1. `User`: Identity and credentials.
2. `Business`: Multi-business entities owned by the user.
3. `Income`: Personal income streams (one-off and recurring).
4. `Expense`: Personal spending by category.
5. `Budget`: Monthly category limits with live utilization percentage.
6. `Savings`: Target-based goal tracking.
7. `Customer`: Customer CRM directory.
8. `Product`: Catalog of goods and billable services.
9. `Sale`: Customer invoices and orders.
10. `SaleItem`: Detailed invoice lines with quantity and unit price.
11. `BusinessTransaction`: Direct OpEx/CapEx and non-sales revenues.
12. `Notification`: Dynamic alerts triggered by financial thresholds.
