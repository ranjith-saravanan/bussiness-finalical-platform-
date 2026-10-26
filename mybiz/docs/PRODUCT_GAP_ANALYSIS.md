# MyBIZ — Product Gap Analysis

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-25  
**Auditor:** Lead Product Engineer & Financial Product Analyst  
**Focus:** Verification of codebase against the primary persona (Alex Rivera, Solo Founder at Apex Digital Studio)  

---

## 1. Capability Classification Matrix

Status Legend:
- 🟢 **Working** — Implemented end-to-end, tested, robust validation, good UX.
- 🟡 **Partially Working** — Backend or frontend present, but missing key calculations or integration.
- 🟠 **Weak UX** — Functionally operational but unintuitive, high cognitive load, or ungrounded presentation.
- 🔴 **Missing** — Not yet implemented in models, endpoints, or UI.

| Capability | Status | Frontend | Backend | DB Model | Validated & Verified | Audit Findings & Identified Gaps |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Safe to Spend Decision Cockpit** | 🔴 | 🔴 | 🔴 | N/A | N/A | **Critical Gap**: No calculation for Safe Personal Spending. Dashboard shows cumulative cross-realm net cash flow, which dangerously conflates business revenue with personal cash. |
| **Business vs Personal Money Firewall** | 🟠 | 🟡 | 🟢 | 🟢 | 🟡 | Business and Personal transactions share a general ledger on the dashboard without clear visual boundaries or risk warning against commingling funds. |
| **Tax Reserve / Obligation Planning** | 🔴 | 🔴 | 🔴 | N/A | N/A | **Missing**: No estimated tax reserve calculation based on business net profit. Founders have no guidance on withholding taxes from profit distributions. |
| **Recurring Transactions & Commitments** | 🟡 | 🟡 | 🟡 | 🟢 | 🟡 | Models have `is_recurring: Boolean`, but there is no monthly commitment aggregation, upcoming commitments calendar, or integration into cash flow calculations. |
| **Cash-Flow Forecasting** | 🟡 | 🟡 | 🟢 | 🟢 | 🟡 | Basic statistical regression predicts next month income/expense, but lacks Historical → Current → Forecast progression, forecast ranges, and commitments overlay. |
| **Business Profitability & Analytics** | 🟡 | 🟡 | 🟢 | 🟢 | 🟡 | Returns revenue, expenses, and net profit. Missing: Cost breakdown, Revenue by Product/Service leaderboard, and Revenue by Customer leaderboard. |
| **Customer Profitability & Value** | 🟡 | 🟡 | 🟡 | 🟢 | 🟡 | Customer directory exists with CRUD, but lacks calculated customer lifetime revenue, sales count, and average order value. |
| **Sales Intelligence** | 🟠 | 🟡 | 🟢 | 🟢 | 🟡 | Sales list exists with line items, but lacks pipeline intelligence: Paid vs. Pending vs. Cancelled summaries and Average Order Value metrics. |
| **Expense Intelligence & Anomalies** | 🟠 | 🟡 | 🟡 | 🟢 | 🟡 | Expense table displays flat records. Missing month-over-month change detection, category concentration flags, and unusually large transaction highlights. |
| **Budget Intelligence & Projections** | 🟡 | 🟡 | 🟢 | 🟢 | 🟡 | Compares spent against limit. Missing pacing intelligence: days remaining in month, projected month-end spend run rate, and overspend probability. |
| **Savings Goal Intelligence** | 🟡 | 🟡 | 🟢 | 🟢 | 🟡 | Displays current vs target amount. Missing remaining balance, required monthly contribution to hit deadline, and projected completion date. |
| **AI Advisor — Grounded Architecture** | 🟡 | 🟢 | 🟢 | 🟢 | 🟡 | Context extraction works, but questions lack structured intent routing (`AFFORDABILITY_CHECK`, `EXPENSE_ANOMALY`, etc.) and formal evidence-backed metrics. |
| **Affordability Check Engine** | 🟠 | 🟡 | 🟡 | N/A | 🟡 | Rudimentary string check exists in fallback ("afford"), but lacks multi-factor calculation (personal cash, commitments, budget impact, business runway). |
| **AI Recommendations Engine** | 🟡 | 🟢 | 🟢 | N/A | 🟡 | Returns 3-4 recommendations, but lacks explicit database evidence fields linking each recommendation to an audited numerical metric. |
| **Notification Engine & Deduplication**| 🟡 | 🟢 | 🟢 | 🟢 | 🟡 | Generates budget and milestone alerts, but lacks standardized categorization (`BUDGET`, `CASH_FLOW`, `BUSINESS`, `SAVINGS`, `EXPENSE`, `FORECAST`) and recurring alert deduplication. |
| **Security & Ownership Isolation** | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | Password hashing with passlib/bcrypt, JWT bearer tokens, per-user row filtering, business ownership checks verified. |
| **CSV Data Export** | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | Streams CSV for Incomes, Expenses, Sales, and Customers with authenticated headers. |

---

## 2. Detailed Technical Audit by Module

### 2.1 Dashboard & Safe to Spend
- **Existing**: `GET /api/v1/dashboard` aggregates lifetime sums: `total_personal_income`, `total_personal_expense`, `net_personal_cashflow`, `business_revenue`, `business_expenses`, `business_profit`, `net_total_cashflow`.
- **Flaw**: Summing lifetime income and expenses does not reflect *current liquid cash balance*. Even worse, `net_total_cashflow = net_personal_cashflow + biz_profit` gives the false impression that business profit is instantly available for personal spending.
- **Required Fix**:
  1. Separate Dashboard into two distinct realm zones: **Personal Liquidity & Cash Flow** and **Business Performance & Profitability**.
  2. Implement **Safe to Spend**:
     $$\text{Safe Personal Spending} = \text{Available Personal Cash} - \text{Upcoming Commitments} - \text{Savings Reserve Requirement} - \text{Safety Buffer}$$
  3. Introduce configurable parameters or realistic transparent defaults (e.g., $1,000 safety buffer, monthly recurring commitments sum).
  4. Explicitly label: *"Estimated Discretionary Amount — Not Financial Advice"*.

### 2.2 Tax Reserve Planning
- **Existing**: Zero tax planning features.
- **Required Fix**:
  1. Add tax reserve calculation to business metrics:
     $$\text{Estimated Tax Reserve} = \max(0, \text{Business Profit}) \times \text{Tax Reserve Rate (default 25\%)}$$
  2. Allow user configuration of estimated tax rate (15% to 40%).
  3. Prominently display: *"Estimate — not official tax advice"*.

### 2.3 Recurring Commitments
- **Existing**: Boolean `is_recurring` on Incomes and Expenses.
- **Required Fix**:
  1. Backend calculation of active monthly recurring income and recurring expenses.
  2. Compute upcoming commitments for the current month and next month.
  3. Expose recurring commitments breakdown in cash flow and Safe-to-Spend calculations.

### 2.4 Budget & Savings Intelligence
- **Existing**: `BudgetStatusOut` gives `spent`, `remaining`, and `percentage`. `SavingsOut` gives `target_amount` and `current_amount`.
- **Required Fix**:
  1. **Budgets**: Add `days_remaining` in month, `projected_month_end` spend ($(\text{spent} / \text{days\_elapsed}) \times \text{days\_in\_month}$), and `potential_overspend`.
  2. **Savings**: Add `remaining_amount`, `required_monthly_contribution` based on target date or remaining balance, and estimated completion time.

### 2.5 AI Advisor Intent System & Affordability Check
- **Existing**: Deterministic keyword matching and ungrounded fallback.
- **Required Fix**:
  1. Define structured intents: `SPENDING_SUMMARY`, `BUDGET_ANALYSIS`, `CASH_FLOW_ANALYSIS`, `BUSINESS_PERFORMANCE`, `SAVINGS_ANALYSIS`, `AFFORDABILITY_CHECK`, `FORECAST_EXPLANATION`, `EXPENSE_ANOMALY`, `BUSINESS_GROWTH`.
  2. Affordability Check tool: Extracts amount and item from question (e.g., "Can I afford $2,000 on a laptop?"), checks Available Personal Cash, upcoming commitments, budget slack, and business obligations, and returns a verified decision rubric.
  3. AI Recommendations: Add explicit `evidence` field citing real database values.

### 2.6 Notification Engine
- **Existing**: Hardcoded alerts generated into Notification table.
- **Required Fix**:
  1. Add standardized category enum: `BUDGET`, `CASH_FLOW`, `SAVINGS`, `BUSINESS`, `EXPENSE`, `FORECAST`.
  2. Implement intelligent deduplication to prevent generating duplicate active alerts for the same condition.
