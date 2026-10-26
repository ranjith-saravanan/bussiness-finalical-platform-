# MyBIZ — Product Research & Market Analysis

**Document Version:** 1.0.0  
**Target Persona:** Alex Rivera (Solo Founder / Consultant at Apex Digital Studio)  
**Primary Decision Problem:** *"How much money can I safely spend personally without damaging my business?"*  

---

## 1. Executive Summary & Market Landscape

Solo founders, freelancers, and agency owners operate in a unique financial blind spot. Traditional personal finance applications (e.g., Monarch, YNAB) assume a steady W-2 paycheck and ignore operational runway, tax obligations, and invoice receivables. Conversely, SMB accounting software (QuickBooks, Xero) treats the business as a separate corporate silo, failing to answer whether a founder's personal distributions or personal spending decisions will starve the business of working capital.

This research analyzes 15 leading financial and AI platforms across four market domains to extract evidence-based UX patterns, calculation standards, and architectural practices for MyBIZ.

---

## 2. Category A: Personal Finance Products

### 2.1 YNAB (You Need A Budget)
- **Target User:** Zero-based budgeters, disciplined cash allocators seeking complete visibility over every dollar.
- **Important Features:** "Give every dollar a job", envelope-based budgeting, age of money metric, scheduled recurring transactions, goal-based targets.
- **Useful UX Pattern:** Age of money indicator; immediate real-time category overspend warnings in distinct color-coded chips.
- **MyBIZ Equivalent:** Personal Budget management (`/budgets`), personal expense tracking (`/expenses`).
- **Missing MyBIZ Capability:** Pacing / run-rate intelligence (projecting whether current daily spending pace will exceed category budget before month-end); explicit recurring commitment scheduling.
- **Priority:** **P0**
- **Reason:** Alex needs to know not just how much budget has been spent today, but what will happen by day 30 at the current spending velocity.

### 2.2 Monarch Money
- **Target User:** Modern households and professionals managing multiple accounts, joint finances, and forward cash plans.
- **Important Features:** Collaborative planning, custom recurring transaction calendar, net worth tracking, customizable forecast horizons, category-level rollover.
- **Useful UX Pattern:** Visual separation between fixed recurring commitments and discretionary spending; unified cash flow projection bar chart.
- **MyBIZ Equivalent:** Personal Cash Flow (`/cashflow`), Forecast (`/forecast`).
- **Missing MyBIZ Capability:** Clear breakdown of upcoming recurring commitments for the current and subsequent month to deduct from available cash.
- **Priority:** **P0**
- **Reason:** Safe-to-spend cannot be calculated without knowing upcoming committed outflows (subscriptions, fixed bills).

### 2.3 Copilot Money
- **Target User:** Tech-savvy Mac/iOS users who value clean, high-density visualization and automated intelligence.
- **Important Features:** Smart recurring detection, automated category intelligence, real-time month-over-month trend analysis, AI chat insights.
- **Useful UX Pattern:** Minimalist card-based dashboard with clear visual distinction between discretionary spend and structural overhead.
- **MyBIZ Equivalent:** Dashboard summary, Analytics page.
- **Missing MyBIZ Capability:** Month-over-month expense growth alerts and category concentration flags.
- **Priority:** **P1**
- **Reason:** Detects runaway software subscriptions and lifestyle creep before cash reserves are depleted.

### 2.4 Rocket Money (Truebill)
- **Target User:** Consumers looking to reduce monthly recurring bills and monitor cancelable subscriptions.
- **Important Features:** Subscription tracker, bill negotiation, low balance alerts, upcoming recurring calendar.
- **Useful UX Pattern:** Dedicated "Upcoming Bills & Subscriptions" list showing due dates and total committed burn rate.
- **MyBIZ Equivalent:** `is_recurring` flag on personal expenses.
- **Missing MyBIZ Capability:** Dedicated aggregation of recurring commitments feeding cash flow models and safe-to-spend calculations.
- **Priority:** **P1**
- **Reason:** Founders routinely accumulate recurring SaaS overhead that drains both business and personal accounts.

### 2.5 Empower (formerly Personal Capital)
- **Target User:** High-earning professionals focused on wealth preservation, retirement projection, and net worth tracking.
- **Important Features:** Investment portfolio analytics, retirement planner, fee analyzer, emergency fund runway calculator.
- **Useful UX Pattern:** Safety reserve gauge showing months of emergency runway based on average monthly burn rate.
- **MyBIZ Equivalent:** Savings Goals (`/savings`).
- **Missing MyBIZ Capability:** Calculation of required monthly savings contribution to hit goal by target date and runway impact.
- **Priority:** **P1**
- **Reason:** Alex must know whether personal savings are sufficient to weather consulting revenue volatility.

---

## 3. Category B: Business Finance Products

### 3.1 QuickBooks Online
- **Target User:** Small-to-medium businesses requiring full double-entry accounting, compliance, and accountant collaboration.
- **Important Features:** Invoicing, bank reconciliation, chart of accounts, P&L reports, balance sheet, estimated tax calculations.
- **Useful UX Pattern:** Clear distinction between Gross Revenue, Cost of Goods Sold (COGS), Operating Expenses (OpEx), and Net Profit.
- **MyBIZ Equivalent:** Business module (`/business`), Business Transactions (`/business-transactions`), Sales (`/sales`).
- **Missing MyBIZ Capability:** Explicit Net Operating Profit breakdown and estimated quarterly tax reserve set-aside.
- **Priority:** **P0**
- **Reason:** Solo founders frequently confuse gross sales revenue with take-home cash, neglecting tax liabilities.

### 3.2 Xero
- **Target User:** Small business owners and accountants desiring real-time collaboration and intuitive bank feeds.
- **Important Features:** Interactive P&L, customer invoice status tracking (Draft, Sent, Paid, Overdue), cash flow analytics.
- **Useful UX Pattern:** Invoice status pipeline with color-coded badges and pending payment aging.
- **MyBIZ Equivalent:** Sales status tracking (`paid`, `pending`, `cancelled`).
- **Missing MyBIZ Capability:** Clear breakdown of Paid vs. Pending vs. Cancelled sales in business analytics and dashboard.
- **Priority:** **P1**
- **Reason:** Uncollected (pending) receivables should not be counted as liquid cash available for personal spending.

### 3.3 Wave Accounting
- **Target User:** Solo freelancers and micro-businesses seeking simple, zero-cost invoicing and expense tracking.
- **Important Features:** Simple invoicing, customer directories, income/expense breakdown, receipt scanning.
- **Useful UX Pattern:** Fast, frictionless customer and invoice creation modal with immediate line-item subtotal computation.
- **MyBIZ Equivalent:** Customers (`/customers`), Products (`/products`), Sales (`/sales`).
- **Missing MyBIZ Capability:** Customer sales volume and average order value metrics in customer directory.
- **Priority:** **P1**
- **Reason:** Alex needs to identify which consulting clients generate the bulk of business cash flow.

### 3.4 FreshBooks
- **Target User:** Service-based professionals, consultants, and agencies billing hourly or project rates.
- **Important Features:** Retainer tracking, project profitability, client invoice tracking, automated late payment reminders.
- **Useful UX Pattern:** Client summary cards highlighting total billed, outstanding balance, and recent transaction history.
- **MyBIZ Equivalent:** Customer list and sales relationships.
- **Missing MyBIZ Capability:** Top customer revenue contribution ranking.
- **Priority:** **P1**
- **Reason:** Helps consultants identify revenue concentration risks (e.g., 80% revenue from one client).

### 3.5 Zoho Books
- **Target User:** Growing businesses needing deep ERP integrations, inventory management, and tax compliance.
- **Important Features:** Multi-currency, end-to-end sales orders, purchase orders, tax withholding rules.
- **Useful UX Pattern:** Tax liability reserve calculator based on net profit margins.
- **MyBIZ Equivalent:** Business settings.
- **Missing MyBIZ Capability:** Configurable tax reserve percentage with automatic dollar calculation.
- **Priority:** **P0**
- **Reason:** Solves the #1 panic point for solo founders: under-saving for quarterly estimated taxes.

---

## 4. Category C: Small Business & Founder Tools

### 4.1 Stripe Dashboard
- **Target User:** Internet businesses, SaaS founders, digital product sellers, tech consultants.
- **Important Features:** Gross volume, net volume, payout scheduling, dispute management, cohort analytics.
- **Useful UX Pattern:** High-contrast KPI headers showing Gross Volume vs. Net Payouts, with tooltip explainers of fees.
- **MyBIZ Equivalent:** Business analytics KPI cards.
- **Missing MyBIZ Capability:** Visual separation between gross sales and net retained earnings.
- **Priority:** **P0**
- **Reason:** Ensures founders never treat inbound gross customer payments as discretionary spend.

### 4.2 Square Dashboard
- **Target User:** Omnichannel sellers, local services, consultants accepting card-present and invoice payments.
- **Important Features:** Daily sales summaries, product category mix, customer return frequency, instant balance transfers.
- **Useful UX Pattern:** Top products and services leaderboard showing revenue share percentage.
- **MyBIZ Equivalent:** Product/Service directory (`/products`).
- **Missing MyBIZ Capability:** Product and service revenue ranking (which service lines drive revenue).
- **Priority:** **P1**
- **Reason:** Alex needs to know whether consulting or retainer packages are driving business growth.

### 4.3 Shopify Finances
- **Target User:** E-commerce merchants and direct-to-consumer brand creators.
- **Important Features:** Unified profit dashboard, sales channel breakdown, payout balance timeline.
- **Useful UX Pattern:** Single-screen summary: Sales - Returns - Cost of Goods - Shipping = Net Profit.
- **MyBIZ Equivalent:** Analytics page (`/analytics`).
- **Missing MyBIZ Capability:** Step-by-step mathematical bridge from Revenue to Profit.
- **Priority:** **P0**
- **Reason:** Transparent explainability builds trust in financial figures.

### 4.4 HubSpot CRM & Sales Hub
- **Target User:** B2B service providers, agencies, consultancies managing a client deal pipeline.
- **Important Features:** Deal pipeline, customer lifetime value (LTV), contact timeline, deal status stages.
- **Useful UX Pattern:** Customer record showing total lifetime spend and active engagement status.
- **MyBIZ Equivalent:** Customer management (`/customers`).
- **Missing MyBIZ Capability:** Lifetime customer revenue calculation and transaction count.
- **Priority:** **P1**
- **Reason:** Allows Alex to evaluate client value without switching to an external CRM.

### 4.5 Zoho CRM
- **Target User:** SMB sales teams tracking accounts, contacts, and closed deals.
- **Important Features:** Account revenue rollups, product purchase histories, deal scoring.
- **Useful UX Pattern:** Visual tiering of customers (VIP, Active, Inactive) based on revenue thresholds.
- **MyBIZ Equivalent:** Customer table.
- **Missing MyBIZ Capability:** Customer revenue tiering and order frequency.
- **Priority:** **P2**
- **Reason:** Deferred to future pass to focus on core financial decision cockpit.

---

## 5. Category D: AI Financial Assistants

### 5.1 State-of-the-Art Analysis
Current financial AI systems (e.g., Intuit Assist, Brex AI, Ramp Intelligence, Copilot Intelligence) follow strict architectural patterns to prevent financial misinformation:

1. **Grounded Retrieval-Augmented Calculations:**  
   LLMs must never perform arithmetic over raw multi-month transaction tables. Instead, deterministic backend SQL/aggregation services compute verified mathematical facts (totals, averages, margins, ratios). These pre-computed facts are injected into the structured context.
2. **Intent Classification & Dispatch:**  
   User questions are classified into distinct financial intents (e.g., `AFFORDABILITY_CHECK`, `SPENDING_SUMMARY`, `BUDGET_ANALYSIS`, `BUSINESS_PERFORMANCE`). Each intent routes to a specialized calculation pipeline before prompting the model.
3. **Guardrails & Disclaimers:**  
   Every AI recommendation must include an underlying `evidence` metric (e.g., "Software expenses grew 28% MoM") and explicit labeling: *"Estimated projection — not certified financial or tax advice."*
4. **Structured Decision Support (Affordability Engine):**  
   When a user asks *"Can I spend $X on Y?"*, the system evaluates liquid personal cash, upcoming commitments, budget slack, business obligations, and reserves to deliver a transparent Go/Caution/No-Go assessment.

---

## 6. Synthesis: The MyBIZ Competitive Opportunity

| Capability | Personal Apps (YNAB/Monarch) | Business Apps (QBO/Xero) | MyBIZ Unique Advantage |
|---|---|---|---|
| **Personal vs Business Realm Separation** | 🔴 Ignores business | 🔴 Ignores personal | 🟢 **Both realms unified with visual firewall** |
| **"Safe to Spend" Decision Cockpit** | 🟡 Personal only | 🔴 None | 🟢 **Combines personal liquidity + business health** |
| **Estimated Tax Reserve Planning** | 🔴 None | 🟡 Complex payroll/tax setup | 🟢 **Instant configurable % reserve from profit** |
| **Recurring Commitments Integration** | 🟡 Personal bills only | 🟡 Business AP only | 🟢 **Cross-realm commitment runway** |
| **Grounded AI Financial Advisor** | 🟡 Generic chat | 🟡 Generic reporting | 🟢 **Calculated deterministic facts + explainability** |

This research directly informs the Feature Priority Matrix in `docs/FEATURE_PRIORITY.md`.
