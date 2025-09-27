# Database Migration Instructions for pgAdmin4

## Overview
These SQL migration files will add the missing ticket statuses and enhance the claims system to support the clean code architecture.

## Migration Files to Run (in order):

### 1. **007_add_ticket_statuses.sql**
- Adds `claimed` and `pending_approval` to TicketStatus enum
- Creates performance indexes for new statuses
- **Required**: Run this first

### 2. **008_enhance_claims_system.sql**
- Adds claimer information columns to tickets table
- Enhances claims_audit table with additional fields
- Creates performance indexes and constraints
- **Required**: Run this after 007

## How to Run in pgAdmin4:

1. **Open pgAdmin4**
2. **Connect to your lottery database**
3. **Open Query Tool** (Tools → Query Tool)
4. **Run migrations in order:**

   **Step 1:** Copy and paste content from `007_add_ticket_statuses.sql`
   - Click Execute (F5)
   - Verify success message

   **Step 2:** Copy and paste content from `008_enhance_claims_system.sql`
   - Click Execute (F5)
   - Verify success message

## Verification Queries:

After running migrations, verify with these queries:

```sql
-- Check ticket status enum values
SELECT unnest(enum_range(NULL::"TicketStatus"));

-- Check new columns in tickets table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('claimer_name', 'claimer_phone', 'claimer_address', 'claimed_at', 'approval_requested_at');

-- Check claims_audit table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims_audit';
```

## Expected Results:
- TicketStatus enum should include: pending, validated, claimed, pending_approval, paid, cancelled
- tickets table should have claimer and approval columns
- claims_audit table should be enhanced with claimer fields
- All indexes and constraints should be created

## Rollback (if needed):
If you need to rollback, these changes are mostly additive and safe. The enum values cannot be easily removed in PostgreSQL, but the new columns can be dropped if necessary.

## After Migration:
1. Restart your Node.js application
2. Test ticket claiming functionality
3. Verify admin approval workflow works
4. Check that all API endpoints return correct data

## Troubleshooting:
- If enum values already exist, the migration will skip them (IF NOT EXISTS)
- If columns already exist, they will be skipped
- Check PostgreSQL logs for any constraint violations
- Ensure your application user has sufficient privileges

## Support:
These migrations support the clean code architecture implementation with:
- Enhanced ticket claiming with claimer details
- Complete audit trail for claims
- Admin approval workflow
- Performance optimizations
