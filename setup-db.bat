@echo off
echo Setting up NewBetting Database...
echo.

echo [1/3] Creating database...
psql -U postgres -c "CREATE DATABASE newbetting;" 2>nul
if %errorlevel% neq 0 (
    echo Database might already exist, continuing...
)

echo [2/3] Running database schema...
psql -U postgres -d newbetting -f database_schema.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to run database schema
    echo Please make sure PostgreSQL is running and you have the correct credentials
    pause
    exit /b 1
)

echo [3/3] Creating default admin user...
psql -U postgres -d newbetting -c "INSERT INTO users (id, username, password_hash, full_name, role, status, created_by) VALUES (1, 'admin', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2O', 'System Administrator', 'superadmin', 'active', 1) ON CONFLICT (id) DO NOTHING;"

psql -U postgres -d newbetting -c "INSERT INTO user_balances (user_id, current_balance, total_loaded, total_used) VALUES (1, 10000.00, 10000.00, 0.00) ON CONFLICT (user_id) DO NOTHING;"

echo.
echo Database setup complete!
echo.
echo Default admin credentials:
echo Username: admin
echo Password: admin123
echo.
pause




