-- Step 2: Add claiming fields (NO AUDIT LOG - Simple Version)
-- Run this AFTER 005a_add_claimed_enum.sql has been committed

-- Add claiming fields to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS claimer_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS claimer_phone VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS claimer_address TEXT NULL;

-- Add index for faster claiming queries (now safe to use 'claimed')
CREATE INDEX IF NOT EXISTS idx_tickets_status_claimed ON tickets(status) WHERE status = 'claimed';
CREATE INDEX IF NOT EXISTS idx_tickets_claimed_at ON tickets(claimed_at) WHERE claimed_at IS NOT NULL;

-- Add constraint to ensure claimed tickets have claimer info
ALTER TABLE tickets 
ADD CONSTRAINT chk_claimed_tickets_have_claimer 
CHECK (
  (status != 'claimed') OR 
  (status = 'claimed' AND claimer_name IS NOT NULL AND claimed_at IS NOT NULL)
);

COMMIT;
