-- ====================================================================
-- 01_INITIAL_SCHEMA.SQL
-- Enterprise POS & Retail ERP for Beauty, Bridal & Fashion Jewellery
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- ENUMS
-- --------------------------------------------------------------------
CREATE TYPE user_role_type AS ENUM (
    'receptionist',
    'cashier',
    'inventory_manager',
    'bridal_manager',
    'store_manager',
    'system_admin'
);

CREATE TYPE sale_status_type AS ENUM (
    'draft',
    'completed',
    'partially_refunded',
    'refunded',
    'cancelled'
);

CREATE TYPE payment_method_type AS ENUM (
    'cash',
    'card',
    'upi',
    'bank_transfer',
    'store_credit',
    'split'
);

CREATE TYPE payment_status_type AS ENUM (
    'unpaid',
    'partial',
    'paid',
    'refunded'
);

CREATE TYPE appointment_status_type AS ENUM (
    'scheduled',
    'confirmed',
    'checked_in',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE bridal_project_status_type AS ENUM (
    'enquiry',
    'quote_sent',
    'confirmed',
    'trial_completed',
    'in_execution',
    'completed',
    'cancelled'
);

CREATE TYPE stock_movement_reason AS ENUM (
    'purchase_receipt',
    'sale',
    'customer_return',
    'supplier_return',
    'damage_loss',
    'inventory_adjustment',
    'bridal_rental_out',
    'bridal_rental_in'
);

CREATE TYPE unit_track_type AS ENUM (
    'standard',      -- bulk items tracked by quantity
    'serialized',    -- jewelry with unique tags / serial barcodes
    'weight_based'   -- precious items tracked by grams/weight
);

-- --------------------------------------------------------------------
-- CORE BUSINESS & BRANCHES
-- --------------------------------------------------------------------
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gst_or_tax_id VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    tax_rate NUMERIC(5, 2) DEFAULT 3.00, -- default jewelry GST rate or 18% salon services
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- USERS, ROLES & PERMISSIONS
-- --------------------------------------------------------------------
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code user_role_type UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    employee_code VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100) UNIQUE,
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    commission_rate NUMERIC(5, 2) DEFAULT 0.00, -- percentage
    is_beautician BOOLEAN DEFAULT FALSE,
    is_bridal_stylist BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_code user_role_type NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- CUSTOMERS (CRM)
-- --------------------------------------------------------------------
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    loyalty_points INT DEFAULT 0,
    store_credit NUMERIC(12, 2) DEFAULT 0.00,
    preferred_stylist_id UUID REFERENCES employees(id),
    skin_hair_notes TEXT,
    jewelry_preferences TEXT,
    wedding_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- --------------------------------------------------------------------
-- INVENTORY & PRODUCTS
-- --------------------------------------------------------------------
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'jewellery', 'bridal_wear', 'beauty_service', 'beauty_retail'
    description TEXT,
    tax_rate NUMERIC(5, 2) DEFAULT 3.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    sku VARCHAR(60) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    track_type unit_track_type DEFAULT 'standard',
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sell_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    mrp NUMERIC(12, 2),
    stock_on_hand INT NOT NULL DEFAULT 0,
    reorder_threshold INT DEFAULT 2,
    is_service BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);

-- Unique items/units especially for high-value Jewellery or Bridal lehengas
CREATE TABLE inventory_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    unique_tag VARCHAR(100) UNIQUE NOT NULL, -- RFID / Tag ID printed on jewellery
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'reserved', 'sold', 'in_bridal_trial', 'damaged'
    gross_weight_grams NUMERIC(10, 3),
    net_weight_grams NUMERIC(10, 3),
    purchased_cost NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_units_tag ON inventory_units(unique_tag);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    inventory_unit_id UUID REFERENCES inventory_units(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    change_qty INT NOT NULL, -- +positive for stock in, -negative for stock out
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason stock_movement_reason NOT NULL,
    ref_type VARCHAR(50), -- 'sale', 'purchase_order', 'manual_adjustment', 'return'
    ref_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- PURCHASING & SUPPLIERS
-- --------------------------------------------------------------------
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    tax_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(60) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'issued', 'partially_received', 'completed', 'cancelled'
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    ordered_qty INT NOT NULL CHECK (ordered_qty > 0),
    received_qty INT NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(60) UNIQUE NOT NULL,
    po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    receipt_date TIMESTAMPTZ DEFAULT NOW(),
    supplier_invoice_ref VARCHAR(100),
    total_received_amount NUMERIC(12, 2) DEFAULT 0.00,
    received_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    received_qty INT NOT NULL CHECK (received_qty > 0),
    unit_cost NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- POINT OF SALE (POS) & SALES
-- --------------------------------------------------------------------
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(60) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    cashier_id UUID NOT NULL REFERENCES users(id),
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    status sale_status_type DEFAULT 'completed',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status payment_status_type DEFAULT 'paid',
    idempotency_key UUID UNIQUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX idx_sales_idempotency_key ON sales(idempotency_key);
CREATE INDEX idx_sales_date ON sales(sale_date);

CREATE TABLE sale_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    inventory_unit_id UUID REFERENCES inventory_units(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES employees(id), -- staff credited for commission
    qty INT NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(12, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(60) UNIQUE NOT NULL,
    original_sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    refund_amount NUMERIC(12, 2) NOT NULL,
    refund_method payment_method_type NOT NULL,
    approved_by UUID NOT NULL REFERENCES users(id), -- manager override requirement
    idempotency_key UUID UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE return_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    sale_line_id UUID NOT NULL REFERENCES sale_lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    qty INT NOT NULL CHECK (qty > 0),
    refund_unit_price NUMERIC(12, 2) NOT NULL,
    restocked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- PAYMENTS & BILLING
-- --------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    method payment_method_type NOT NULL,
    transaction_ref VARCHAR(100), -- UPI txn id or card approval code
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID NOT NULL REFERENCES users(id),
    idempotency_key UUID UNIQUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_sale_id ON payments(sale_id);

-- --------------------------------------------------------------------
-- APPOINTMENTS & SALON SERVICES
-- --------------------------------------------------------------------
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number VARCHAR(60) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_check_in TIMESTAMPTZ,
    actual_completed TIMESTAMPTZ,
    status appointment_status_type DEFAULT 'scheduled',
    total_price NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_appointments_time ON appointments(scheduled_start, scheduled_end);

-- --------------------------------------------------------------------
-- BRIDAL PROJECTS & PACKAGES
-- --------------------------------------------------------------------
CREATE TABLE bridal_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(60) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    event_date DATE NOT NULL,
    venue_address TEXT,
    package_name VARCHAR(150) NOT NULL,
    lead_source VARCHAR(100),
    status bridal_project_status_type DEFAULT 'enquiry',
    total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deposit_required NUMERIC(12, 2) DEFAULT 0.00,
    deposit_paid NUMERIC(12, 2) DEFAULT 0.00,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bridal_project_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bridal_project_id UUID NOT NULL REFERENCES bridal_projects(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL, -- 'Bridal HD Makeup', 'Hair Updo & Floral', 'Saree Draping', 'Jewellery Fitting', 'Mehendi'
    event_phase VARCHAR(50) NOT NULL,  -- 'Engagement', 'Sangeet', 'Wedding Day', 'Reception'
    assigned_staff_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- EMPLOYEES: SHIFTS & ATTENDANCE
-- --------------------------------------------------------------------
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    break_duration_mins INT DEFAULT 0,
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- EXPENSES & PETTY CASH
-- --------------------------------------------------------------------
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    incurred_by UUID REFERENCES users(id),
    category VARCHAR(100) NOT NULL, -- 'Supplies', 'Petty Cash', 'Refreshments', 'Rent', 'Utilities', 'Marketing'
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_type DEFAULT 'cash',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    receipt_attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- CASH DRAWER SESSIONS & DAY CLOSE
-- --------------------------------------------------------------------
CREATE TABLE day_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    closing_date DATE NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ NOT NULL,
    opened_by UUID NOT NULL REFERENCES users(id),
    closed_by UUID NOT NULL REFERENCES users(id),
    opening_float_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(12, 2) NOT NULL,
    actual_counted_cash NUMERIC(12, 2) NOT NULL,
    discrepancy_amount NUMERIC(12, 2) NOT NULL,
    total_sales_amount NUMERIC(12, 2) NOT NULL,
    total_card_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_upi_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_refunds_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_expenses_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_locked BOOLEAN DEFAULT TRUE,
    manager_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- AUDIT LOGS
-- --------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    user_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    ip_address VARCHAR(50),
    before_state JSONB,
    after_state JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
