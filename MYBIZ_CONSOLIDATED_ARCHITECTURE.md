# MyBIZ – Consolidated Product Architecture Proposal

**Role**: Developer 2 – Personal Business Advisor and Financial Management System (MyBIZ)  
**Date**: 2026-10-25  
**Baseline Artifacts**: [`SOURCE_INVENTORY.md`](./SOURCE_INVENTORY.md), [`REPOSITORY_AUDIT.md`](./REPOSITORY_AUDIT.md), [`MYBIZ_MODULE_MAPPING.md`](./MYBIZ_MODULE_MAPPING.md), [`GEMINI.md`](./GEMINI.md)  
**Status**: Architecture Design Proposal (No implementation code written)

---

## Executive Summary & Guiding Principles

This document defines the consolidated, production-grade system architecture for **MyBIZ (Personal Business Advisor and Financial Management System)**.

### Core Architectural Mandates
1. **Single Cohesive Product**: Strict avoidance of microservice sprawl, duplicate databases, or Frankenstein integrations. Personal finance and business operations live under a unified, single-tenant/multi-tenant domain model.
2. **Reuse-Ready, Clean-Room Architecture**: Since local source audits confirmed **0 external source repositories currently on disk**, all architecture patterns are designed from first principles with standardized extension interfaces. If donor codebases are introduced later, they will be adapted into these predefined interfaces without altering the core architecture.
3. **Audit Trail**: Every architectural decision explicitly answers: **WHY**, **WHAT SOURCE IS REUSED**, **WHAT MUST BE MODIFIED**, and **WHAT MUST BE BUILT NEW**.

---

## 1. Frontend Architecture

* **Design**: Modern Single Page / Server-Driven Application built with **Next.js / React (TypeScript)** and **Tailwind CSS**. Organized by domain feature modules matching the 27 MyBIZ core modules:
  * `/modules/auth`
  * `/modules/personal` (accounts, income, expenses, budgets, savings, cash-flow)
  * `/modules/business` (clients, catalog, sales, expenses, revenue, KPIs)
  * `/modules/advisory` (AI financial advisor, AI business advisor, forecasts, recommendations, chat)
  * `/modules/dashboard` (unified cross-realm metrics)
  * `/modules/shared` (UI component library, charts, data-grid, export tools)
* **WHY**: Next.js provides server-side rendering (SSR) for fast initial load, API route aggregation, strong TypeScript typing, and seamless integration with modern charting libraries (e.g. Recharts/Chart.js).
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None (0 source projects available).
* **WHAT MUST BE MODIFIED**: Any incoming frontend code from donor repos must be refactored into the shared Tailwind design system and TypeScript models.
* **WHAT MUST BE BUILT NEW**: Complete unified UI layout, sidebar navigation, cross-realm personal/business dashboard, and interactive AI advisory chat panel.

---

## 2. Backend Architecture

* **Design**: **Modular Monolith (Clean Architecture)**. A single consolidated Node.js/TypeScript (NestJS or Express+TS) or Python (FastAPI) backend application structured with distinct domain boundaries:
  * `Core Domain`: Entity models, business rules, financial ledger invariants.
  * `Application Services`: Orchestrates use cases (e.g. `RecordExpenseUseCase`, `GenerateForecastUseCase`).
  * `Infrastructure Adapters`: Database persistence (ORM), AI model connectors, payment webhooks, notification senders.
  * `Interface Layer`: REST controllers, WebSocket gateways.
* **WHY**: A Modular Monolith delivers ultra-high cohesion, simplified transaction management across personal and business tables, zero inter-service network latency, and straightforward deployment without orchestrating distributed microservices.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: If donor backend components are supplied, their routes and controllers must be unwrapped and plugged into this modular application service layer.
* **WHAT MUST BE BUILT NEW**: Domain services, transaction pipeline, and API router layer.

---

## 3. Authentication Architecture

* **Design**: **Stateless JWT with Secure HttpOnly Refresh Tokens**.
  * Access Tokens (short-lived, 15m) carrying user identity and active tenant context.
  * Refresh Tokens (long-lived, 7d) stored securely in `HttpOnly`, `SameSite=Strict` cookies and hashed in the database with token-rotation and revocation lists.
  * Password hashing using **Argon2id** (or bcrypt with work factor >= 12).
* **WHY**: Protects against XSS (tokens not in localStorage) and CSRF (SameSite cookies + CSRF headers), providing a secure, stateless foundation for web and mobile clients.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: External auth modules must be consolidated so personal and business operations use the identical token payload.
* **WHAT MUST BE BUILT NEW**: Auth guards, token issuance/refresh middleware, and password hashing utilities.

---

## 4. Authorization Architecture

* **Design**: **Hybrid RBAC + Tenant Scoping**.
  * **Personal Realm**: Strict row-level ownership (`user_id = auth.uid`).
  * **Business Realm**: Multi-tenant Organization context (`org_id = current_org_id AND user_role IN [Owner, Admin, Accountant, Viewer]`).
* **WHY**: Prevents data leaks between unrelated businesses and guarantees that personal financial records remain strictly segregated from business stakeholders.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Tenant-resolution middleware and resource-level access control decorators/interceptors.

---

## 5. Database Architecture

* **Design**: **Single Consolidated PostgreSQL 16 Database with `pgvector`**.
  * Strict avoidance of duplicate databases.
  * **Schema Partitioning / Namespaces**:
    * `identity`: Users, sessions, security audit logs.
    * `personal`: Accounts, personal transactions, budgets, savings goals.
    * `business`: Businesses, customers, products/services, invoices, orders, OpEx/CapEx.
    * `ledger`: Immutable double-entry transaction journals for high-integrity accounting.
    * `ai_advisory`: Embeddings (`vector(1536)`), conversation history, generated recommendations.
* **WHY**: PostgreSQL provides ACID compliance required for financial accounting, relational integrity across customers and sales, and native vector storage (`pgvector`) eliminating the need for a separate vector database (e.g. Pinecone/Milvus).
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: Donor SQL scripts or ORM models must be merged into this single schema to eliminate duplicate tables.
* **WHAT MUST BE BUILT NEW**: Relational schema migrations, index definitions, and double-entry ledger constraints.

---

## 6. API Architecture

* **Design**: **Unified RESTful API (OpenAPI 3.1) + WebSockets for Streaming**.
  * `/api/v1/auth/*`
  * `/api/v1/personal/*`
  * `/api/v1/business/*`
  * `/api/v1/analytics/*`
  * `/api/v1/ai/*` (with `/stream` WebSocket/SSE for real-time advisor chat)
  * Standardized envelope responses (`{ success: true, data: ..., error: null }`).
* **WHY**: Predictable client contracts, automated TypeScript client generation from OpenAPI specs, and real-time streaming for AI advisory responses.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: Foreign endpoints must be remapped to the `/api/v1/` standard namespace.
* **WHAT MUST BE BUILT NEW**: Request validation DTOs, global exception filters, and OpenAPI schema generators.

---

## 7. AI/ML Architecture

* **Design**: **Google Gemini 3.8 / Flash Integration with RAG and Function Calling**.
  * **Advisory Engine**: Uses RAG (Retrieval-Augmented Generation) against user financial history stored in `pgvector`.
  * **Function Calling (Tools)**: The model is given read-only tool contracts (e.g. `calculateCashFlowRunway(org_id)`, `getBudgetVariance(user_id)`) to compute exact numbers rather than guessing math.
  * **Context Sandboxing**: Strict sanitization of prompts to prevent prompt injection and data exfiltration.
* **WHY**: LLMs excel at strategic synthesis and conversational guidance, but must never calculate finances directly; function calling ensures mathematical precision.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Tool dispatch router, system prompt templates for Financial and Business Advisors, and embedding ingestion worker.

---

## 8. Data Processing Architecture

* **Design**: **Event-Driven Aggregation Pipeline**.
  * Financial events (e.g. `TransactionCreated`, `InvoicePaid`) emit domain events to an in-memory or Redis event bus.
  * Aggregation handlers asynchronously compute running balances, budget variances, and monthly revenue summaries.
* **WHY**: Keeps API write operations lightweight (<20ms) while ensuring dashboards and reports read pre-aggregated metrics without scanning millions of transaction rows.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Event dispatcher, aggregation handlers, and Redis caching decorators.

---

## 9. Background Jobs Architecture

* **Design**: **Redis-Backed Job Queue (BullMQ or Celery)**.
  * Single queue service processing distinct job types:
    * `reports`: Async generation of P&L statements, tax summaries, and PDF exports.
    * `forecasts`: Nightly calculation of personal wealth trajectories and business cash runway.
    * `alerts`: Budget breach triggers and invoice overdue reminders.
* **WHY**: Offloads CPU-intensive and long-running tasks from the main HTTP thread to maintain high responsiveness.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: Any cron scripts from donor repos must be converted to managed queue workers.
* **WHAT MUST BE BUILT NEW**: Queue workers, scheduler definitions, and job retry/failure telemetry.

---

## 10. External Integrations Architecture

* **Design**: **Adapter Pattern / Hexagonal Ports & Adapters**.
  * `BankingPort`: Abstract interface implemented by Plaid or mock CSV feeds.
  * `PaymentPort`: Abstract interface implemented by Stripe webhook/checkout adapters.
  * `CommunicationPort`: Abstract interface implemented by SendGrid (email) / Twilio (SMS).
* **WHY**: Decouples business logic from external third-party SDKs, allowing easy testing with mock adapters and hot-swapping providers.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: Third-party API calls in donor repos must be wrapped inside these formal ports.
* **WHAT MUST BE BUILT NEW**: Webhook verification handlers, mock adapters for offline development, and provider wrappers.

---

## 11. File / Storage Architecture

* **Design**: **Abstract File Storage Service (Local Disk in Dev, S3-Compatible in Prod)**.
  * Dedicated storage buckets for:
    * `receipts/` (OCR scans, personal and business purchase receipts)
    * `invoices/` (Generated customer PDF invoices)
    * `exports/` (Temporary CSV/Excel downloads with automated 24h TTL purge)
  * Direct client access via short-lived signed URLs.
* **WHY**: Prevents binary files from bloating the database and isolates unstructured attachments.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: File upload validation (MIME-type sniffing, virus scanning, size constraints) and signed URL generator.

---

## 12. Docker Architecture

* **Design**: **Consolidated Multi-Stage `compose.yaml` Orchestration**.
  * Services:
    1. `mybiz-frontend`: Next.js web application.
    2. `mybiz-backend`: Modular backend API and WebSocket server.
    3. `mybiz-worker`: Asynchronous background worker (same codebase as backend, different entrypoint).
    4. `postgres`: PostgreSQL 16 with `pgvector` extension.
    5. `redis`: Redis 7 Alpine (caching + job queue).
  * Single internal bridge network (`mybiz-network`).
  * Named persistent volumes: `pg_data`, `redis_data`, `storage_data`.
* **WHY**: Ensures 100% environment parity between local development and production with a single `docker compose up` command.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Optimized multi-stage `Dockerfile` (distroless/alpine runners) and `compose.yaml`.

---

## 13. Development Environments

* **Design**:
  * Unified `.env.example` with centralized variable documentation.
  * Seed scripts (`seed:dev`) providing realistic personal accounts, transactions, business clients, catalog items, and mock AI embeddings.
  * VS Code workspace settings and debugging launch configurations pre-wired.
* **WHY**: Eliminates "works on my machine" issues and allows rapid onboarding and regression testing.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Comprehensive mock data seed generator and `.env.example`.

---

## 14. Testing Architecture

* **Design**: **Testing Pyramid**.
  * **Unit Tests**: Domain logic, financial calculations, ledger invariants, and KPI formulas (100% deterministic, no network/DB).
  * **Integration Tests**: API controllers, database persistence transactions, auth middleware (tested against ephemeral test DB container).
  * **E2E Tests**: Playwright scripts verifying critical user journeys (e.g. register -> record income -> create customer -> issue invoice -> chat with AI advisor).
* **WHY**: Guarantees financial calculation accuracy and prevents regressions across complex module interactions.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Test fixtures, mock factories, and Playwright test suites.

---

## 15. Deployment Architecture

* **Design**: **Containerized Cloud Deployment (Docker / Kubernetes or Cloud Run / ECS)**.
  * Single ingress reverse proxy (Nginx or Traefik) handling TLS termination, rate limiting, and route dispatching (`/` -> frontend, `/api` -> backend).
  * Stateless web and worker containers enabling horizontal auto-scaling.
* **WHY**: Minimizes operational overhead and cost while allowing independent scaling of background workers during heavy forecasting or report generation.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Nginx ingress configuration and GitHub Actions CI/CD workflows.

---

## 16. Monitoring & Logging Architecture

* **Design**: **Structured JSON Logging & Standardized Health Probes**.
  * Structured JSON logs (`timestamp`, `level`, `correlation_id`, `user_id`, `service`, `message`) emitted to stdout.
  * `/healthz` (liveness probe) and `/readyz` (readiness probe checking DB & Redis connectivity).
  * OpenTelemetry tracing hooks across API requests, DB queries, and AI generation calls.
* **WHY**: Enables instant debugging of production issues, distributed request tracing, and automated container health management.
* **WHAT SOURCE COMPONENT IS BEING REUSED**: None.
* **WHAT MUST BE MODIFIED**: N/A.
* **WHAT MUST BE BUILT NEW**: Health check routes, request correlation ID middleware, and structured logger.

---

## Summary of Reuse vs. New Build

| Component Layer | Reused Source | Must Be Modified | Must Be Built New |
| :--- | :--- | :--- | :--- |
| **Frontend** | None (0 repos) | Any future donor UI -> Tailwind & Next.js | Unified cross-realm app & AI chat |
| **Backend** | None (0 repos) | Any future donor API -> Modular Monolith | Domain services & Clean Architecture |
| **Database** | None (0 repos) | Any future donor schemas -> Single PostgreSQL | Consolidated schema & double-entry ledger |
| **AI / ML** | None (0 repos) | N/A | Gemini 3.8 RAG + Tool dispatch |
| **Infrastructure** | None (0 repos) | N/A | Docker Compose, Redis queues, Ingress |
