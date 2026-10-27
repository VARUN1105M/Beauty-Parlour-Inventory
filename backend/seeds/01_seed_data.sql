-- ====================================================================
-- 01_SEED_DATA.SQL
-- Seed Data for Royal Heritage Bridal, Jewellery & Beauty Studio
-- ====================================================================

-- 1. BUSINESS & BRANCH
INSERT INTO businesses (id, name, legal_name, gst_or_tax_id, currency, currency_symbol, phone, email, address)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Royal Heritage Bridal & Jewellery Lounge',
    'Royal Heritage Luxury Retail Pvt Ltd',
    '27AAAAA0000A1Z5',
    'INR',
    '₹',
    '+91 98200 12345',
    'contact@royalheritagebridals.com',
    '45 Palace Road, Diamond District, Mumbai 400001'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, business_id, code, name, phone, email, address, receipt_header, receipt_footer, tax_rate)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'BR-MUM-01',
    'Flagship Bridal & Jewellery Salon - Mumbai',
    '+91 98200 12345',
    'mumbai@royalheritagebridals.com',
    'Ground Floor, Heritage Towers, Mumbai 400001',
    'ROYAL HERITAGE BRIDALS & JEWELLERY\nMumbai Flagship Store\nGSTIN: 27AAAAA0000A1Z5',
    'Thank you for celebrating your milestones with Royal Heritage!\nExchange within 14 days with original tag & receipt.\nVisit www.royalheritagebridals.com',
    3.00
) ON CONFLICT (id) DO NOTHING;

-- 2. ROLES
INSERT INTO roles (id, code, name, description) VALUES
('r0000000-0000-0000-0000-000000000001', 'store_manager', 'Store Manager', 'Full branch management, financial overrides, refunds, audit logs'),
('r0000000-0000-0000-0000-000000000002', 'bridal_manager', 'Bridal Manager', 'Manage bridal projects, packages, trials, wedding artists, installment tracking'),
('r0000000-0000-0000-0000-000000000003', 'inventory_manager', 'Inventory Manager', 'Stock intake, purchasing, POs, barcode tagging, unit tracking and adjustments'),
('r0000000-0000-0000-0000-000000000004', 'receptionist', 'Receptionist', 'Front-desk check-in, beauty appointments, customer CRM, checkout assistance'),
('r0000000-0000-0000-0000-000000000005', 'cashier', 'Cashier', 'Fast POS checkout, receipt printing, cash drawer reconciliation, end-of-day closing')
ON CONFLICT (id) DO NOTHING;

-- 3. EMPLOYEES & USERS
INSERT INTO employees (id, branch_id, role_id, employee_code, first_name, last_name, phone, email, hourly_rate, commission_rate, is_beautician, is_bridal_stylist)
VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'EMP-001', 'Sunita', 'Mehta', '+91 98201 11001', 'sunita@royalheritage.com', 450.00, 2.50, FALSE, FALSE),
('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000002', 'EMP-002', 'Priya', 'Kapoor', '+91 98201 11002', 'priya@royalheritage.com', 400.00, 3.00, TRUE, TRUE),
('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'r0000000-0000-0000-0000-000000000003', 'EMP-003', 'Rajesh', 'Verma', '+91 98201 11003', 'rajesh@royalheritage.com', 350.00, 1.00, FALSE, FALSE),
('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'r0000000-0000-0000-0000-000000000004', 'EMP-004', 'Aanya', 'Sharma', '+91 98201 11004', 'aanya@royalheritage.com', 280.00, 1.50, TRUE, FALSE),
('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'r0000000-0000-0000-0000-000000000005', 'EMP-005', 'Karan', 'Singhania', '+91 98201 11005', 'karan@royalheritage.com', 300.00, 1.00, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, employee_id, branch_id, username, password_hash, role_code) VALUES
('u0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'manager', crypt('admin123', gen_salt('bf')), 'store_manager'),
('u0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'bridal_lead', crypt('bridal123', gen_salt('bf')), 'bridal_manager'),
('u0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'inventory', crypt('stock123', gen_salt('bf')), 'inventory_manager'),
('u0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'reception', crypt('recep123', gen_salt('bf')), 'receptionist'),
('u0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'cashier', crypt('cash123', gen_salt('bf')), 'cashier')
ON CONFLICT (id) DO NOTHING;

-- 4. CUSTOMERS
INSERT INTO customers (id, business_id, full_name, phone, email, address, city, loyalty_points, store_credit, wedding_date, skin_hair_notes, jewelry_preferences)
VALUES
('cu000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ananya Deshmukh', '+91 99887 76655', 'ananya.d@example.com', 'B-12 Sea View Apartments, Worli', 'Mumbai', 340, 2500.00, '2026-12-18', 'Sensitive dry skin, allergic to harsh astringents', 'Prefers Antique Temple gold and Emerald drops'),
('cu000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Rhea Malhotra', '+91 98111 22334', 'rhea.m@example.com', 'Flat 402, Green Acres, Bandra West', 'Mumbai', 120, 0.00, '2027-01-25', 'Combination skin, loves warm tones', 'Polki choker sets, Diamond solitaire rings'),
('cu000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Divya Patel', '+91 98700 99887', 'divya.patel@example.com', '14 Sunrise Villa, Juhu', 'Mumbai', 85, 0.00, NULL, 'Normal skin, curly hair styling specialist needed', 'Fashion alloy bridal accessories, matha patti')
ON CONFLICT (id) DO NOTHING;

-- 5. PRODUCT CATEGORIES
INSERT INTO product_categories (id, business_id, name, type, description, tax_rate) VALUES
('cat00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bridal Jewellery Sets', 'jewellery', 'Heavy bridal necklaces, chokers, raani haar, earrings', 3.00),
('cat00000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Fashion & Semi-Precious Jewellery', 'jewellery', 'Kundan, Meenakari, CZ bangles and hair jewelry', 3.00),
('cat00000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Bridal Couture & Veils', 'bridal_wear', 'Custom lehengas, bridal dupattas and hair veils', 5.00),
('cat00000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Beauty & Skin Care Retail', 'beauty_retail', 'High-end cosmetic products, setting sprays, serums', 18.00),
('cat00000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Salon & Bridal Makeover Services', 'beauty_service', 'Bridal HD makeup, hair updo, pre-bridal rituals', 18.00)
ON CONFLICT (id) DO NOTHING;

-- 6. PRODUCTS & INVENTORY
INSERT INTO products (id, business_id, category_id, sku, barcode, name, description, track_type, cost_price, sell_price, mrp, stock_on_hand, reorder_threshold, is_service)
VALUES
('p0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'cat00000-0000-0000-0000-000000000001', 'JWL-KUN-001', '8901234000011', 'Royal Kundan & Pearl Bridal Choker Set', '22K gold plated kundan necklace with matching jhumkas and maang tikka', 'serialized', 18500.00, 29999.00, 34999.00, 8, 3, FALSE),
('p0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'cat00000-0000-0000-0000-000000000001', 'JWL-POL-002', '8901234000028', 'Heritage Polki & Emerald Raani Haar', 'Double-tiered polki necklace with uncut emerald drop beads', 'serialized', 34000.00, 54500.00, 62000.00, 4, 2, FALSE),
('p0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'cat00000-0000-0000-0000-000000000002', 'JWL-BAN-003', '8901234000035', 'Antique Jadau Bridal Kada Bangles (Set of 2)', 'Handcrafted screw-lock jadau bangles with ruby stone accents', 'standard', 7200.00, 12800.00, 15000.00, 15, 4, FALSE),
('p0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'cat00000-0000-0000-0000-000000000002', 'JWL-MAT-004', '8901234000042', 'Crescent Pearl Bridal Matha Patti', 'Traditional bridal hair chain with floral pearls and green meena work', 'standard', 2800.00, 4999.00, 5999.00, 12, 3, FALSE),
('p0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'cat00000-0000-0000-0000-000000000004', 'COSM-FIX-005', '8901234000059', 'GlowLock Bridal Setting Mist 150ml', 'Ultra long-stay waterproof setting spray with hyaluronic acid', 'standard', 850.00, 1750.00, 1999.00, 40, 10, FALSE),
('p0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'cat00000-0000-0000-0000-000000000004', 'COSM-SER-006', '8901234000066', '24K Gold Elixir Radiance Serum 30ml', 'Pre-makeup prime oil with pure 24 karat gold flakes', 'standard', 1200.00, 2400.00, 2800.00, 22, 5, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 7. SERVICES (Salon & Bridal Services)
INSERT INTO services (id, business_id, category_id, name, description, duration_minutes, price, is_active)
VALUES
('s0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'cat00000-0000-0000-0000-000000000005', 'Signature HD Bridal Makeup & Hair', 'Full wedding day HD airbrush makeup, couture hair updo, saree/lehenga draping & jewelry placement', 180, 25000.00, TRUE),
('s0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'Bridal Trial Makeup & Styling Consultation', 'Full face look trial, hair trial, jewelry pairing consultation', 120, 6000.00, TRUE),
('s0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'Pre-Bridal Luxury Radiance Facial', 'Deep oxygenating cleanse, diamond microdermabrasion, gold mask', 90, 4500.00, TRUE),
('s0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'Engagement Glam Makeup & Waves', 'Soft glam party makeup with Hollywood waves and lash extensions', 90, 12000.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. SUPPLIERS
INSERT INTO suppliers (id, business_id, company_name, contact_person, phone, email, address, tax_number)
VALUES
('sup00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Jaipur Royal Jewels Crafting Co.', 'Mahesh Soni', '+91 94140 12345', 'info@jaipurjewels.example.com', 'Johari Bazaar, Jaipur, Rajasthan', '08AAACJ1234F1Z8'),
('sup00000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Aura Luxury Cosmetics Supplies', 'Deepa Nair', '+91 98222 33445', 'sales@auracosmetics.example.com', 'Andheri Industrial Estate, Mumbai', '27BBBCD5678G2Z1')
ON CONFLICT (id) DO NOTHING;

-- 9. BRIDAL PROJECTS
INSERT INTO bridal_projects (id, project_code, branch_id, customer_id, event_date, venue, package_name, lead_source, status, total_budget, deposit_required, deposit_paid, balance_due, notes)
VALUES
('bp000000-0000-0000-0000-000000000001', 'BP-2026-001', 'c0000000-0000-0000-0000-000000000001', 'cu000000-0000-0000-0000-000000000001', '2026-12-18', 'Taj Lands End, Bandra, Grand Ballroom', 'The Grand Maharani Bridal Royale', 'Instagram Inquiry', 'confirmed', 85000.00, 25000.00, 25000.00, 60000.00, 'Includes 3 events: Sangeet, Wedding Day & Reception. Jewelry rental package included.'),
('bp000000-0000-0000-0000-000000000002', 'BP-2026-002', 'c0000000-0000-0000-0000-000000000001', 'cu000000-0000-0000-0000-000000000002', '2027-01-25', 'The St. Regis Mumbai', 'Elegance Bridal Couture Package', 'Walk-in', 'trial_completed', 45000.00, 15000.00, 15000.00, 30000.00, 'Trial finished on Oct 20. Client approved soft dewy makeup look.')
ON CONFLICT (id) DO NOTHING;

-- 10. APPOINTMENTS
INSERT INTO appointments (id, appointment_number, branch_id, customer_id, service_id, staff_id, scheduled_start, scheduled_end, status, total_price, deposit_amount, notes)
VALUES
('ap000000-0000-0000-0000-000000000001', 'APT-20261026-01', 'c0000000-0000-0000-0000-000000000001', 'cu000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours 30 minutes', 'confirmed', 4500.00, 1000.00, 'Pre-bridal session 1 of 3'),
('ap000000-0000-0000-0000-000000000002', 'APT-20261026-02', 'c0000000-0000-0000-0000-000000000001', 'cu000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours 30 minutes', 'scheduled', 12000.00, 0.00, 'Engagement party booking')
ON CONFLICT (id) DO NOTHING;
