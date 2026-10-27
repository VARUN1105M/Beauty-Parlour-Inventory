# Architecture & System Design Document

**Royal Heritage Beauty, Bridal & Fashion Jewellery POS and Retail ERP**

## 1. Executive Overview
This monorepo provides a production-grade retail Point-of-Sale (POS), inventory management, appointment scheduling, bridal project tracking, and financial reconciliation system specifically tailored for high-end beauty salons, bridal lounges, and fashion jewellery boutiques.

## 2. Monorepo Structure

```
/
├── apps/
│   ├── desktop_app/        # Flutter Windows Desktop application
│   ├── mobile_app/         # Flutter Android/iOS companion application
│   └── runnable_desktop/   # Standalone immediately executable Windows desktop app (React + Vite)
├── packages/
│   ├── core_models/        # Shared domain models & JSON serialization
│   ├── api_client/         # Supabase client, offline sync, hardware ESC/POS commands
│   ├── auth/               # Session management & user authentication
│   ├── permissions/        # Role-based access control (RBAC) matrix
│   └── ui_components/      # Reusable widgets and UI components
├── backend/
│   ├── migrations/         # PostgreSQL DDL, schema, RLS policies, stored procedures
│   └── seeds/              # Realistic initial seed data for jewellery, bridal & beauty
└── docs/                   # Architecture, ERD, API specs, hardware guides
```

## 3. High-Value Jewellery & Bridal Domain Requirements

### A. Dual Inventory Model
- **Serialized Items (Jewellery & Bridal Couture)**: Unique items (e.g., Kundan chokers, Polki necklaces, Designer Lehengas) have unique barcodes/RFID tags (`inventory_units`). Each piece carries gross weight, net weight, purity/karat, and individual cost.
- **Bulk / Standard Consumables**: Cosmetics, skin serums, beauty products tracked via standard quantity counts (`products.stock_on_hand`).
- **Services**: Stylist appointments, HD makeup, hairdos, bridal trials (`is_service = true`), consuming no physical stock directly.

### B. Transactional Concurrency & Idempotency
- All write endpoints (sales, refunds, stock movements) require an `idempotency_key` (UUID v4).
- Database procedures execute explicit row locking (`FOR UPDATE`) on products before decrementing stock, preventing race conditions during simultaneous sales across multiple POS registers.

### C. Role-Based Access Control (RBAC)
- **Receptionist**: Booking appointments, customer check-in, basic POS sales, CRM management.
- **Cashier**: High-speed sales checkout, barcode scanning, cash drawer management, day closing cashup.
- **Inventory Manager**: Purchasing, PO creation, goods receipt intake, stock adjustments, barcode printing.
- **Bridal Manager**: Bridal leads, project coordination, service allocations, installment payment tracking.
- **Store Manager**: Full administrative access, financial overrides (refunds, discounts > threshold), employee shift/attendance approvals, P&L reports.
