# MyBIZ – Core Module Mapping & Coverage Analysis

**Role**: Developer 2 – Personal Business Advisor and Financial Management System (MyBIZ)  
**Date**: 2026-10-25  
**Audit Baseline**: [`REPOSITORY_AUDIT.md`](./REPOSITORY_AUDIT.md) / [`SOURCE_INVENTORY.md`](./SOURCE_INVENTORY.md)  
**Status**: ⚠️ **Awaiting Source Repositories from User** (Coverage based on verified local artifacts)

---

## 1. Overview & Evaluation Schema

In accordance with [`GEMINI.md`](./GEMINI.md):
- **Rule 2**: Source analysis must happen before integration.
- **Rule 5 (Uncertainty Protocol)**: Report uncertainty without fabricating sources or guessing implementation evidence.
- **Mapping Standard**:
  ```
  Source → Existing Functionality → MyBIZ Module → Integration Method → Required Changes → Final Status
  ```

Because 0 external donor repositories currently reside in the workspace or local environment, all 27 modules are evaluated against their required functionality, noting the current gap and recommended action.

---

## 2. 27 MyBIZ Core Modules Mapping

### Module 1: User Authentication
* **Required Functionality**: User registration, login, JWT/session management, password hashing (bcrypt/argon2), MFA/2FA, password recovery.
* **Source Repository**: *None provided yet (Local workspace only)*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse (Requires source or net-new development)
* **Dependencies**: Secure hashing, token issuer, user DB model.
* **Required Modifications**: Standardize auth schema across personal and business roles.
* **Integration Method**: Standalone authentication service / middleware.
* **Conflicts**: None detected.
* **Missing Functionality**: Complete authentication engine.
* **Recommended Action**: Provide source repo containing auth, or develop clean JWT/OAuth2 service.

---

### Module 2: Personal Finance Management
* **Required Functionality**: Personal account balance aggregation, multi-account tracking (checking, savings, credit), net worth calculation.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Auth, Account Data Model, Currency Engine.
* **Required Modifications**: N/A
* **Integration Method**: Core Personal Finance Domain Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Complete account management and balance tracking.
* **Recommended Action**: Provide source financial tracker or develop account service.

---

### Module 3: Income Management
* **Required Functionality**: Recurring & one-off personal income streams, salary tracking, categorization, tax withholding estimation.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Personal Finance Domain, DB transaction tables.
* **Required Modifications**: N/A
* **Integration Method**: Income Ledger & Ingestion API.
* **Conflicts**: None detected.
* **Missing Functionality**: Complete income tracking & categorization engine.
* **Recommended Action**: Awaiting source repository.

---

### Module 4: Expense Management
* **Required Functionality**: Personal expense categorization, receipt attachment, recurring subscription tracking, transaction tagging.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Storage provider (for receipts), Personal Finance Domain.
* **Required Modifications**: N/A
* **Integration Method**: Transaction Ledger API.
* **Conflicts**: None detected.
* **Missing Functionality**: Complete personal expense tracking engine.
* **Recommended Action**: Awaiting source repository.

---

### Module 5: Budget Management
* **Required Functionality**: Category-based budget limits, progress tracking, budget overspend alerts, rolling monthly allocations.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Expense Management, Notification Engine.
* **Required Modifications**: N/A
* **Integration Method**: Budget Calculation Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Budget definition, threshold rules, and evaluation service.
* **Recommended Action**: Awaiting source repository.

---

### Module 6: Savings Management
* **Required Functionality**: Target-based savings goals, automated round-up logic, emergency fund tracking, interest calculation.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Personal Accounts, Bank feed/Transaction ledger.
* **Required Modifications**: N/A
* **Integration Method**: Goals & Allocation Engine.
* **Conflicts**: None detected.
* **Missing Functionality**: Goal tracking, contribution schedules, projection engine.
* **Recommended Action**: Awaiting source repository.

---

### Module 7: Cash-Flow Management
* **Required Functionality**: Combined personal/business cash-in vs cash-out timelines, liquidity monitoring, burn rate computation.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Income, Expense, Sales, Business Expense modules.
* **Required Modifications**: N/A
* **Integration Method**: Unified Aggregation Ledger.
* **Conflicts**: None detected.
* **Missing Functionality**: Cash-flow aggregation and runway calculator.
* **Recommended Action**: Awaiting source repository.

---

### Module 8: Financial Reports
* **Required Functionality**: Balance sheets, profit & loss (P&L) statements, personal net worth statements, tax-ready summaries.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: All ledger modules, PDF/CSV export engine.
* **Required Modifications**: N/A
* **Integration Method**: Financial Reporting Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Accounting statements and reporting generator.
* **Recommended Action**: Awaiting source repository.

---

### Module 9: Business Management
* **Required Functionality**: Business profile setup, entity types (LLC, Sole Prop, etc.), tax IDs, multi-business tenancy, fiscal year configs.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Auth, Multi-tenant Organization Model.
* **Required Modifications**: N/A
* **Integration Method**: Business Tenant Management Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Business entity model and configuration logic.
* **Recommended Action**: Awaiting source repository.

---

### Module 10: Customers
* **Required Functionality**: Customer directory (CRM), client invoicing profiles, payment histories, contact info, lifecycle stages.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Business Management domain, Sales module.
* **Required Modifications**: N/A
* **Integration Method**: Customer Domain API.
* **Conflicts**: None detected.
* **Missing Functionality**: Customer directory and customer-revenue relationship models.
* **Recommended Action**: Awaiting source repository.

---

### Module 11: Products / Services
* **Required Functionality**: Product/service catalog, SKU management, unit pricing, inventory tracking, service billing rates.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Business Management domain, Sales module.
* **Required Modifications**: N/A
* **Integration Method**: Catalog Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Catalog, pricing rules, inventory tracking.
* **Recommended Action**: Awaiting source repository.

---

### Module 12: Sales
* **Required Functionality**: Invoicing, order creation, payment gateway integration (Stripe/PayPal), payment status tracking, receipts.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Customers, Products/Services, Revenue engine.
* **Required Modifications**: N/A
* **Integration Method**: Invoicing & Order Management Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Invoicing, checkout, payment webhooks, order records.
* **Recommended Action**: Awaiting source repository.

---

### Module 13: Business Expenses
* **Required Functionality**: Operating expenses (OpEx), Capital expenses (CapEx), vendor management, receipt OCR, tax deductions categorization.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Business Domain, Document Storage, Tax Category Rules.
* **Required Modifications**: N/A
* **Integration Method**: Business Expense Ledger API.
* **Conflicts**: None detected.
* **Missing Functionality**: Vendor expense management, tax write-off classification.
* **Recommended Action**: Awaiting source repository.

---

### Module 14: Business Revenue
* **Required Functionality**: Gross vs net revenue calculations, recurring revenue (MRR/ARR), revenue by product/client, reconciliation.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Sales, Cash-Flow modules.
* **Required Modifications**: N/A
* **Integration Method**: Revenue Engine & Analytics Aggregator.
* **Conflicts**: None detected.
* **Missing Functionality**: Revenue recognition and reconciliation logic.
* **Recommended Action**: Awaiting source repository.

---

### Module 15: Business KPIs
* **Required Functionality**: Customer Acquisition Cost (CAC), Lifetime Value (LTV), gross/operating margins, churn rate, accounts receivable aging.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Customers, Sales, Revenue, Business Expenses.
* **Required Modifications**: N/A
* **Integration Method**: KPI Calculation Engine.
* **Conflicts**: None detected.
* **Missing Functionality**: Metric definition formulas, trend computation, KPI dashboards.
* **Recommended Action**: Awaiting source repository.

---

### Module 16: Financial Analytics
* **Required Functionality**: Historical spending trends, category breakdown, benchmark comparisons, anomaly detection on personal transactions.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Personal Finance, Income, Expense modules.
* **Required Modifications**: N/A
* **Integration Method**: Analytics Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Time-series analytics and statistical anomaly detection.
* **Recommended Action**: Awaiting source repository.

---

### Module 17: Business Analytics
* **Required Functionality**: Sales velocity, customer cohort retention, product performance matrices, profitability by business unit.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Business KPIs, Sales, Customers.
* **Required Modifications**: N/A
* **Integration Method**: Business Analytics Engine.
* **Conflicts**: None detected.
* **Missing Functionality**: Cohort analysis and sales performance analytics.
* **Recommended Action**: Awaiting source repository.

---

### Module 18: AI Financial Advisor
* **Required Functionality**: Automated personal financial diagnostics, debt payoff strategies (snowball/avalanche), savings opportunity identification.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Financial Analytics, LLM / AI Orchestrator.
* **Required Modifications**: N/A
* **Integration Method**: Financial Advisory Prompt Pipeline.
* **Conflicts**: None detected.
* **Missing Functionality**: Diagnostic prompts, financial advice guardrails, LLM client.
* **Recommended Action**: Awaiting source repository.

---

### Module 19: AI Business Advisor
* **Required Functionality**: Strategic business health assessment, margin optimization recommendations, pricing advisory, cash-flow warning alerts.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Business KPIs, Business Analytics, LLM Orchestrator.
* **Required Modifications**: N/A
* **Integration Method**: Strategic Advisory Pipeline.
* **Conflicts**: None detected.
* **Missing Functionality**: Context injection, business rule heuristics, advisory agent.
* **Recommended Action**: Awaiting source repository.

---

### Module 20: Financial Forecasting
* **Required Functionality**: 3-month to 5-year personal wealth projections, retirement simulations (Monte Carlo), predictive expense curves.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Financial Analytics, Statistical / ML forecasting models.
* **Required Modifications**: N/A
* **Integration Method**: Forecasting Calculation Engine.
* **Conflicts**: None detected.
* **Missing Functionality**: Monte Carlo engine, regression/time-series forecasting models.
* **Recommended Action**: Awaiting source repository.

---

### Module 21: Business Forecasting
* **Required Functionality**: Predictive revenue modeling, inventory demand forecasting, pipeline close probabilities, hiring runway simulation.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Sales, Business Analytics, Predictive ML algorithms.
* **Required Modifications**: N/A
* **Integration Method**: Business Forecasting Pipeline.
* **Conflicts**: None detected.
* **Missing Functionality**: Predictive cash-flow modeling and scenario simulation tools.
* **Recommended Action**: Awaiting source repository.

---

### Module 22: Personalized Recommendations
* **Required Functionality**: Dynamic recommendation feed, actionable micro-tasks (e.g. cancel unused subscription, re-negotiate vendor rate).
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: AI Advisors, Analytics Engines, Recommendation Store.
* **Required Modifications**: N/A
* **Integration Method**: Rule & Embedding Recommendation Engine.
* **Conflicts**: None detected.
* **Missing Functionality**: Recommendation scoring, task completion tracking.
* **Recommended Action**: Awaiting source repository.

---

### Module 23: AI Chat Assistant
* **Required Functionality**: Natural language conversational interface to query finances and business data ("What was my net profit last month?").
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Gemini/LLM API client, RAG / Function Calling tools.
* **Required Modifications**: N/A
* **Integration Method**: Conversational Agent & Tool Dispatcher.
* **Conflicts**: None detected.
* **Missing Functionality**: Chat UI, session persistence, tool calling bindings.
* **Recommended Action**: Awaiting source repository.

---

### Module 24: Dashboard
* **Required Functionality**: Executive dashboard combining high-level personal finance metrics and business health scorecards in one unified UI.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Frontend UI framework, Charting library, Aggregation API.
* **Required Modifications**: N/A
* **Integration Method**: Unified Dashboard UI Component.
* **Conflicts**: None detected.
* **Missing Functionality**: Component cards, chart widgets, layout grid.
* **Recommended Action**: Awaiting source repository.

---

### Module 25: Notifications
* **Required Functionality**: In-app notifications, email digests, SMS/push alerts for budget breaches, invoice payments, and AI advisories.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Notification Queue (Redis/BullMQ), Email/SMS gateways.
* **Required Modifications**: N/A
* **Integration Method**: Notification Dispatch Service.
* **Conflicts**: None detected.
* **Missing Functionality**: Channel adapters, template engine, notification center UI.
* **Recommended Action**: Awaiting source repository.

---

### Module 26: Data Export
* **Required Functionality**: Export transaction histories, reports, and invoices to CSV, Excel (XLSX), JSON, and formatted PDF.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: PDF generator, CSV/XLSX builder.
* **Required Modifications**: N/A
* **Integration Method**: Asynchronous Export Worker.
* **Conflicts**: None detected.
* **Missing Functionality**: File generation pipelines and download endpoints.
* **Recommended Action**: Awaiting source repository.

---

### Module 27: Settings / Configuration
* **Required Functionality**: User profile, security preferences, currency/locale formatting, tax settings, integration API keys, theme switching.
* **Source Repository**: *None provided yet*
* **Existing Component**: None
* **Reuse Status**: 🔴 No existing component to reuse
* **Dependencies**: Auth, User Preferences Model.
* **Required Modifications**: N/A
* **Integration Method**: Configuration Service & Preferences API.
* **Conflicts**: None detected.
* **Missing Functionality**: Preferences store, settings UI views.
* **Recommended Action**: Awaiting source repository.

---

## 3. Coverage & Synthesis Analysis

### 1. Modules Fully Covered by Existing Sources
* **Count**: **0 / 27**
* **Details**: No modules are currently covered because 0 external source repositories have been supplied or exist in the workspace to audit.

### 2. Modules Partially Covered
* **Count**: **0 / 27**
* **Details**: None.

### 3. Modules Requiring New Development
* **Count**: **27 / 27**
* **Details**: All 27 core modules currently require net-new implementation unless donor/reference repositories are provided for reuse.

### 4. Duplicate Functionality Across Repositories
* **Count**: **0**
* **Details**: No duplicate implementations detected as no source codebases have been provided yet.

### 5. Conflicting Implementations
* **Count**: **0**
* **Details**: No conflicting architectures, schemas, or dependencies present.

### 6. Components That Should Be Rejected
* **Count**: **0**
* **Details**: No components rejected yet (awaiting source code for evaluation).

---

## 4. Immediate Requirement

Under **GEMINI.md Rule 2 & Rule 4**, integration mapping cannot evaluate code components until the user provides:
1. The **repository URLs**, **submodules**, or **local source paths** for the intended donor projects.
