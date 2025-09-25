-- =========================================================
-- NewBetting 3-Digit Lottery System (PostgreSQL Schema)
-- Optimized for 500+ concurrent users with proper normalization
-- =========================================================

-- 1. Enums
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator');
CREATE TYPE bet_type AS ENUM ('standard', 'rambolito');
CREATE TYPE ticket_status AS ENUM ('pending', 'validated', 'paid', 'cancelled');
CREATE TYPE draw_status AS ENUM ('open', 'closed', 'settled');
CREATE TYPE draw_time AS ENUM ('2PM', '5PM', '9PM');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended');

-- 2. Regions (Area Management)
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    area_coordinator_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_region_area_coordinator FOREIGN KEY (area_coordinator_id) REFERENCES users(id)
);

-- 3. Users (Hierarchical Structure)
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
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_user_region FOREIGN KEY (region_id) REFERENCES regions(id),
    CONSTRAINT fk_user_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id),
    CONSTRAINT fk_user_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 4. User Balances (Credit System)
CREATE TABLE user_balances (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    current_balance NUMERIC(12,2) DEFAULT 0.00,
    total_loaded NUMERIC(12,2) DEFAULT 0.00,
    total_used NUMERIC(12,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_balance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_balance UNIQUE (user_id)
);

-- 5. Balance Transactions (Load History)
CREATE TABLE balance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'load', 'use', 'refund'
    reference_number VARCHAR(50),
    description TEXT,
    processed_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_transaction_processed_by FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- 6. Draws (Auto-scheduled for 2PM, 5PM, 9PM daily)
CREATE TABLE draws (
    id SERIAL PRIMARY KEY,
    draw_date DATE NOT NULL,
    draw_time draw_time NOT NULL,
    draw_datetime TIMESTAMP NOT NULL,
    winning_number CHAR(3),
    status draw_status DEFAULT 'open',
    cutoff_time TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    settled_at TIMESTAMP,
    
    CONSTRAINT fk_draw_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT unique_draw_datetime UNIQUE (draw_date, draw_time)
);

-- 7. Bet Limits (Per draw, per number)
CREATE TABLE bet_limits (
    id SERIAL PRIMARY KEY,
    bet_type bet_type NOT NULL,
    limit_amount NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_limit_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 8. Current Bet Totals (Track sold amounts per number per draw)
CREATE TABLE current_bet_totals (
    id SERIAL PRIMARY KEY,
    draw_id INT NOT NULL,
    bet_type bet_type NOT NULL,
    bet_digits CHAR(3) NOT NULL,
    total_amount NUMERIC(12,2) DEFAULT 0.00,
    is_sold_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_bet_total_draw FOREIGN KEY (draw_id) REFERENCES draws(id),
    CONSTRAINT unique_draw_bet_type_digits UNIQUE (draw_id, bet_type, bet_digits)
);

-- 9. Tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    bet_type bet_type NOT NULL,
    bet_digits CHAR(3) NOT NULL,
    bet_amount NUMERIC(10,2) NOT NULL,
    ticket_total_amount NUMERIC(10,2) NOT NULL,
    sequence_letter CHAR(1) NOT NULL, -- A, B, C, D, E, F
    qr_code VARCHAR(255) NOT NULL,
    agent_id INT NOT NULL,
    draw_id INT NOT NULL,
    status ticket_status DEFAULT 'pending',
    is_winner BOOLEAN DEFAULT FALSE,
    winning_prize NUMERIC(10,2) DEFAULT 0.00,
    template_id INT,
    created_at TIMESTAMP DEFAULT NOW(),
    printed_at TIMESTAMP,
    validated_at TIMESTAMP,
    
    CONSTRAINT fk_ticket_agent FOREIGN KEY (agent_id) REFERENCES users(id),
    CONSTRAINT fk_ticket_draw FOREIGN KEY (draw_id) REFERENCES draws(id),
    CONSTRAINT fk_ticket_template FOREIGN KEY (template_id) REFERENCES ticket_templates(id)
);

-- 10. Ticket Templates
CREATE TABLE ticket_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    template_data JSONB NOT NULL, -- Store template design as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_template_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 11. Sales
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    agent_id INT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    commission NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_sale_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    CONSTRAINT fk_sale_agent FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- 12. Winning Tickets (Separate table for better performance)
CREATE TABLE winning_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    draw_id INT NOT NULL,
    agent_id INT NOT NULL,
    coordinator_id INT NOT NULL,
    bet_type bet_type NOT NULL,
    bet_digits CHAR(3) NOT NULL,
    winning_prize NUMERIC(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_winning_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    CONSTRAINT fk_winning_draw FOREIGN KEY (draw_id) REFERENCES draws(id),
    CONSTRAINT fk_winning_agent FOREIGN KEY (agent_id) REFERENCES users(id),
    CONSTRAINT fk_winning_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id)
);

-- 13. Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'winning', 'system', 'balance'
    is_read BOOLEAN DEFAULT FALSE,
    related_ticket_id INT,
    related_draw_id INT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notification_ticket FOREIGN KEY (related_ticket_id) REFERENCES tickets(id),
    CONSTRAINT fk_notification_draw FOREIGN KEY (related_draw_id) REFERENCES draws(id)
);

-- 14. System Settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_setting_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- =========================================================
-- Indexes for Performance (Optimized for 500+ users)
-- =========================================================

-- User indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region_id);
CREATE INDEX idx_users_coordinator ON users(coordinator_id);
CREATE INDEX idx_users_status ON users(status);

-- Ticket indexes
CREATE INDEX idx_tickets_agent ON tickets(agent_id);
CREATE INDEX idx_tickets_draw ON tickets(draw_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_bet_digits ON tickets(bet_digits);
CREATE INDEX idx_tickets_sequence ON tickets(sequence_letter);

-- Sales indexes
CREATE INDEX idx_sales_agent ON sales(agent_id);
CREATE INDEX idx_sales_ticket ON sales(ticket_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- Draw indexes
CREATE INDEX idx_draws_date ON draws(draw_date);
CREATE INDEX idx_draws_datetime ON draws(draw_datetime);
CREATE INDEX idx_draws_status ON draws(status);

-- Balance indexes
CREATE INDEX idx_balance_user ON user_balances(user_id);
CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_date ON balance_transactions(created_at);

-- Winning tickets indexes
CREATE INDEX idx_winning_tickets_draw ON winning_tickets(draw_id);
CREATE INDEX idx_winning_tickets_agent ON winning_tickets(agent_id);
CREATE INDEX idx_winning_tickets_coordinator ON winning_tickets(coordinator_id);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Bet totals indexes
CREATE INDEX idx_bet_totals_draw ON current_bet_totals(draw_id);
CREATE INDEX idx_bet_totals_digits ON current_bet_totals(bet_digits);

-- =========================================================
-- Functions and Triggers
-- =========================================================

-- Function to update ticket sequence letters
CREATE OR REPLACE FUNCTION update_ticket_sequence()
RETURNS TRIGGER AS $$
DECLARE
    sequence_letters CHAR[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F'];
    current_sequence INT;
BEGIN
    -- Get current sequence count for this agent and draw
    SELECT COUNT(*) INTO current_sequence 
    FROM tickets 
    WHERE agent_id = NEW.agent_id AND draw_id = NEW.draw_id;
    
    -- Set sequence letter based on count
    NEW.sequence_letter := sequence_letters[((current_sequence % 6) + 1)];
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket sequence
CREATE TRIGGER trigger_ticket_sequence
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_sequence();

-- Function to update balance after ticket creation
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user balance when ticket is created
    UPDATE user_balances 
    SET current_balance = current_balance - NEW.bet_amount,
        total_used = total_used + NEW.bet_amount,
        last_updated = NOW()
    WHERE user_id = NEW.agent_id;
    
    -- Insert balance transaction record
    INSERT INTO balance_transactions (user_id, amount, transaction_type, description, processed_by)
    VALUES (NEW.agent_id, NEW.bet_amount, 'use', 'Ticket purchase: ' || NEW.ticket_number, NEW.agent_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for balance update
CREATE TRIGGER trigger_balance_update
    AFTER INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_balance();

-- =========================================================
-- Initial Data Setup
-- =========================================================

-- Insert default bet limits
INSERT INTO bet_limits (bet_type, limit_amount, created_by) VALUES 
('standard', 1000.00, 1),
('rambolito', 1500.00, 1);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('min_bet_amount', '1.00', 'Minimum bet amount in pesos'),
('standard_prize', '4500.00', 'Standard bet winning prize'),
('rambolito_prize_6', '750.00', 'Rambolito prize for 6 possible combinations'),
('rambolito_prize_3', '1500.00', 'Rambolito prize for 3 possible combinations'),
('timezone', 'UTC+08:00', 'System timezone'),
('cutoff_minutes', '5', 'Cutoff time in minutes before draw');

-- =========================================================
-- Views for Reporting
-- =========================================================

-- Sales Summary View
CREATE VIEW sales_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.role,
    r.name as region_name,
    c.full_name as coordinator_name,
    SUM(s.amount) as gross_sales,
    SUM(CASE WHEN wt.id IS NOT NULL THEN wt.winning_prize ELSE 0 END) as total_winnings,
    SUM(s.amount) - SUM(CASE WHEN wt.id IS NOT NULL THEN wt.winning_prize ELSE 0 END) as net_sales
FROM users u
LEFT JOIN regions r ON u.region_id = r.id
LEFT JOIN users c ON u.coordinator_id = c.id
LEFT JOIN sales s ON u.id = s.agent_id
LEFT JOIN winning_tickets wt ON s.ticket_id = wt.ticket_id
WHERE u.role IN ('agent', 'coordinator', 'area_coordinator')
GROUP BY u.id, u.full_name, u.role, r.name, c.full_name;

-- Daily Draw Summary View
CREATE VIEW daily_draw_summary AS
SELECT 
    d.id as draw_id,
    d.draw_date,
    d.draw_time,
    d.winning_number,
    COUNT(t.id) as total_tickets,
    SUM(t.bet_amount) as total_sales,
    COUNT(wt.id) as winning_tickets,
    SUM(wt.winning_prize) as total_payouts
FROM draws d
LEFT JOIN tickets t ON d.id = t.draw_id
LEFT JOIN winning_tickets wt ON t.id = wt.ticket_id
GROUP BY d.id, d.draw_date, d.draw_time, d.winning_number;

-- =========================================================
-- Comments for Documentation
-- =========================================================

COMMENT ON TABLE users IS 'User accounts with hierarchical structure (SuperAdmin > Admin > AreaCoordinator > Coordinator > Agent)';
COMMENT ON TABLE user_balances IS 'Credit system for AreaCoordinators, Coordinators, and Agents';
COMMENT ON TABLE draws IS 'Auto-scheduled draws for 2PM, 5PM, 9PM daily';
COMMENT ON TABLE tickets IS 'Betting tickets with QR codes and multiple templates';
COMMENT ON TABLE bet_limits IS 'Per-draw betting limits to prevent over-selling numbers';
COMMENT ON TABLE current_bet_totals IS 'Real-time tracking of sold amounts per number per draw';
COMMENT ON TABLE winning_tickets IS 'Optimized table for winning ticket queries';
COMMENT ON TABLE notifications IS 'Real-time notifications for winners and system updates';

-- =========================================================
-- Security and Performance Notes
-- =========================================================

-- The schema is designed for:
-- 1. 500+ concurrent users
-- 2. Proper normalization to avoid data redundancy
-- 3. Hierarchical user management
-- 4. Real-time bet limit tracking
-- 5. Efficient reporting queries
-- 6. Mobile POS compatibility
-- 7. UTC+08:00 timezone support
-- 8. Scalable architecture for microservices


