# MyBIZ API Documentation

All routes are mounted under the `/api/v1` namespace with OpenAPI Swagger documentation accessible interactively at `http://localhost:8000/api/v1/docs`.

## Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /register`: Register user and generate initial business profile.
- `POST /login`: Authenticate email & password; returns JWT bearer token.
- `GET /me`: Return authenticated profile.

### Dashboard (`/api/v1/dashboard`)
- `GET /`: Returns consolidated summary:
  - Personal total income, total expense, net cashflow
  - Active savings total vs target
  - Monthly budget limit vs spent
  - Business revenue, operating expense, net profit
  - Combined cross-realm net cashflow
  - Recent transactions list

### Personal Finance
- `GET /api/v1/income`: List personal income entries.
- `POST /api/v1/income`: Log income.
- `DELETE /api/v1/income/{id}`: Delete income.
- `GET /api/v1/expenses`: List expenses.
- `POST /api/v1/expenses`: Log expense.
- `DELETE /api/v1/expenses/{id}`: Delete expense.
- `GET /api/v1/budgets`: List budgets.
- `GET /api/v1/budgets/status`: Category utilization % for current month.
- `POST /api/v1/budgets`: Set/update budget cap.
- `DELETE /api/v1/budgets/{id}`: Delete budget.
- `GET /api/v1/savings`: List savings goals.
- `POST /api/v1/savings`: Create goal.
- `PUT /api/v1/savings/{id}`: Update saved amount.
- `DELETE /api/v1/savings/{id}`: Delete goal.
- `GET /api/v1/cashflow`: Monthly historical income vs expense series.

### Business Hub
- `GET /api/v1/businesses`: List owned entities.
- `POST /api/v1/businesses`: Create entity.
- `GET /api/v1/customers`: CRM client list.
- `POST /api/v1/customers`: Add client.
- `GET /api/v1/products`: Product/service catalog.
- `POST /api/v1/products`: Add offering.
- `GET /api/v1/sales`: Invoice orders.
- `POST /api/v1/sales`: Record sale with multi-item calculations.
- `GET /api/v1/business-transactions`: Direct OpEx/Rev.
- `POST /api/v1/business-transactions`: Log OpEx/Rev.

### Intelligence & System
- `GET /api/v1/analytics/personal`: Category breakdown & monthly trends.
- `GET /api/v1/analytics/business`: Profit margin, revenue, expenses.
- `GET /api/v1/forecast`: Linear regression projection for next month.
- `POST /api/v1/ai/chat`: Real-time conversation grounded in database figures.
- `GET /api/v1/ai/recommendations`: High/medium/low strategic advice.
- `GET /api/v1/notifications`: In-app notification feed.
- `POST /api/v1/notifications/generate`: Evaluate budget and cash-flow rules.
- `GET /api/v1/export/csv`: Stream CSV files for income, expenses, sales, customers, products, transactions.
