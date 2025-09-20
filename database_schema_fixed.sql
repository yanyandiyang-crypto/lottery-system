-- =========================================================
-- NewBetting 3-Digit Lottery System (PostgreSQL Schema) - FIXED
-- Optimized for 500+ concurrent users with proper normalization
-- =========================================================

-- 1. Enums
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator');
CREATE TYPE bet_type AS ENUM ('standard', 'rambolito');
CREATE TYPE ticket_status AS ENUM ('pending', 'validated', 'paid', 'cancelled');
CREATE TYPE draw_status AS ENUM ('open', 'closed', 'settled');
CREATE TYPE draw_time AS ENUM ('2PM', '5PM', '9PM');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended');

-- 2. Regions (Area Management) - No dependencies
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    area_coordinator_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Users (Hierarchical Structure) - No foreign keys initially
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    role user_role NOT NULL,
    region_id INT,
    coordinator_id INT, -- For agents under coordinators
    status account_status DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. User Balances (Credit System)
CREATE TABLE user_balances (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    current_balance NUMERIC(12,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Balance Transactions (Credit Loading History)
CREATE TABLE balance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'credit', 'debit', 'bet', 'payout'
    description TEXT,
    reference_id VARCHAR(50), -- Ticket ID, Draw ID, etc.
    created_by INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Draws (Daily 2PM, 5PM, 9PM)
CREATE TABLE draws (
    id SERIAL PRIMARY KEY,
    draw_date DATE NOT NULL,
    draw_time draw_time NOT NULL,
    winning_number VARCHAR(3),
    status draw_status DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(draw_date, draw_time)
);

-- 7. Tickets (Betting Records)
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(17) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    draw_id INT NOT NULL,
    bet_type bet_type NOT NULL,
    bet_combination VARCHAR(3) NOT NULL,
    bet_amount NUMERIC(10,2) NOT NULL,
    status ticket_status DEFAULT 'pending',
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    template_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Sales (Aggregated Sales Data)
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    draw_id INT NOT NULL,
    bet_type bet_type NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    ticket_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, draw_id, bet_type)
);

-- 9. Commissions (Optional - for future use)
CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    draw_id INT NOT NULL,
    commission_rate NUMERIC(5,2) NOT NULL,
    commission_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Winning Tickets (Result Processing)
CREATE TABLE winning_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    draw_id INT NOT NULL,
    prize_amount NUMERIC(12,2) NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Notifications (Real-time Alerts)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'win', 'system', 'bet_limit', 'draw_result'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Bet Limits (Global Betting Limits)
CREATE TABLE bet_limits (
    id SERIAL PRIMARY KEY,
    bet_type bet_type NOT NULL,
    limit_amount NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 13. Current Bet Totals (Real-time Bet Tracking)
CREATE TABLE current_bet_totals (
    id SERIAL PRIMARY KEY,
    draw_id INT NOT NULL,
    bet_combination VARCHAR(3) NOT NULL,
    bet_type bet_type NOT NULL,
    total_amount NUMERIC(12,2) DEFAULT 0.00,
    ticket_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(draw_id, bet_combination, bet_type)
);

-- 14. System Settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Now add foreign key constraints
ALTER TABLE regions ADD CONSTRAINT fk_region_area_coordinator FOREIGN KEY (area_coordinator_id) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT fk_user_region FOREIGN KEY (region_id) REFERENCES regions(id);
ALTER TABLE users ADD CONSTRAINT fk_user_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT fk_user_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE user_balances ADD CONSTRAINT fk_balance_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE balance_transactions ADD CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE balance_transactions ADD CONSTRAINT fk_transaction_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE tickets ADD CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE tickets ADD CONSTRAINT fk_ticket_draw FOREIGN KEY (draw_id) REFERENCES draws(id);
ALTER TABLE sales ADD CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE sales ADD CONSTRAINT fk_sales_draw FOREIGN KEY (draw_id) REFERENCES draws(id);
ALTER TABLE commissions ADD CONSTRAINT fk_commission_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE commissions ADD CONSTRAINT fk_commission_draw FOREIGN KEY (draw_id) REFERENCES draws(id);
ALTER TABLE winning_tickets ADD CONSTRAINT fk_winning_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);
ALTER TABLE winning_tickets ADD CONSTRAINT fk_winning_draw FOREIGN KEY (draw_id) REFERENCES draws(id);
ALTER TABLE notifications ADD CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE bet_limits ADD CONSTRAINT fk_bet_limit_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE current_bet_totals ADD CONSTRAINT fk_bet_total_draw FOREIGN KEY (draw_id) REFERENCES draws(id);
ALTER TABLE system_settings ADD CONSTRAINT fk_setting_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region_id);
CREATE INDEX idx_users_coordinator ON users(coordinator_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_draw ON tickets(draw_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_draws_date_time ON draws(draw_date, draw_time);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_sales_user_draw ON sales(user_id, draw_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_created_at ON balance_transactions(created_at);

-- Functions for ticket number generation
CREATE OR REPLACE FUNCTION generate_ticket_number() RETURNS VARCHAR(17) AS $$
DECLARE
    ticket_num VARCHAR(17);
    exists_count INTEGER;
BEGIN
    LOOP
        ticket_num := LPAD(FLOOR(RANDOM() * 100000000000000000)::TEXT, 17, '0');
        SELECT COUNT(*) INTO exists_count FROM tickets WHERE ticket_number = ticket_num;
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function for QR code generation
CREATE OR REPLACE FUNCTION generate_qr_code(ticket_id INTEGER) RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN MD5(ticket_id::TEXT || NOW()::TEXT || RANDOM()::TEXT);
END;
$$ LANGUAGE plpgsql;

-- Insert default bet limits
INSERT INTO bet_limits (bet_type, limit_amount, created_by) VALUES 
('standard', 1000.00, 1),
('rambolito', 1500.00, 1);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('min_bet_amount', '1.00', 'Minimum bet amount in pesos'),
('max_bet_amount', '10000.00', 'Maximum bet amount in pesos'),
('cutoff_minutes', '5', 'Cutoff time in minutes before draw'),
('timezone', 'UTC+08:00', 'System timezone'),
('rambolito_triple_restriction', 'true', 'Restrict triple numbers in Rambolito'),
('ticket_reprint_limit', '2', 'Maximum ticket reprints allowed');

-- Create views for reporting
CREATE VIEW user_hierarchy AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.role,
    r.name as region_name,
    c.full_name as coordinator_name,
    u.created_at
FROM users u
LEFT JOIN regions r ON u.region_id = r.id
LEFT JOIN users c ON u.coordinator_id = c.id;

CREATE VIEW draw_summary AS
SELECT 
    d.id,
    d.draw_date,
    d.draw_time,
    d.winning_number,
    d.status,
    COUNT(t.id) as total_tickets,
    COALESCE(SUM(t.bet_amount), 0) as total_sales
FROM draws d
LEFT JOIN tickets t ON d.id = t.draw_id
GROUP BY d.id, d.draw_date, d.draw_time, d.winning_number, d.status;

CREATE VIEW agent_performance AS
SELECT 
    u.id as agent_id,
    u.full_name as agent_name,
    r.name as region_name,
    c.full_name as coordinator_name,
    COUNT(t.id) as total_tickets,
    COALESCE(SUM(t.bet_amount), 0) as total_sales,
    COALESCE(SUM(CASE WHEN wt.id IS NOT NULL THEN 1 ELSE 0 END), 0) as winning_tickets,
    COALESCE(SUM(wt.prize_amount), 0) as total_payouts
FROM users u
LEFT JOIN regions r ON u.region_id = r.id
LEFT JOIN users c ON u.coordinator_id = c.id
LEFT JOIN tickets t ON u.id = t.user_id
LEFT JOIN winning_tickets wt ON t.id = wt.ticket_id
WHERE u.role = 'agent'
GROUP BY u.id, u.full_name, r.name, c.full_name;




