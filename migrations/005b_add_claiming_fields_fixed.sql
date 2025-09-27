-- Step 2: Add claiming fields (FIXED - without win_amount references)
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

-- Create audit log entry for this migration (only if audit_log table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (user_id, action, details, created_at)
        VALUES (
            1, -- System user
            'MIGRATION_EXECUTED',
            '{"migration": "005b_add_claiming_fields_fixed", "description": "Added claiming fields without win_amount references", "timestamp": "' || NOW() || '"}',
            NOW()
        );
    END IF;
END$$;

COMMIT;
