-- Check existing columns in tickets table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tickets'
ORDER BY ordinal_position;
