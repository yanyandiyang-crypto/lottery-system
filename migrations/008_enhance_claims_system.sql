-- Migration 008: Enhance Claims System
-- Run this in pgAdmin4 Query Tool after 007_add_ticket_statuses.sql

-- Add missing columns to tickets table if they don't exist
-- (These might already exist from previous migrations, so we use IF NOT EXISTS)

DO $$
BEGIN
    -- Add approval-related columns to tickets table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'approval_requested_at') THEN
        ALTER TABLE tickets ADD COLUMN approval_requested_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'approved_by') THEN
        ALTER TABLE tickets ADD COLUMN approved_by INTEGER REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'approval_notes') THEN
        ALTER TABLE tickets ADD COLUMN approval_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'prize_amount') THEN
        ALTER TABLE tickets ADD COLUMN prize_amount DECIMAL(10,2);
    END IF;
    
    -- Add claimer information columns (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'claimer_name') THEN
        ALTER TABLE tickets ADD COLUMN claimer_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'claimer_phone') THEN
        ALTER TABLE tickets ADD COLUMN claimer_phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'claimer_address') THEN
        ALTER TABLE tickets ADD COLUMN claimer_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'claimed_at') THEN
        ALTER TABLE tickets ADD COLUMN claimed_at TIMESTAMP;
    END IF;
END $$;

-- Ensure claims_audit table exists with all required columns
CREATE TABLE IF NOT EXISTS claims_audit (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'CLAIM_REQUESTED', 'APPROVED', 'REJECTED'
    performed_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    claimer_name VARCHAR(255),
    claimer_phone VARCHAR(50),
    claimer_address TEXT,
    prize_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to claims_audit if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims_audit' AND column_name = 'claimer_name') THEN
        ALTER TABLE claims_audit ADD COLUMN claimer_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims_audit' AND column_name = 'claimer_phone') THEN
        ALTER TABLE claims_audit ADD COLUMN claimer_phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims_audit' AND column_name = 'claimer_address') THEN
        ALTER TABLE claims_audit ADD COLUMN claimer_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims_audit' AND column_name = 'prize_amount') THEN
        ALTER TABLE claims_audit ADD COLUMN prize_amount DECIMAL(10,2);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_approval_requested_at ON tickets(approval_requested_at);
CREATE INDEX IF NOT EXISTS idx_tickets_approved_by ON tickets(approved_by);
CREATE INDEX IF NOT EXISTS idx_tickets_claimed_at ON tickets(claimed_at);
CREATE INDEX IF NOT EXISTS idx_claims_audit_ticket_id ON claims_audit(ticket_id);
CREATE INDEX IF NOT EXISTS idx_claims_audit_action ON claims_audit(action);
CREATE INDEX IF NOT EXISTS idx_claims_audit_performed_by ON claims_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_claims_audit_created_at ON claims_audit(created_at);

-- Add constraints for data integrity
ALTER TABLE claims_audit 
ADD CONSTRAINT chk_claims_audit_action 
CHECK (action IN ('CLAIM_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'));

-- Add comments for documentation
COMMENT ON TABLE claims_audit IS 'Audit trail for all ticket claim operations';
COMMENT ON COLUMN tickets.approval_requested_at IS 'Timestamp when claim approval was requested';
COMMENT ON COLUMN tickets.approved_by IS 'User ID who approved/rejected the claim';
COMMENT ON COLUMN tickets.approval_notes IS 'Notes from the approval process';
COMMENT ON COLUMN tickets.prize_amount IS 'Calculated prize amount for winning tickets';
COMMENT ON COLUMN tickets.claimer_name IS 'Name of person claiming the ticket';
COMMENT ON COLUMN tickets.claimer_phone IS 'Phone number of claimer';
COMMENT ON COLUMN tickets.claimer_address IS 'Address of claimer';
COMMENT ON COLUMN tickets.claimed_at IS 'Timestamp when ticket was claimed';

-- Migration completed successfully
SELECT 'Migration 008 completed: Enhanced claims system with approval workflow' as result;
