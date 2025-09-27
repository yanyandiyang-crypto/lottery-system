@echo off
REM Proper Data Migration: Local to Render
REM Uses pg_dump and psql for reliable data transfer

echo 🚀 Proper Data Migration: Local → Render
echo =========================================

REM Configuration
set LOCAL_HOST=localhost
set LOCAL_PORT=5432
set LOCAL_USER=postgres
set LOCAL_PASS=password
set LOCAL_DB=lottery_system_local

set RENDER_URL=postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0

echo ⚠️  Important Notes:
echo - This will OVERWRITE data in Render database
echo - Make sure Render database is backed up
echo - Update LOCAL_PASS with your actual password
echo.

REM Step 1: Create data-only dump
echo 📤 Step 1: Creating data-only dump from local database...
set PGPASSWORD=%LOCAL_PASS%
pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% --data-only --no-owner --no-privileges --disable-triggers -f lottery_data_only.sql

if %errorlevel% neq 0 (
    echo ❌ Failed to create dump
    echo 💡 Make sure PostgreSQL is running and credentials are correct
    echo 💡 Update LOCAL_PASS in this script with your actual password
    pause
    exit /b 1
)

echo ✅ Data dump created: lottery_data_only.sql

REM Step 2: Parse Render database URL
echo.
echo 📥 Step 2: Restoring data to Render database...

REM Extract components from URL
for /f "tokens=1,2,3,4,5 delims=:/@" %%a in ("%RENDER_URL%") do (
    set RENDER_USER=%%b
    set RENDER_PASS=%%c
    set RENDER_HOST_PORT=%%d
    set RENDER_DB=%%e
)

REM Extract host and port
for /f "tokens=1,2 delims=:" %%a in ("%RENDER_HOST_PORT%") do (
    set RENDER_HOST=%%a
    set RENDER_PORT=%%b
)

echo Host: %RENDER_HOST%
echo Port: %RENDER_PORT%
echo Database: %RENDER_DB%
echo Username: %RENDER_USER%

REM Step 3: Restore to Render
set PGPASSWORD=%RENDER_PASS%
psql -h %RENDER_HOST% -p %RENDER_PORT% -U %RENDER_USER% -d %RENDER_DB% -f lottery_data_only.sql

if %errorlevel% neq 0 (
    echo ❌ Failed to restore to Render database
    echo 💡 Check your Render database URL and network connectivity
    pause
    exit /b 1
)

echo ✅ Data restored to Render successfully!

REM Step 4: Clean up
if exist lottery_data_only.sql (
    echo 🗑️ Cleaning up dump file...
    del lottery_data_only.sql
)

echo.
echo 🎉 Data Migration Complete!
echo ============================
echo ✅ All local data has been migrated to Render
echo 🔗 Next steps:
echo    1. Update Render service DATABASE_URL
echo    2. Restart Render service
echo    3. Test login with your existing credentials

pause
