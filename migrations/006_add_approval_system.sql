-- Migration: Add approval system for claimed tickets
-- Date: 2025-09-26
-- Description: Add approval workflow for ticket claims

-- Add 'pending_approval' to TicketStatus enum
ALTER TYPE "TicketStatus" ADD VALUE 'pending_approval';

-- Add approval fields to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS approval_requested_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approval_notes TEXT NULL,
ADD COLUMN IF NOT EXISTS prize_amount DECIMAL(10,2) NULL;

-- Add indexes for approval queries
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

-- Add constraint to ensure approval workflow integrity
ALTER TABLE tickets 
ADD CONSTRAINT IF NOT EXISTS chk_approval_workflow 
CHECK (
  (status != 'pending_approval') OR 
  (status = 'pending_approval' AND approval_requested_at IS NOT NULL AND approval_requested_by IS NOT NULL)
);

-- Add constraint to ensure claimed tickets have approval
ALTER TABLE tickets 
ADD CONSTRAINT IF NOT EXISTS chk_claimed_tickets_approved 
CHECK (
  (status != 'claimed') OR 
  (status = 'claimed' AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
);

COMMIT;
