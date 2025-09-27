-- Check existing TicketStatus enum values
SELECT enumlabel as status_values 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'TicketStatus'
)
ORDER BY enumsortorder;
