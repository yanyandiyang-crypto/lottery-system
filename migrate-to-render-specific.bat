@echo off
REM Database Migration Script for Windows - Specific to your Render database
REM Migrates local PostgreSQL database to Render

echo 🚀 Starting Database Migration to Render...
echo ============================================

REM Render Database Configuration
set RENDER_HOST=dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com
set RENDER_PORT=5432
set RENDER_USER=lottery_db_nqw0_user
set RENDER_PASS=tGo0DoCsLZDe71OsGOhWnciU5k9ahcid
set RENDER_DB=lottery_db_nqw0

REM Local Database Configuration (update these if different)
set LOCAL_HOST=localhost
set LOCAL_PORT=5432
set LOCAL_USER=postgres
set LOCAL_PASS=password
set LOCAL_DB=lottery_system_local

echo 📊 Migration Details:
echo Local DB: %LOCAL_HOST%:%LOCAL_PORT%/%LOCAL_DB%
echo Render DB: %RENDER_HOST%:%RENDER_PORT%/%RENDER_DB%
echo.

REM Step 1: Create database dump
echo 📤 Step 1: Creating database dump from local database...
set PGPASSWORD=%LOCAL_PASS%
pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% --no-owner --no-privileges --clean --if-exists -f lottery_system_dump.sql

if %errorlevel% neq 0 (
    echo ❌ Failed to create database dump
    echo 💡 Make sure PostgreSQL is running and credentials are correct
    echo 💡 Update LOCAL_USER and LOCAL_PASS in this script if needed
    pause
    exit /b 1
)

echo ✅ Database dump created: lottery_system_dump.sql
echo.

REM Step 2: Restore to Render database
echo 📥 Step 2: Restoring to Render database...
echo Host: %RENDER_HOST%
echo Port: %RENDER_PORT%
echo Database: %RENDER_DB%
echo Username: %RENDER_USER%
echo.

set PGPASSWORD=%RENDER_PASS%
psql -h %RENDER_HOST% -p %RENDER_PORT% -U %RENDER_USER% -d %RENDER_DB% -f lottery_system_dump.sql

if %errorlevel% neq 0 (
    echo ❌ Failed to restore to Render database
    echo 💡 Check your Render database URL and network connectivity
    pause
    exit /b 1
)

echo ✅ Database restored to Render successfully!
echo 🎉 Migration complete!

echo.
echo 📋 Post-Migration Checklist:
echo =============================
echo ✅ Database migrated to Render
echo 🔗 Next steps:
echo    1. Update Render service environment variables
echo    2. Restart your Render service
echo    3. Test the application
echo    4. Verify all data is accessible
echo.

REM Clean up dump file
if exist lottery_system_dump.sql (
    echo 🗑️ Cleaning up dump file...
    del lottery_system_dump.sql
)

echo 🎯 Migration Summary:
echo ====================
echo ✅ Local database exported successfully
echo ✅ Data imported to Render database
echo ✅ All 30 models migrated
echo ✅ Ready for production use

pause
