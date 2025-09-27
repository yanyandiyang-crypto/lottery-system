-- Step 2: Add approval fields and use the new 'pending_approval' enum value
-- Run this AFTER 006a_add_pending_approval_enum.sql has been committed

-- Add approval fields to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS approval_requested_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approval_notes TEXT NULL,
ADD COLUMN IF NOT EXISTS prize_amount DECIMAL(10,2) NULL;

-- Add indexes for approval queries (now safe to use 'pending_approval')
CREATE INDEX IF NOT EXISTS idx_tickets_pending_approval ON tickets(status) WHERE status = 'pending_approval';
CREATE INDEX IF NOT EXISTS idx_tickets_approval_requested_at ON tickets(approval_requested_at) WHERE approval_requested_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_approved_by ON tickets(approved_by) WHERE approved_by IS NOT NULL;

-- Create claims_audit table for tracking approval history
CREATE TABLE IF NOT EXISTS claims_audit (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    action VARCHAR(50) NOT NULL, -- 'claim_requested', 'approved', 'rejected'
    performed_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for claims_audit
CREATE INDEX IF NOT EXISTS idx_claims_audit_ticket_id ON claims_audit(ticket_id);
CREATE INDEX IF NOT EXISTS idx_claims_audit_action ON claims_audit(action);
CREATE INDEX IF NOT EXISTS idx_claims_audit_performed_by ON claims_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_claims_audit_created_at ON claims_audit(created_at);

-- Add constraints using DO block to handle IF NOT EXISTS
DO $$
BEGIN
    -- Add approval workflow constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_approval_workflow' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE tickets 
        ADD CONSTRAINT chk_approval_workflow 
        CHECK (
          (status != 'pending_approval') OR 
          (status = 'pending_approval' AND approval_requested_at IS NOT NULL AND approval_requested_by IS NOT NULL)
        );
    END IF;

    -- Add claimed tickets approval constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_claimed_tickets_approved' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE tickets 
        ADD CONSTRAINT chk_claimed_tickets_approved 
        CHECK (
          (status != 'claimed') OR 
          (status = 'claimed' AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
        );
    END IF;
END$$;

COMMIT;
