-- Step 1: Add 'pending_approval' to TicketStatus enum
-- This must be run separately and committed before using the new value

ALTER TYPE "TicketStatus" ADD VALUE 'pending_approval';

COMMIT;
