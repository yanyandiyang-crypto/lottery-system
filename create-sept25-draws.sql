-- Create draws for September 25, 2025
-- Run this SQL script directly in your PostgreSQL database

-- First, check existing draws for September 25
SELECT 
    id, 
    draw_date, 
    draw_time, 
    status, 
    created_at
FROM draws 
WHERE draw_date = '2025-09-25'
ORDER BY draw_time;

-- Insert the missing draws for September 25 if they don't exist
INSERT INTO draws (draw_date, draw_time, status, "createdAt", "updatedAt")
VALUES 
    ('2025-09-25'::date, 'twoPM', 'open', NOW(), NOW()),
    ('2025-09-25'::date, 'fivePM', 'open', NOW(), NOW()),
    ('2025-09-25'::date, 'ninePM', 'open', NOW(), NOW())
ON CONFLICT (draw_date, draw_time) DO NOTHING;

-- Verify the draws were created
SELECT 
    id, 
    draw_date, 
    draw_time, 
    status, 
    created_at
FROM draws 
WHERE draw_date = '2025-09-25'
ORDER BY draw_time;

-- Check if there are any tickets for September 25
SELECT 
    COUNT(*) as ticket_count,
    SUM(total_amount) as total_sales
FROM tickets 
WHERE created_at >= '2025-09-25' 
AND created_at < '2025-09-26';

-- Check sales records for September 25
SELECT 
    COUNT(*) as sales_records,
    SUM(total_amount) as total_sales_amount
FROM sales 
WHERE created_at >= '2025-09-25' 
AND created_at < '2025-09-26';
