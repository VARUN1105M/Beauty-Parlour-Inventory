# API Specification & Client Contract

The POS & Retail ERP communicates via RESTful endpoints adhering to RFC 7807 (Problem Details for HTTP APIs) and strict idempotency semantics.

## 1. Authentication
- `POST /api/v1/auth/signin`
  - Body: `{"username": "manager", "password": "..."}`
  - Returns: JWT Bearer Token, User profile, Role permissions.

## 2. Point of Sale (POS) & Checkout

### `POST /api/v1/sales`
Processes a sale transaction atomically, decrements inventory, and logs payments.
- **Headers**: `Idempotency-Key: <UUID>`
- **Request Body**:
```json
{
  "branch_id": "c0000000-0000-0000-0000-000000000001",
  "customer_id": "cu000000-0000-0000-0000-000000000001",
  "cashier_id": "u0000000-0000-0000-0000-000000000005",
  "items": [
    {
      "product_id": "p0000000-0000-0000-0000-000000000001",
      "qty": 1,
      "unit_price": 29999.00,
      "discount": 1000.00,
      "inventory_unit_id": "u-tag-101"
    }
  ],
  "payment": {
    "method": "split",
    "cash_amount": 10000.00,
    "card_amount": 18999.00,
    "transaction_ref": "TXN_CARD_8871"
  },
  "idempotency_key": "7b830e22-83b0-4663-8a39-df0330182ab9"
}
```
- **Response**: `201 Created`
```json
{
  "sale_id": "s-9901",
  "invoice_number": "INV-20261026-0042",
  "total_amount": 29868.97,
  "payment_status": "paid",
  "loyalty_points_earned": 298
}
```

### `POST /api/v1/sales/:id/return`
Processes returns and restocking.
- **Requires**: Store Manager approval override.
- **Request Body**:
```json
{
  "sale_id": "s-9901",
  "reason": "Customer changed mind on jewellery color tone",
  "items": [
    {
      "product_id": "p0000000-0000-0000-0000-000000000001",
      "qty": 1,
      "refund_unit_price": 28999.00,
      "restock": true
    }
  ],
  "refund_method": "cash",
  "idempotency_key": "9c120e11-83b0-4663-8a39-df0330182ab1"
}
```

## 3. Inventory & Purchasing
- `GET /api/v1/products?search=&category=&low_stock=true`
- `POST /api/v1/products` (Create product)
- `POST /api/v1/stock/adjust`
  - Body: `{"product_id": "...", "change_qty": -1, "reason": "damage_loss", "notes": "Stone loose"}`
- `POST /api/v1/purchase_orders`
- `POST /api/v1/goods_receipts` (Restock received inventory)

## 4. Appointments & Bridal
- `GET /api/v1/appointments?date=2026-10-26`
- `POST /api/v1/appointments`
- `POST /api/v1/appointments/:id/checkin`
- `GET /api/v1/bridal_projects`
- `POST /api/v1/bridal_projects`
- `POST /api/v1/bridal_projects/:id/payments`

## 5. Day Close (Cashup Reconciliation)
- `POST /api/v1/day_closings`
  - Body: `{"opening_float": 5000.00, "actual_counted_cash": 42350.00, "notes": "Reconciled with safe"}`
