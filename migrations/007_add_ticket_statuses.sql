-- Migration 007: Add missing ticket statuses
-- Run this in pgAdmin4 Query Tool

-- Add new ticket statuses to the enum
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'claimed';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'pending_approval';

-- Note: PostgreSQL doesn't allow removing enum values easily
-- The existing values (pending, validated, paid, cancelled) will remain

-- Verify the enum values
-- You can run this to check: SELECT unnest(enum_range(NULL::"TicketStatus"));

-- Optional: Add indexes for better performance on new statuses
CREATE INDEX IF NOT EXISTS idx_tickets_status_claimed ON tickets(status) WHERE status = 'claimed';
CREATE INDEX IF NOT EXISTS idx_tickets_status_pending_approval ON tickets(status) WHERE status = 'pending_approval';

-- Add comment for documentation
COMMENT ON TYPE "TicketStatus" IS 'Ticket status enum: pending, validated, claimed, pending_approval, paid, cancelled';

-- Migration completed successfully
-- You can now use the new ticket statuses in your application
