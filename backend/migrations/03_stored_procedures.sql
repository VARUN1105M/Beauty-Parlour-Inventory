-- ====================================================================
-- 03_STORED_PROCEDURES.SQL
-- Atomic Transactions, Idempotent Operations & Stock Consistency
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ATOMIC POS SALE TRANSACTION WITH IDEMPOTENCY
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_pos_sale(
    p_branch_id UUID,
    p_cashier_id UUID,
    p_customer_id UUID,
    p_items JSONB,              -- Array of {product_id, qty, unit_price, discount, staff_id, inventory_unit_id}
    p_payment_method payment_method_type,
    p_payment_amount NUMERIC(12, 2),
    p_transaction_ref VARCHAR(100),
    p_idempotency_key UUID
)
RETURNS JSONB AS $$
DECLARE
    v_existing_sale RECORD;
    v_sale_id UUID;
    v_invoice_number VARCHAR(60);
    v_subtotal NUMERIC(12, 2) := 0.00;
    v_total_discount NUMERIC(12, 2) := 0.00;
    v_tax_amount NUMERIC(12, 2) := 0.00;
    v_total_amount NUMERIC(12, 2) := 0.00;
    v_item JSONB;
    v_prod RECORD;
    v_current_stock INT;
    v_line_subtotal NUMERIC(12, 2);
    v_line_tax NUMERIC(12, 2);
    v_line_total NUMERIC(12, 2);
    v_unit_id UUID;
BEGIN
    -- 1. Check Idempotency: If already processed, return existing sale details
    SELECT id, invoice_number, total_amount INTO v_existing_sale
    FROM sales
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'status', 'idempotent_duplicate',
            'sale_id', v_existing_sale.id,
            'invoice_number', v_existing_sale.invoice_number,
            'total_amount', v_existing_sale.total_amount,
            'message', 'Sale has already been processed with this idempotency key.'
        );
    END IF;

    -- Generate Invoice Number: INV-YYYYMMDD-XXXX
    v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- 2. Verify stock availability and lock products
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT id, name, stock_on_hand, is_service, sell_price INTO v_prod
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE; -- Explicit Row Lock for Concurrency Safety

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', (v_item->>'product_id');
        END IF;

        IF NOT v_prod.is_service AND v_prod.stock_on_hand < (v_item->>'qty')::INT THEN
            RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %',
                v_prod.name, v_prod.stock_on_hand, (v_item->>'qty')::INT;
        END IF;

        -- Calculate line figures
        v_line_subtotal := ((v_item->>'qty')::INT * (v_item->>'unit_price')::NUMERIC(12, 2)) - COALESCE((v_item->>'discount')::NUMERIC(12, 2), 0.00);
        v_line_tax := ROUND(v_line_subtotal * 0.03, 2); -- 3% Jewellery Tax default
        v_line_total := v_line_subtotal + v_line_tax;

        v_subtotal := v_subtotal + ((v_item->>'qty')::INT * (v_item->>'unit_price')::NUMERIC(12, 2));
        v_total_discount := v_total_discount + COALESCE((v_item->>'discount')::NUMERIC(12, 2), 0.00);
        v_tax_amount := v_tax_amount + v_line_tax;
        v_total_amount := v_total_amount + v_line_total;
    END LOOP;

    -- 3. Insert Sale Header
    INSERT INTO sales (
        invoice_number,
        branch_id,
        customer_id,
        cashier_id,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        payment_status,
        idempotency_key
    ) VALUES (
        v_invoice_number,
        p_branch_id,
        p_customer_id,
        p_cashier_id,
        v_subtotal,
        v_total_discount,
        v_tax_amount,
        v_total_amount,
        'paid',
        p_idempotency_key
    ) RETURNING id INTO v_sale_id;

    -- 4. Insert Sale Lines & Deduct Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT stock_on_hand, is_service INTO v_current_stock, v_prod.is_service
        FROM products WHERE id = (v_item->>'product_id')::UUID;

        v_line_subtotal := ((v_item->>'qty')::INT * (v_item->>'unit_price')::NUMERIC(12, 2)) - COALESCE((v_item->>'discount')::NUMERIC(12, 2), 0.00);
        v_line_tax := ROUND(v_line_subtotal * 0.03, 2);
        v_line_total := v_line_subtotal + v_line_tax;

        IF (v_item ? 'inventory_unit_id') AND (v_item->>'inventory_unit_id') IS NOT NULL THEN
            v_unit_id := (v_item->>'inventory_unit_id')::UUID;
        ELSE
            v_unit_id := NULL;
        END IF;

        INSERT INTO sale_lines (
            sale_id,
            product_id,
            inventory_unit_id,
            staff_id,
            qty,
            unit_price,
            discount,
            tax_rate,
            line_total
        ) VALUES (
            v_sale_id,
            (v_item->>'product_id')::UUID,
            v_unit_id,
            CASE WHEN (v_item ? 'staff_id') THEN (v_item->>'staff_id')::UUID ELSE NULL END,
            (v_item->>'qty')::INT,
            (v_item->>'unit_price')::NUMERIC(12, 2),
            COALESCE((v_item->>'discount')::NUMERIC(12, 2), 0.00),
            3.00,
            v_line_total
        );

        -- Decrement physical product stock for physical goods
        IF NOT v_prod.is_service THEN
            UPDATE products
            SET stock_on_hand = stock_on_hand - (v_item->>'qty')::INT,
                updated_at = NOW()
            WHERE id = (v_item->>'product_id')::UUID;

            -- Log Stock Movement
            INSERT INTO stock_movements (
                product_id,
                inventory_unit_id,
                branch_id,
                change_qty,
                previous_stock,
                new_stock,
                reason,
                ref_type,
                ref_id,
                notes,
                performed_by
            ) VALUES (
                (v_item->>'product_id')::UUID,
                v_unit_id,
                p_branch_id,
                -(v_item->>'qty')::INT,
                v_current_stock,
                v_current_stock - (v_item->>'qty')::INT,
                'sale',
                'sale',
                v_sale_id,
                'Sold in invoice: ' || v_invoice_number,
                p_cashier_id
            );

            -- Mark inventory unit as sold if tracked
            IF v_unit_id IS NOT NULL THEN
                UPDATE inventory_units
                SET status = 'sold'
                WHERE id = v_unit_id;
            END IF;
        END IF;
    END LOOP;

    -- 5. Record Payment
    INSERT INTO payments (
        sale_id,
        customer_id,
        branch_id,
        amount,
        method,
        transaction_ref,
        processed_by,
        idempotency_key
    ) VALUES (
        v_sale_id,
        p_customer_id,
        p_branch_id,
        p_payment_amount,
        p_payment_method,
        p_transaction_ref,
        p_cashier_id,
        p_idempotency_key
    );

    -- 6. Award Loyalty Points (1 point per ₹100 spent)
    IF p_customer_id IS NOT NULL THEN
        UPDATE customers
        SET loyalty_points = loyalty_points + FLOOR(v_total_amount / 100)::INT,
            updated_at = NOW()
        WHERE id = p_customer_id;
    END IF;

    -- Return full receipt metadata
    RETURN jsonb_build_object(
        'status', 'success',
        'sale_id', v_sale_id,
        'invoice_number', v_invoice_number,
        'subtotal', v_subtotal,
        'tax_amount', v_tax_amount,
        'total_amount', v_total_amount,
        'payment_method', p_payment_method,
        'paid_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- 2. ATOMIC SALE RETURN & RESTOCK TRANSACTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_sale_return(
    p_sale_id UUID,
    p_branch_id UUID,
    p_manager_id UUID,
    p_refund_method payment_method_type,
    p_reason TEXT,
    p_items JSONB,              -- Array of {sale_line_id, product_id, qty, refund_unit_price, restock}
    p_idempotency_key UUID
)
RETURNS JSONB AS $$
DECLARE
    v_existing_return RECORD;
    v_return_id UUID;
    v_return_number VARCHAR(60);
    v_total_refund NUMERIC(12, 2) := 0.00;
    v_item JSONB;
    v_current_stock INT;
    v_customer_id UUID;
BEGIN
    -- Idempotency check
    SELECT id, return_number, refund_amount INTO v_existing_return
    FROM returns
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'status', 'idempotent_duplicate',
            'return_id', v_existing_return.id,
            'return_number', v_existing_return.return_number,
            'refund_amount', v_existing_return.refund_amount
        );
    END IF;

    SELECT customer_id INTO v_customer_id FROM sales WHERE id = p_sale_id;

    v_return_number := 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Compute refund total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_refund := v_total_refund + ((v_item->>'qty')::INT * (v_item->>'refund_unit_price')::NUMERIC(12, 2));
    END LOOP;

    -- Create Return Record
    INSERT INTO returns (
        return_number,
        original_sale_id,
        branch_id,
        customer_id,
        reason,
        refund_amount,
        refund_method,
        approved_by,
        idempotency_key
    ) VALUES (
        v_return_number,
        p_sale_id,
        p_branch_id,
        v_customer_id,
        p_reason,
        v_total_refund,
        p_refund_method,
        p_manager_id,
        p_idempotency_key
    ) RETURNING id INTO v_return_id;

    -- Process lines and restock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO return_lines (
            return_id,
            sale_line_id,
            product_id,
            qty,
            refund_unit_price,
            restocked
        ) VALUES (
            v_return_id,
            (v_item->>'sale_line_id')::UUID,
            (v_item->>'product_id')::UUID,
            (v_item->>'qty')::INT,
            (v_item->>'refund_unit_price')::NUMERIC(12, 2),
            COALESCE((v_item->>'restock')::BOOLEAN, TRUE)
        );

        -- Restock if requested
        IF COALESCE((v_item->>'restock')::BOOLEAN, TRUE) THEN
            SELECT stock_on_hand INTO v_current_stock
            FROM products WHERE id = (v_item->>'product_id')::UUID;

            UPDATE products
            SET stock_on_hand = stock_on_hand + (v_item->>'qty')::INT,
                updated_at = NOW()
            WHERE id = (v_item->>'product_id')::UUID;

            INSERT INTO stock_movements (
                product_id,
                branch_id,
                change_qty,
                previous_stock,
                new_stock,
                reason,
                ref_type,
                ref_id,
                notes,
                performed_by
            ) VALUES (
                (v_item->>'product_id')::UUID,
                p_branch_id,
                (v_item->>'qty')::INT,
                v_current_stock,
                v_current_stock + (v_item->>'qty')::INT,
                'customer_return',
                'return',
                v_return_id,
                'Restocked from return ' || v_return_number,
                p_manager_id
            );
        END IF;
    END LOOP;

    -- Update original sale status
    UPDATE sales
    SET status = 'refunded',
        payment_status = 'refunded',
        updated_at = NOW()
    WHERE id = p_sale_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'return_id', v_return_id,
        'return_number', v_return_number,
        'refund_amount', v_total_refund,
        'refund_method', p_refund_method
    );
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- 3. GOODS RECEIPT TRANSACTION (Purchasing Stock Intake)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_goods_receipt(
    p_branch_id UUID,
    p_supplier_id UUID,
    p_po_id UUID,
    p_invoice_ref VARCHAR(100),
    p_received_by UUID,
    p_items JSONB,              -- Array of {product_id, received_qty, unit_cost}
    p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_receipt_id UUID;
    v_receipt_number VARCHAR(60);
    v_item JSONB;
    v_total_amount NUMERIC(12, 2) := 0.00;
    v_current_stock INT;
BEGIN
    v_receipt_number := 'GRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_amount := v_total_amount + ((v_item->>'received_qty')::INT * (v_item->>'unit_cost')::NUMERIC(12, 2));
    END LOOP;

    INSERT INTO goods_receipts (
        receipt_number,
        po_id,
        branch_id,
        supplier_id,
        supplier_invoice_ref,
        total_received_amount,
        received_by,
        notes
    ) VALUES (
        v_receipt_number,
        p_po_id,
        p_branch_id,
        p_supplier_id,
        p_invoice_ref,
        v_total_amount,
        p_received_by,
        p_notes
    ) RETURNING id INTO v_receipt_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO goods_receipt_lines (
            goods_receipt_id,
            product_id,
            received_qty,
            unit_cost,
            line_total
        ) VALUES (
            v_receipt_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'received_qty')::INT,
            (v_item->>'unit_cost')::NUMERIC(12, 2),
            ((v_item->>'received_qty')::INT * (v_item->>'unit_cost')::NUMERIC(12, 2))
        );

        -- Increase product stock
        SELECT stock_on_hand INTO v_current_stock
        FROM products WHERE id = (v_item->>'product_id')::UUID;

        UPDATE products
        SET stock_on_hand = stock_on_hand + (v_item->>'received_qty')::INT,
            cost_price = (v_item->>'unit_cost')::NUMERIC(12, 2),
            updated_at = NOW()
        WHERE id = (v_item->>'product_id')::UUID;

        -- Record movement
        INSERT INTO stock_movements (
            product_id,
            branch_id,
            change_qty,
            previous_stock,
            new_stock,
            reason,
            ref_type,
            ref_id,
            notes,
            performed_by
        ) VALUES (
            (v_item->>'product_id')::UUID,
            p_branch_id,
            (v_item->>'received_qty')::INT,
            v_current_stock,
            v_current_stock + (v_item->>'received_qty')::INT,
            'purchase_receipt',
            'goods_receipt',
            v_receipt_id,
            'Received via ' || v_receipt_number,
            p_received_by
        );

        -- Update PO line received_qty if PO attached
        IF p_po_id IS NOT NULL THEN
            UPDATE purchase_order_lines
            SET received_qty = received_qty + (v_item->>'received_qty')::INT
            WHERE po_id = p_po_id AND product_id = (v_item->>'product_id')::UUID;
        END IF;
    END LOOP;

    -- Update PO status if present
    IF p_po_id IS NOT NULL THEN
        UPDATE purchase_orders
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = p_po_id;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'goods_receipt_id', v_receipt_id,
        'receipt_number', v_receipt_number,
        'total_received_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql;
