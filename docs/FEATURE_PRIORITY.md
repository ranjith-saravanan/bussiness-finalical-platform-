# MyBIZ — Feature Priority Matrix

**Document Version:** 1.0.0  
**Methodology:** Prioritized by Impact + User Frequency + Business Value vs Implementation Cost.  
**Focus Persona:** Alex Rivera (Solo Founder / Consultant at Apex Digital Studio).  

---

## 1. Feature Priority Table

| Feature | User Problem | Evidence from Research & Audit | Impact | Complexity | Priority |
|---|---|---|:---:|:---:|:---:|
| **Safe to Spend Decision Cockpit** | Alex cannot answer: *"How much money can I safely spend personally without damaging my business?"* | Zero-based budgeting (YNAB) and cash reserve logic (Monarch). Currently MyBIZ combines personal net cash and business profit into one number, creating severe risk of overspending. | **Very High** | Moderate | **P0** |
| **Personal vs Business Visual Firewall** | Founders commingle business receipts with personal spending money. | Stripe and QuickBooks maintain strict entity isolation. Dashboard currently lacks clear visual boundaries between realms. | **High** | Low | **P0** |
| **Estimated Tax Reserve Planning** | Alex does not know how much to withhold from business profit for quarterly taxes, risking surprise tax bills. | Solo founders consistently report tax surprise as their #1 stressor (Zoho Books / Wave). Currently no tax module exists in MyBIZ. | **High** | Low | **P0** |
| **Recurring Transactions & Commitments Engine** | Alex doesn't know upcoming fixed burn rate (subscriptions, retainers, rent) across months. | Rocket Money & Monarch center on upcoming recurring obligations. MyBIZ has `is_recurring` boolean flag but no commitments pipeline. | **High** | Moderate | **P0** |
| **Grounded AI Advisor & Structured Intent System** | Generic AI responses hallucinate financial estimates or give ungrounded advice. | Intuit Assist and Ramp AI rely on pre-calculated verified deterministic facts before generating advice. | **Very High** | Moderate | **P0** |
| **Affordability Check Engine** | Alex wonders: *"Can I spend $2,000 on a laptop?"* without risking bills or business runway. | Top user query pattern for solo founders. Needs deterministic calculation linking cash, commitments, and safety buffers. | **High** | Moderate | **P0** |
| **Budget Pacing & Projected Month-End** | Knowing spent vs limit is reactive; Alex needs to know if current pace will breach budget before month ends. | YNAB pacing alerts. Current MyBIZ only checks static % spent, ignoring days remaining. | **Medium-High** | Low | **P1** |
| **Savings Goal Run-rate & Required Contributions** | Goals have static progress without actionable timeline or monthly requirement. | Empower and Monarch calculate required monthly velocity to reach goal by target date. | **Medium** | Low | **P1** |
| **Business & Customer Profitability Analytics** | Alex cannot easily see which customers or products drive the bulk of revenue and profit. | FreshBooks, Square, and HubSpot provide customer LTV and product revenue concentration rankings. | **High** | Moderate | **P1** |
| **Sales Intelligence Pipeline (Paid vs Pending vs Cancelled)** | Invoices in draft or pending payment are either counted as cash or lost in the UI. | Xero and QuickBooks emphasize invoice aging and cash conversion pipelines. | **Medium-High** | Low-Mod | **P1** |
| **Expense Intelligence & MoM Anomalies** | Founders experience subscription creep without noticing month-over-month increases. | Copilot and Ramp provide automated spending anomaly detection. | **Medium-High** | Low-Mod | **P1** |
| **Notification Engine Categorization & Deduplication** | Cluttered or duplicate notifications diminish user attention and trust. | Linear/Slack notification triage best practices. | **Medium** | Low | **P1** |
| **Multi-currency Auto-FX conversion** | Cross-border consulting invoicing. | Zoho Books multi-currency. | Medium | High | **P2 (Deferred)** |
| **Automated Bank Feeds (Plaid integration)** | Manual entry of transactions can cause friction. | Monarch/Copilot Plaid feeds. Requires external paid SaaS API & compliance. | Very High | Very High | **P2 (Deferred)** |
| **Multi-user / Accountant Portal** | Sharing read-only books with external CPAs. | QuickBooks accountant access. | Medium | High | **P2 (Deferred)** |
| **Automated Tax Filing / IRS Form Generation** | Automated 1099/Schedule C generation. | TurboTax / Gusto. Heavy legal/regulatory burden. | High | Very High | **P2 (Deferred)** |

---

## 2. Implementation Scope (Pass 1: P0 & P1 Deliverables)

### Phase A: Core Backend Calculations & Schemas (P0 & P1)
1. **Financial Decision Cockpit & Safe-to-Spend**:
   - Calculate:
     - `available_personal_cash` (Personal Net Cash Flow)
     - `upcoming_personal_commitments` (Sum of active recurring monthly personal expenses)
     - `savings_reserve_requirement` (Configurable / calculated active savings goal allocation)
     - `safety_buffer` (Configurable / default buffer, e.g. $1,000)
     - `safe_personal_spending` = $\max(0, \text{Available Cash} - \text{Commitments} - \text{Savings Reserve} - \text{Safety Buffer})$
   - 5 Key Decision Questions structured summary in `/dashboard`.
2. **Tax Reserve Planning**:
   - `estimated_tax_rate` (default 25%, configurable 0-50%).
   - `suggested_tax_reserve` = $\max(0, \text{Business Profit} \times \text{Tax Rate})$.
   - Clean disclaimers on every calculation: *"Estimate — not official tax advice"*.
3. **Recurring Commitments Aggregation**:
   - Monthly recurring income vs recurring expense tracking.
   - Upcoming commitments for current month and next month.
4. **Enhanced Analytics**:
   - Customer revenue & sales frequency rollup.
   - Top customers and Top products rankings.
   - Sales status breakdown (Paid, Pending, Cancelled) and Average Order Value.
   - Expense intelligence: highest spending category and MoM trend detection.
5. **Enhanced Budgets & Savings**:
   - Budget: days remaining, projected month-end spend, potential overspend alert.
   - Savings: remaining amount, required monthly contribution, estimated completion months.
6. **Grounded AI Advisor & Affordability Check**:
   - Intent classification (`AFFORDABILITY_CHECK`, `SPENDING_SUMMARY`, `BUDGET_ANALYSIS`, `CASH_FLOW_ANALYSIS`, `BUSINESS_PERFORMANCE`, `SAVINGS_ANALYSIS`, `EXPENSE_ANOMALY`, `BUSINESS_GROWTH`).
   - Dedicated Affordability evaluation engine returning transparent math and risks.
   - Evidence-backed AI recommendations with database metrics.
7. **Notification Engine Upgrade**:
   - Standard categories: `BUDGET`, `CASH_FLOW`, `SAVINGS`, `BUSINESS`, `EXPENSE`, `FORECAST`.
   - Alert deduplication check (prevents identical active alerts).

### Phase B: Frontend Visual Polish & Decision Cockpit
1. **Visual Separation of Realms**: Distinct styled containers for "Personal Liquidity & Cash Flow" (Indigo/Blue/Emerald) vs "Business Performance & Operations" (Amber/Slate/Purple).
2. **Safe to Spend Interactive Widget**: Visual formula breakdown with cards, components, and estimate badge.
3. **Tax Reserve Card**: Prominently displayed in Business Operations with rate slider/config and clear disclaimer.
4. **Interactive Affordability Calculator & AI Assistant**: Quick preset questions ("Can I afford $2,000 for a new laptop?") with instant structured decision display.
5. **Budget Pacing & Run-Rate Badges**: Projected month-end warning tags.
6. **Customer & Product Leaderboards**: In Business & Analytics pages.
