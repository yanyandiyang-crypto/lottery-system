-- Step 1: Add 'claimed' to TicketStatus enum
-- This must be run separately and committed before using the new value

ALTER TYPE "TicketStatus" ADD VALUE 'claimed';

COMMIT;
