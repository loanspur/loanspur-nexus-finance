# FILE: 1-overview.md
# LoanspurCBS v2.0 - System Overview

## Purpose
LoanspurCBS is a **multi-tenant Core Banking System (CBS)** designed for **SACCOs, MFIs, and digital lenders**. The system supports **loan management, savings, accounting, and customer relationship management**, with **maker-checker workflows, multi-tenant isolation, and modular feature architecture**.

## Current Version
- **Current Branches:**
  - `main` → Production
  - `dev_branch` → Development (active)
- **Deployment:**
  - Automatic deployment from `dev_branch` to **development environment**
  - `main` branch feeds **production**

## Tech Stack
- **Frontend:** Next.js + Tailwind + ShadCN UI
- **Backend:** Supabase (Postgres, Auth, RLS)
- **APIs:** Supabase Functions + Webhooks
- **State Management:** React Query
- **Deployment:** Vercel / Supabase Hosting
- **CI/CD:** GitHub Actions (to be enhanced)

## Scope
- Multi-Tenant Management
- Loans & Savings
- Client & Group Management
- Accounting & Ledger
- CRM & Notifications
- Reports & Dashboards

---

# FILE: 2-current-state.md
# Current State of the System

## Implemented Features
- Multi-tenant structure (basic)
- Loan Products & Applications
- Client Registration (basic KYC)
- Basic Ledger Entries
- Partial Notifications System
- Authentication via Supabase

## Status of Modules
- **Clients:** Functional but lacks advanced KYC
- **Loans:** Works for basic disbursement; approval flow incomplete
- **Savings:** Minimal or not fully implemented
- **Accounting:** General Ledger exists, needs double-entry enforcement
- **CRM:** Basic notifications, no event-driven flow
- **Reports:** Only basic lists, no analytics dashboards

---

# FILE: 3-bugs-and-issues.md
# Known Bugs & Issues

## Critical Bugs
- Loan approval workflow fails for multi-level approval
- Incorrect tenant isolation in some routes (data leaks possible)
- Double navigation rendering due to complex routing

## UI/UX Issues
- Inconsistent UI styling across pages
- Redundant loading spinners and verbose components
- Missing dark mode consistency

## Performance Issues
- Some queries not using indexed columns
- No caching for frequently accessed dashboards

## Security Gaps
- Incomplete RLS enforcement for tenant data
- Maker-checker not fully implemented

---

# FILE: 4-enhancement-plan.md
# Enhancement & Refactor Plan

## Goals
- **Fix existing bugs** without breaking current functionality
- **Refactor routing & state** for simplicity
- **Improve UI consistency** with ShadCN components
- **Add missing modules** (Savings, Groups, CRM enhancements)
- **Strengthen RLS and Maker-Checker** logic

## Enhancements
- Subdomain-based tenant isolation
- Zod-based form validation
- Notifications via Webhooks + Queues
- Loan state machine (Applied → Approved → Disbursed → Closed)

---

# FILE: 5-modules-and-features.md
# Core Modules & Features

## 1. Authentication & Tenant Management
- Supabase Auth (Email/Password, Magic Link)
- Role-Based Access Control (RBAC)
- Tenant isolation via subdomains

## 2. Clients & Groups
- Individual Client KYC
- Group Registration
- Member-to-Group Mapping

## 3. Loan Management
- Loan Products (Interest, Tenure)
- Loan Application → Approval → Disbursement
- Repayment Scheduling
- Overdue & PAR (Portfolio at Risk) Tracking

## 4. Savings
- Savings Accounts
- Fixed Deposits
- Withdrawals & Interest Calculation

## 5. Accounting & Ledger
- Double-entry accounting
- Journal Entries
- Chart of Accounts
- Reconciliation

## 6. CRM & Notifications
- Event-driven notifications (Email, SMS)
- Client Communications History
- Upcoming Payments Alerts

## 7. Reports & Analytics
- Client Portfolio Report
- Loan Performance
- Delinquency Reports
- Financial Statements

---

# FILE: 6-functional-requirements.md
# Functional Requirements

### Roles & Permissions
- **Super Admin:** Manage tenants
- **Admin:** Configure products, approve loans
- **Maker:** Initiate transactions
- **Checker:** Approve/reject transactions
- **Client:** View loan & savings status

### Use Cases
- Loan application process
- Savings deposit workflow
- Maker-Checker approval
- Client onboarding with KYC

---

# FILE: 7-non-functional-requirements.md
# Non-Functional Requirements

- **Scalability:** Handle 1,000+ tenants, 100,000+ clients
- **Performance:** < 2 sec load time for major dashboards
- **Security:** RLS enforced for every query
- **Maintainability:** Modular architecture
- **Auditability:** Full transaction logs

---

# FILE: 8-architecture.md
# System Architecture

- **Frontend:** Next.js app with modular routing
- **Backend:** Supabase (Postgres DB, Functions)
- **Tenant Isolation:** Subdomain-based
- **Workflow Engine:** Loan State Machine
- **Maker-Checker:** Implemented via status transitions

---

# FILE: 9-database-schema.md
# Database Schema Overview

### Key Tables
- `tenants` → stores organization info
- `users` → linked to tenant_id
- `clients` → KYC info
- `loan_products`
- `loans` → includes state machine status
- `savings_accounts`
- `transactions` → double-entry

### Policies
- RLS per tenant_id
- Role-based permissions

---

# FILE: 10-api-integration.md
# API & Integration Plan

- **Supabase Functions:** For custom workflows
- **Webhook Events:** Loan approval, disbursement
- **Third-Party Integrations:** Optional (SMS, Whatsapp,Email)

---

# FILE: 11-phased-roadmap.md
# Phased Roadmap

### Phase 1: Immediate Bug Fixes
- Fix approval workflow
- Enforce RLS
- Simplify routing
- UI cleanup (remove verbose components)
- User anthentication erros 

### Phase 2: Core Feature Completion
- Implement full maker-checker
- Complete savings module
- Accounting double-entry checks

### Phase 3: Enhancements
- Event-driven notifications
- Reports & dashboards
- Zod validation for forms

### Phase 4: Testing & QA
- Unit tests for major flows
- E2E tests for onboarding and loans

### Phase 5: Deployment Readiness
- Optimize for performance
- Enable feature flags
- Prepare CI/CD for GitHub Actions
