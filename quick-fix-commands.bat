@echo off
echo 🚀 Quick Fix Commands for Data Migration
echo ========================================

echo.
echo Step 1: Clean Render Database
echo ------------------------------
echo This will completely wipe the Render database
echo Press any key to continue or Ctrl+C to cancel...
pause

echo.
echo 🧹 Cleaning Render database...
psql "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO lottery_db_nqw0_user; GRANT ALL ON SCHEMA public TO public;"

if %errorlevel% neq 0 (
    echo ❌ Failed to clean database
    pause
    exit /b 1
)

echo ✅ Database cleaned successfully

echo.
echo Step 2: Restore Schema
echo ----------------------
echo Press any key to continue...
pause

echo.
echo 🏗️ Restoring database schema...
pg_restore --verbose --no-owner --no-privileges --schema-only "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" "C:\Users\Lags\Desktop\pisting yawa 2\backups\lottery_backup_2025-09-27_21-10-42.backup"

if %errorlevel% neq 0 (
    echo ❌ Failed to restore schema
    pause
    exit /b 1
)

echo ✅ Schema restored successfully

echo.
echo Step 3: Restore Data
echo --------------------
echo Press any key to continue...
pause

echo.
echo 📊 Restoring database data...
pg_restore --verbose --no-owner --no-privileges --disable-triggers --data-only "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" "C:\Users\Lags\Desktop\pisting yawa 2\backups\lottery_backup_2025-09-27_21-10-42.backup"

if %errorlevel% neq 0 (
    echo ❌ Failed to restore data
    pause
    exit /b 1
)

echo ✅ Data restored successfully

echo.
echo Step 4: Verify Migration
echo -------------------------
echo Press any key to continue...
pause

echo.
echo 🔍 Verifying data migration...
node verify-data-migration.js

echo.
echo Step 5: Test Connection
echo ------------------------
echo Press any key to continue...
pause

echo.
echo 🧪 Testing Render connection...
node test-render-connection.js

echo.
echo 🎉 Migration process completed!
echo.
echo Next steps:
echo 1. Test frontend: https://lottery-system-gamma.vercel.app
echo 2. Try logging in with your credentials
echo 3. Check if all functionality works
echo.
pause
