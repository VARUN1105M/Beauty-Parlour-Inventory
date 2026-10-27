-- ====================================================================
-- 02_RLS_POLICIES.SQL
-- Supabase Row Level Security (RLS) & Role Permission Guards
-- ====================================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridal_project_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user's role from JWT claims
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'role_code',
        'receptionist'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to extract user's branch from JWT claims
CREATE OR REPLACE FUNCTION get_current_user_branch_id()
RETURNS UUID AS $$
BEGIN
    RETURN (current_setting('request.jwt.claims', true)::json->>'branch_id')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- --------------------------------------------------------------------
-- PRODUCTS & INVENTORY POLICIES
-- Read: Everyone
-- Write: Inventory Manager, Store Manager, System Admin
-- --------------------------------------------------------------------
CREATE POLICY "Allow authenticated read products"
ON products FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow managers to insert/update products"
ON products FOR ALL TO authenticated
USING (
    get_current_user_role() IN ('inventory_manager', 'store_manager', 'system_admin')
)
WITH CHECK (
    get_current_user_role() IN ('inventory_manager', 'store_manager', 'system_admin')
);

-- --------------------------------------------------------------------
-- SALES & SALE LINES POLICIES
-- Read: Cashier, Receptionist, Store Manager
-- Insert: Cashier, Receptionist, Store Manager
-- --------------------------------------------------------------------
CREATE POLICY "Allow branch staff to view sales"
ON sales FOR SELECT TO authenticated
USING (
    get_current_user_role() IN ('store_manager', 'system_admin')
    OR branch_id = get_current_user_branch_id()
);

CREATE POLICY "Allow cashier and receptionist to record sales"
ON sales FOR INSERT TO authenticated
WITH CHECK (
    get_current_user_role() IN ('cashier', 'receptionist', 'store_manager', 'system_admin')
);

CREATE POLICY "Allow viewing sale lines"
ON sale_lines FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow inserting sale lines"
ON sale_lines FOR INSERT TO authenticated
WITH CHECK (true);

-- --------------------------------------------------------------------
-- RETURNS POLICIES
-- Only Store Manager can approve/insert returns (Manager Override)
-- --------------------------------------------------------------------
CREATE POLICY "Allow view returns"
ON returns FOR SELECT TO authenticated
USING (
    get_current_user_role() IN ('store_manager', 'system_admin')
    OR branch_id = get_current_user_branch_id()
);

CREATE POLICY "Allow manager to authorize returns"
ON returns FOR INSERT TO authenticated
WITH CHECK (
    get_current_user_role() IN ('store_manager', 'system_admin')
);

-- --------------------------------------------------------------------
-- APPOINTMENTS POLICIES
-- Read & Insert: Receptionist, Bridal Manager, Store Manager
-- --------------------------------------------------------------------
CREATE POLICY "Allow receptionist and bridal mgr to manage appointments"
ON appointments FOR ALL TO authenticated
USING (
    get_current_user_role() IN ('receptionist', 'bridal_manager', 'store_manager', 'system_admin')
    OR branch_id = get_current_user_branch_id()
)
WITH CHECK (
    get_current_user_role() IN ('receptionist', 'bridal_manager', 'store_manager', 'system_admin')
);

-- --------------------------------------------------------------------
-- BRIDAL PROJECTS POLICIES
-- Read & Manage: Bridal Manager, Store Manager
-- Read-Only: Receptionist
-- --------------------------------------------------------------------
CREATE POLICY "Allow read bridal projects"
ON bridal_projects FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow bridal manager and store manager to modify bridal projects"
ON bridal_projects FOR ALL TO authenticated
USING (
    get_current_user_role() IN ('bridal_manager', 'store_manager', 'system_admin')
)
WITH CHECK (
    get_current_user_role() IN ('bridal_manager', 'store_manager', 'system_admin')
);

-- --------------------------------------------------------------------
-- DAY CLOSINGS (CASHUP) POLICIES
-- Only Cashier and Store Manager can access
-- --------------------------------------------------------------------
CREATE POLICY "Allow day closing operations"
ON day_closings FOR ALL TO authenticated
USING (
    get_current_user_role() IN ('cashier', 'store_manager', 'system_admin')
);

-- --------------------------------------------------------------------
-- AUDIT LOGS (Append-Only)
-- --------------------------------------------------------------------
CREATE POLICY "Allow reading audit logs for managers"
ON audit_logs FOR SELECT TO authenticated
USING (
    get_current_user_role() IN ('store_manager', 'system_admin')
);

CREATE POLICY "Allow system to append audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true);
