-- Migration: Add claiming fields to tickets table
-- Date: 2025-09-26
-- Description: Add fields for ticket claiming functionality

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

-- Update existing winning tickets that might need claiming status
UPDATE tickets 
SET status = 'won' 
WHERE win_amount > 0 
  AND status != 'claimed' 
  AND status != 'won';

-- Add constraint to ensure claimed tickets have claimer info
ALTER TABLE tickets 
ADD CONSTRAINT chk_claimed_tickets_have_claimer 
CHECK (
  (status != 'claimed') OR 
  (status = 'claimed' AND claimer_name IS NOT NULL AND claimed_at IS NOT NULL)
);

-- Create audit log entry for this migration
INSERT INTO audit_log (user_id, action, details, created_at)
VALUES (
  1, -- System user
  'MIGRATION_EXECUTED',
  '{"migration": "005_add_claiming_fields", "description": "Added claiming fields to tickets table", "timestamp": "' || NOW() || '"}',
  NOW()
);

COMMIT;
