-- Migration: Add claiming fields to tickets table (FIXED VERSION)
-- Date: 2025-09-26
-- Description: Add fields for ticket claiming functionality

-- First, check existing enum values and add 'claimed' if needed
DO $$
BEGIN
    -- Add 'claimed' to TicketStatus enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'claimed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TicketStatus')
    ) THEN
        ALTER TYPE "TicketStatus" ADD VALUE 'claimed';
    END IF;
END$$;

-- Add claiming fields to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS claimer_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS claimer_phone VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS claimer_address TEXT NULL;

-- Add index for faster claiming queries (now with correct enum value)
CREATE INDEX IF NOT EXISTS idx_tickets_status_claimed ON tickets(status) WHERE status = 'claimed';
CREATE INDEX IF NOT EXISTS idx_tickets_win_amount ON tickets(win_amount) WHERE win_amount > 0;
CREATE INDEX IF NOT EXISTS idx_tickets_claimed_at ON tickets(claimed_at) WHERE claimed_at IS NOT NULL;

-- Check what status values exist first, then update accordingly
-- Update existing winning tickets that might need claiming status
-- Note: We'll use existing enum values, not 'won' if it doesn't exist
UPDATE tickets 
SET status = CASE 
    WHEN EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'won' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TicketStatus')
    ) THEN 'won'::TicketStatus
    ELSE 'pending'::TicketStatus  -- fallback to existing status
END
WHERE win_amount > 0 
  AND status != 'claimed'::TicketStatus
  AND status != 'won'::TicketStatus;

-- Add constraint to ensure claimed tickets have claimer info
ALTER TABLE tickets 
ADD CONSTRAINT IF NOT EXISTS chk_claimed_tickets_have_claimer 
CHECK (
  (status != 'claimed'::TicketStatus) OR 
  (status = 'claimed'::TicketStatus AND claimer_name IS NOT NULL AND claimed_at IS NOT NULL)
);

-- Create audit log entry for this migration (only if audit_log table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (user_id, action, details, created_at)
        VALUES (
            1, -- System user
            'MIGRATION_EXECUTED',
            '{"migration": "005_add_claiming_fields_fixed", "description": "Added claiming fields and enum values to tickets table", "timestamp": "' || NOW() || '"}',
            NOW()
        );
    END IF;
END$$;

COMMIT;
