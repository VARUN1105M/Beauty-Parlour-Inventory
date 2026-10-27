-- ====================================================================
-- 04_AUDIT_TRIGGERS.SQL
-- Immutable Financial & Stock Audit Trail
-- ====================================================================

CREATE OR REPLACE FUNCTION log_record_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_record_id UUID;
BEGIN
    -- Extract user ID if available in session
    BEGIN
        v_user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id;
        INSERT INTO audit_logs (event_type, table_name, record_id, user_id, before_state, after_state)
        VALUES ('DELETE', TG_TABLE_NAME, v_record_id, v_user_id, to_jsonb(OLD), NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id;
        INSERT INTO audit_logs (event_type, table_name, record_id, user_id, before_state, after_state)
        VALUES ('UPDATE', TG_TABLE_NAME, v_record_id, v_user_id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id;
        INSERT INTO audit_logs (event_type, table_name, record_id, user_id, before_state, after_state)
        VALUES ('INSERT', TG_TABLE_NAME, v_record_id, v_user_id, NULL, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to sensitive tables
DROP TRIGGER IF EXISTS trg_audit_sales ON sales;
CREATE TRIGGER trg_audit_sales
AFTER INSERT OR UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION log_record_audit_trail();

DROP TRIGGER IF EXISTS trg_audit_returns ON returns;
CREATE TRIGGER trg_audit_returns
AFTER INSERT OR UPDATE ON returns
FOR EACH ROW EXECUTE FUNCTION log_record_audit_trail();

DROP TRIGGER IF EXISTS trg_audit_payments ON payments;
CREATE TRIGGER trg_audit_payments
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION log_record_audit_trail();

DROP TRIGGER IF EXISTS trg_audit_products ON products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_record_audit_trail();
