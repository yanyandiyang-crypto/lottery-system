-- Migration: Add claiming fields to tickets table (CORRECT VERSION)
-- Date: 2025-09-26
-- Description: Add fields for ticket claiming functionality
-- Based on existing enum values: pending, validated, paid, cancelled

-- Add 'claimed' to TicketStatus enum
ALTER TYPE "TicketStatus" ADD VALUE 'claimed';

-- Add claiming fields to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS claimer_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS claimer_phone VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS claimer_address TEXT NULL;

-- Add index for faster claiming queries
CREATE INDEX IF NOT EXISTS idx_tickets_status_claimed ON tickets(status) WHERE status = 'claimed';
CREATE INDEX IF NOT EXISTS idx_tickets_win_amount ON tickets(win_amount) WHERE win_amount > 0;
CREATE INDEX IF NOT EXISTS idx_tickets_claimed_at ON tickets(claimed_at) WHERE claimed_at IS NOT NULL;

-- Update existing winning tickets to use 'validated' status instead of 'won'
-- (since 'validated' seems to be the status for processed/winning tickets)
UPDATE tickets 
SET status = 'validated'
WHERE win_amount > 0 
  AND status = 'pending'
  AND status != 'claimed'
  AND status != 'paid';

-- Add constraint to ensure claimed tickets have claimer info
ALTER TABLE tickets 
ADD CONSTRAINT chk_claimed_tickets_have_claimer 
CHECK (
  (status != 'claimed') OR 
  (status = 'claimed' AND claimer_name IS NOT NULL AND claimed_at IS NOT NULL)
);

-- Create audit log entry for this migration (only if audit_log table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (user_id, action, details, created_at)
        VALUES (
            1, -- System user
            'MIGRATION_EXECUTED',
            '{"migration": "005_add_claiming_fields_correct", "description": "Added claiming fields and claimed enum value", "timestamp": "' || NOW() || '"}',
            NOW()
        );
    END IF;
END$$;

COMMIT;
