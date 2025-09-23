-- =========================================================
-- Security and Performance Improvements Migration
-- Safe to run - preserves all existing data
-- =========================================================

-- 1. Add transaction status to balance_transactions
ALTER TABLE balance_transactions 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'completed';

-- Update existing records to have 'completed' status
UPDATE balance_transactions SET status = 'completed' WHERE status IS NULL;

-- 2. Add login audit table
CREATE TABLE login_audit (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_login_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. Add duplicate prevention constraint for tickets
-- This prevents same user from betting same number/type in same draw
-- Note: bet_type might not exist in tickets table, so we'll skip this constraint for now
-- ALTER TABLE tickets 
-- ADD CONSTRAINT unique_user_draw_bet 
-- UNIQUE (user_id, draw_id, bet_combination);

-- 4. Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region_id);
CREATE INDEX IF NOT EXISTS idx_tickets_draw ON tickets(draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_draw ON tickets(user_id, draw_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created_at ON balance_transactions(status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_transactions_type ON balance_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_login_audit_user ON login_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_created_at ON login_audit(created_at);

-- 5. Add draw schedules table for flexibility (replaces ENUM usage)
CREATE TABLE draw_schedules (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'twoPM', 'fivePM', 'ninePM'
    draw_time TIME NOT NULL, -- 14:00, 17:00, 21:00
    display_name VARCHAR(100) NOT NULL, -- '2:00 PM', '5:00 PM', '9:00 PM'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default draw schedules
INSERT INTO draw_schedules (code, draw_time, display_name) VALUES 
('twoPM', '14:00:00', '2:00 PM'),
('fivePM', '17:00:00', '5:00 PM'),
('ninePM', '21:00:00', '9:00 PM');

-- 6. Add schedule_id to draws table (optional migration)
ALTER TABLE draws 
ADD COLUMN schedule_id INT REFERENCES draw_schedules(id);

-- Update existing draws to reference schedules
UPDATE draws SET schedule_id = (
    CASE 
        WHEN draw_time = 'twoPM' THEN (SELECT id FROM draw_schedules WHERE code = 'twoPM')
        WHEN draw_time = 'fivePM' THEN (SELECT id FROM draw_schedules WHERE code = 'fivePM')
        WHEN draw_time = 'ninePM' THEN (SELECT id FROM draw_schedules WHERE code = 'ninePM')
    END
);

-- 7. Add bet limits per user per draw
CREATE TABLE user_bet_limits (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    draw_id INT NOT NULL,
    bet_type VARCHAR(20) NOT NULL,
    max_amount NUMERIC(12,2) DEFAULT 1000.00,
    current_amount NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_user_bet_limit_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_bet_limit_draw FOREIGN KEY (draw_id) REFERENCES draws(id),
    CONSTRAINT unique_user_draw_bet_limit UNIQUE (user_id, draw_id, bet_type)
);

-- 8. Add audit trail for critical operations
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id INT NOT NULL,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for audit log
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- 9. Add comments for documentation
COMMENT ON COLUMN balance_transactions.status IS 'Transaction status: pending, completed, failed, cancelled';
COMMENT ON TABLE login_audit IS 'Audit trail for user login attempts';
COMMENT ON TABLE draw_schedules IS 'Flexible draw time configuration (replaces ENUM)';
COMMENT ON TABLE user_bet_limits IS 'Per-user betting limits per draw';
COMMENT ON TABLE audit_log IS 'Audit trail for critical data changes';

-- =========================================================
-- Functions for Transaction Safety
-- =========================================================

-- Function to safely deduct balance with transaction
CREATE OR REPLACE FUNCTION deduct_user_balance(
    p_user_id INT,
    p_amount NUMERIC(12,2),
    p_description TEXT,
    p_processed_by INT
) RETURNS BOOLEAN AS $$
DECLARE
    current_bal NUMERIC(12,2);
    transaction_id INT;
BEGIN
    -- Start transaction
    BEGIN
        -- Lock user balance row for update
        SELECT current_balance INTO current_bal
        FROM user_balances 
        WHERE user_id = p_user_id 
        FOR UPDATE;
        
        -- Check if sufficient balance
        IF current_bal < p_amount THEN
            RETURN FALSE;
        END IF;
        
        -- Insert transaction record with pending status
        INSERT INTO balance_transactions (user_id, amount, transaction_type, description, processed_by, status)
        VALUES (p_user_id, p_amount, 'use', p_description, p_processed_by, 'pending')
        RETURNING id INTO transaction_id;
        
        -- Update balance
        UPDATE user_balances 
        SET current_balance = current_balance - p_amount,
            total_used = total_used + p_amount,
            last_updated = NOW()
        WHERE user_id = p_user_id;
        
        -- Mark transaction as completed
        UPDATE balance_transactions 
        SET status = 'completed'
        WHERE id = transaction_id;
        
        RETURN TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        -- Mark transaction as failed if it exists
        IF transaction_id IS NOT NULL THEN
            UPDATE balance_transactions 
            SET status = 'failed'
            WHERE id = transaction_id;
        END IF;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail(
    p_table_name VARCHAR(50),
    p_record_id INT,
    p_operation VARCHAR(20),
    p_old_values JSONB,
    p_new_values JSONB,
    p_user_id INT,
    p_ip_address INET
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, operation, old_values, new_values, user_id, ip_address)
    VALUES (p_table_name, p_record_id, p_operation, p_old_values, p_new_values, p_user_id, p_ip_address);
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- Updated Triggers for Better Safety
-- =========================================================

-- Drop old trigger and function
DROP TRIGGER IF EXISTS trigger_balance_update ON tickets;
DROP FUNCTION IF EXISTS update_user_balance();

-- New safer balance update function
CREATE OR REPLACE FUNCTION safe_update_user_balance()
RETURNS TRIGGER AS $$
DECLARE
    success BOOLEAN;
BEGIN
    -- Use the safe deduction function
    success := deduct_user_balance(
        NEW.user_id, 
        NEW.total_amount, 
        'Ticket purchase: ' || NEW.ticket_number, 
        NEW.user_id
    );
    
    -- If deduction failed, prevent ticket creation
    IF NOT success THEN
        RAISE EXCEPTION 'Insufficient balance for ticket creation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER trigger_safe_balance_update
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION safe_update_user_balance();

-- =========================================================
-- Verification Queries
-- =========================================================

-- Verify all indexes were created
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('users', 'tickets', 'balance_transactions', 'login_audit', 'audit_log')
ORDER BY tablename, indexname;

-- Verify constraints were added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('tickets', 'balance_transactions')
);

-- Verify new tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('login_audit', 'draw_schedules', 'user_bet_limits', 'audit_log')
ORDER BY table_name;

