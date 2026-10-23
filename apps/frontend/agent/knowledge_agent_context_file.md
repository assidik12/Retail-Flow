# Knowledge Agent Context File - Retail Flow POS Frontend

> **File panduan ini digunakan oleh AI Assistant / Knowledge Agent (seperti Cursor, Windsurf, Copilot, atau Claude) untuk memahami konteks arsitektur dan aturan pengerjaan kode pada proyek ini.**

---

## 1. Context & Tech Stack Overview

- **Project Name:** Retail Flow POS - Toko Retail Pakaian Batik
- **Domain:** Point of Sale (POS), Digital Catalog, Inventory Management System.
- **Backend Architecture:** Spring Boot REST API (Java 17, JWT Authentication, RBAC Security, MySQL).
- **Target Frontend Architecture:** React / Next.js dengan TypeScript, Tailwind CSS, TanStack Query, dan Zustand.

---

## 2. REST API Specification Summary

### **Base URL Prefix:** `/api/v1`

| Domain           | Method   | Endpoint             | Access Role        | Description                             |
| ---------------- | -------- | -------------------- | ------------------ | --------------------------------------- |
| **Auth**         | `POST`   | `/auth/login`        | Public             | Authentication & Return JWT Token       |
| **Auth**         | `POST`   | `/auth/register`     | Public / Admin     | Register new account                    |
| **Users**        | `GET`    | `/users/me`          | Authenticated      | Get current logged-in user profile      |
| **Products**     | `GET`    | `/products`          | Authenticated      | Fetch paginated/filtered batik products |
| **Products**     | `POST`   | `/products`          | `ADMIN`            | Create new product                      |
| **Products**     | `PUT`    | `/products/{id}`     | `ADMIN`            | Update existing product/stock           |
| **Products**     | `DELETE` | `/products/{id}`     | `ADMIN`            | Delete product                          |
| **Transactions** | `POST`   | `/transactions`      | `CASHIER`, `ADMIN` | Process POS checkout transaction        |
| **Transactions** | `GET`    | `/transactions`      | Authenticated      | Fetch transaction history list          |
| **Transactions** | `GET`    | `/transactions/{id}` | Authenticated      | Get detail order & item breakdowns      |

### **Backend Data Enums:**

- `Role`: `ADMIN`, `CASHIER`
- `PaymentMethod`: `CASH`, `QRIS`, `TRANSFER`, `DEBIT`
- `TransactionStatus`: `PENDING`, `COMPLETED`, `CANCELLED`

---

## 3. Strict Coding Rules for AI Agents

1. **TypeScript Strictness:** Always generate strict TypeScript interfaces for API requests, responses, and store states.
2. **No Direct Fetching in UI:** Always separate API calls into `src/api/` and wrap them in custom hooks or TanStack Query mutations/queries.
3. **Response Handling Pattern:** The backend wraps responses inside `ApiResponse<T>` (`{ statusCode, message, data, errors }`). Unwrap `response.data.data` properly.
4. **Formatters:** Always format rupiah amounts with `Intl.NumberFormat('id-ID')`.
5. **Atomic Design:** Write presentational UI in layers: atoms (`src/components/atoms/`), molecules (`src/components/molecules/`), organisms (`src/components/organisms/`), and templates (`src/components/templates/`). Pages inside `src/features/{feature}/` compose these layers and connect API, hooks, store, and router. Atoms and molecules must not access API or global state directly.
6. **Cart State Safety:** Ensure quantity increments check against product stock limits before mutating cart state.
