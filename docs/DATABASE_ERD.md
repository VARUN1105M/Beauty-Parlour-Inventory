# Database Schema & Entity Relationship Diagram (ERD)

PostgreSQL schema for **Royal Heritage Bridal, Beauty & Fashion Jewellery POS and Retail ERP**.

```mermaid
erDiagram
    BUSINESSES ||--o{ BRANCHES : operates
    BRANCHES ||--o{ EMPLOYEES : employs
    BRANCHES ||--o{ USERS : authenticates
    BRANCHES ||--o{ PRODUCTS : inventories
    BRANCHES ||--o{ SALES : processes
    BRANCHES ||--o{ APPOINTMENTS : books
    BRANCHES ||--o{ BRIDAL_PROJECTS : executes
    BRANCHES ||--o{ DAY_CLOSINGS : closes

    ROLES ||--o{ USERS : assigns
    ROLES ||--o{ ROLE_PERMISSIONS : defines
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : grants

    CUSTOMERS ||--o{ SALES : purchases
    CUSTOMERS ||--o{ APPOINTMENTS : attends
    CUSTOMERS ||--o{ BRIDAL_PROJECTS : books

    PRODUCT_CATEGORIES ||--o{ PRODUCTS : categorizes
    PRODUCTS ||--o{ INVENTORY_UNITS : instances
    PRODUCTS ||--o{ STOCK_MOVEMENTS : tracks
    PRODUCTS ||--o{ SALE_LINES : includes
    PRODUCTS ||--o{ PURCHASE_ORDER_LINES : orders
    PRODUCTS ||--o{ GOODS_RECEIPT_LINES : receives

    SALES ||--o{ SALE_LINES : contains
    SALES ||--o{ PAYMENTS : settles
    SALES ||--o{ RETURNS : refunds
    RETURNS ||--o{ RETURN_LINES : lists

    SUPPLIERS ||--o{ PURCHASE_ORDERS : fulfills
    SUPPLIERS ||--o{ GOODS_RECEIPTS : supplies
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_LINES : contains
    GOODS_RECEIPTS ||--o{ GOODS_RECEIPT_LINES : contains

    EMPLOYEES ||--o{ SHIFTS : scheduled
    EMPLOYEES ||--o{ ATTENDANCE : logs
    EMPLOYEES ||--o{ APPOINTMENTS : performs

    BRIDAL_PROJECTS ||--o{ BRIDAL_PROJECT_SERVICES : schedules

    USERS ||--o{ AUDIT_LOGS : performs
```

## Schema Highlights

1. **Transactional Integrity & Idempotency**:
   - `idempotency_key` (UUID) is strictly enforced on `sales`, `returns`, and `payments`.
   - Concurrency is protected using `FOR UPDATE` row locks inside the `process_pos_sale` stored procedure.

2. **Inventory Tracking**:
   - High-value jewellery items (Kundan, Polki, Diamond sets) are tracked with unique serialized RFID/barcode tags via `inventory_units`.
   - General retail cosmetics and salon consumables are tracked via standard quantity counts in `products`.
   - Every physical stock change produces an immutable audit record in `stock_movements`.

3. **Financial Audit Trail**:
   - Financial adjustments are strictly append-only (returns, refunds, and discounts generate credit memos and audit rows; past sales are never deleted).
