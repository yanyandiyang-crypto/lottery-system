-- Check audit_log table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'audit_log'
ORDER BY ordinal_position;
