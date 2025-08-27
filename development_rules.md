Here’s the **comprehensive and elegant Markdown document** combining everything:

✔ Development Rules
✔ Cursor AI Prompt Guide
✔ Testing Scenarios with Tables
✔ Automatic Documentation Strategy
✔ User Roles & Permissions
✔ CI/CD Documentation Updates

---

# ✅ **Project Development Standards & AI Workflow Index**

This document defines the **core rules, best practices, and AI-assisted development prompts** for all projects. It is optimized for indexing in **Cursor AI** and serves as the **single source of truth** for code quality, documentation, and workflow automation.

---

## **1. Core Development Principles**

* ✅ **Reuse existing functions and components** wherever possible.
* ✅ Avoid **code redundancy, duplication, and hardcoding**.
* ✅ Apply **DRY principles** and modular coding structure.
* ✅ Implement **global form validation and submission rules** for all create/edit actions.
* ✅ **All data tables must include complete CRUD functionality**:

  * **Create/Edit** → Validates and updates database records.
  * **Delete** → Requires **confirmation modal** and enforces **RLS/RBAC restrictions**.
* ✅ **Business logic always takes precedence** over UI shortcuts.
* ✅ **No modification of existing UI components** without explicit approval.

---

## **2. Documentation & System Plan**

* ✅ **System Documentation** must be updated after:

  * Adding new features.
  * Fixing bugs or applying enhancements.
* ✅ **API Documentation**:

  * Maintain **Swagger/OpenAPI specs** for all endpoints.
  * Auto-generate updates when routes or models change.
* ✅ **User Guide & Role Permissions**:

  * Update instructions whenever features affect user workflows.

---

## **3. Feature Implementation Rules**

* ✅ Use **existing reusable code** before creating new implementations.
   ✅ Use **existing reusable system wide database access layer** before creating new connection. 
* ✅ Maintain **compatibility with existing business logic**.
* ✅ Optimize for **clean, maintainable, and scalable code**.

---

## **4. Security & Permissions**

* ✅ Never hardcode **API keys or credentials**.
* ✅ Validate and sanitize **all user inputs**.
* ✅ Enforce **Role-Based Access Control (RBAC)** and **Row-Level Security (RLS)** for sensitive operations.

---

## **5. Version Control & CI/CD**

* ✅ Branching Strategy:

  * **Feature Branch → dev\_branch → main\_branch**.
* ✅ Merge only after:

  * Passing all tests.
  * Documentation updates complete.
* ✅ **CI/CD must auto-trigger:**

  * API docs update.
  * System documentation generation.
  * Test execution before deployment.

---

## **6. UI/UX Consistency**

* ✅ Follow **design system tokens** for all new components.
* ✅ Ensure **responsiveness and accessibility** across devices.

---

### ✅ **Golden Rule**

> **Prioritize business logic, maintainability, and security above all shortcuts or temporary fixes.**

---

# 🧠 **Cursor AI Prompt Guide**

### **General Development Prompt**

```
Follow these rules:
- Reuse existing components; avoid duplication.
- Apply global form validation and submission logic.
- Ensure CRUD completeness in tables with delete confirmation and RLS.
- Maintain business logic integrity.
- Update system, API, and user documentation for new features.
```

### **Feature Creation Prompt**

```
Create a new feature that:
- Uses existing reusable components/services.
- Implements global validation for create/edit forms.
- Adds CRUD to tables with delete confirmation and RLS.
- Updates API and system documentation automatically.
- Includes steps for updating the user guide.
```

### **Bug Fix Prompt**

```
Fix the bug while:
- Preserving business logic and existing functionality.
- Maintaining CRUD features and global form rules.
- Ensuring UI consistency and updating docs if behavior changes.
```

### **Code Review Prompt**

```
Review the code for:
- DRY compliance and no redundant code.
- Proper validation and CRUD operations.
- Security (RBAC, RLS, no hardcoded secrets).
- Documentation and user guide updates.
```

---

# ✅ **Testing Scenarios**

| **Feature**         | **Test Case**                | **Expected Result**                |
| ------------------- | ---------------------------- | ---------------------------------- |
| **Create**          | Submit form with valid data  | Record is saved in DB              |
|                     | Submit with invalid data     | Error message shown                |
| **Read**            | Load table data              | All records display correctly      |
| **Update**          | Edit record and save         | Updated record persists in DB      |
|                     | Edit with invalid data       | Validation error shown             |
| **Delete**          | Click delete                 | Confirmation modal appears         |
|                     | Confirm delete               | Record removed (if allowed by RLS) |
|                     | Unauthorized delete          | Access denied message              |
| **Form Validation** | Leave required field empty   | Error displayed                    |
| **Security (RBAC)** | User tries restricted action | Blocked with error                 |

---

# ✅ **Automatic Documentation Strategy**

### **System Documentation**

* Use **AI tools or Docusaurus** to auto-generate documentation after commits.

### **API Documentation**

* Use **Swagger/OpenAPI** to:

  * Auto-generate endpoint documentation on every update.
  * Validate request/response models.

### **User Guide Updates**

* Whenever a feature changes the UI:

  * Update **screenshots, usage steps, and role permissions**.

---

# ✅ **Roles & Permissions**

| **Role**        | **Permissions**                                      |
| --------------- | ---------------------------------------------------- |
| **Super Admin** | Full access to all modules and settings              |
| **Admin**       | Manage users, products, reports (organization level) |
| **Cashier**     | Process sales, returns, and assigned reports         |
| **Customer**    | View products, place orders, manage account          |

**Delete and sensitive actions must always follow RBAC & RLS.**

---

# ✅ **CI/CD Documentation Updates**

* Auto-run scripts to:

  * Generate **API docs** from code annotations.
  * Build and deploy **system documentation** after merges.
  * Sync **user guides** with feature changes using AI summaries.

---

### ✅ **Final Question for You**

Do you want me to **include ready-to-use CI/CD YAML snippets** (for GitHub Actions or GitLab CI) that:

* Auto-generate API docs,
* Update user guides,
* Push to a documentation site after deployment?

Or keep this as a pure **indexing guide for Cursor AI**?
