@echo off
REM Database Migration Script for Windows
REM Migrates local PostgreSQL database to Render

echo 🚀 Starting Database Migration...

REM Check if .env.migration exists
if not exist .env.migration (
    echo ❌ Migration configuration not found!
    echo Please run: node setup-migration.js
    pause
    exit /b 1
)

REM Load environment variables from .env.migration
for /f "tokens=1,2 delims==" %%a in (.env.migration) do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set %%a=%%b
    )
)

REM Create database dump
echo 📤 Creating database dump...
pg_dump -h %LOCAL_DB_HOST% -p %LOCAL_DB_PORT% -U %LOCAL_DB_USER% -d %LOCAL_DB_NAME% --no-owner --no-privileges --clean --if-exists -f lottery_system_dump.sql

if %errorlevel% neq 0 (
    echo ❌ Failed to create database dump
    pause
    exit /b 1
)

echo ✅ Database dump created successfully

REM Parse Render database URL
REM postgresql://user:pass@host:port/database
set RENDER_URL=%RENDER_DATABASE_URL%

REM Extract components from URL (simplified parsing)
for /f "tokens=1,2,3,4 delims=:/@" %%a in ("%RENDER_URL%") do (
    set RENDER_USER=%%b
    set RENDER_PASS=%%c
    set RENDER_HOST_PORT=%%d
)

REM Extract host and port
for /f "tokens=1,2 delims=:" %%a in ("%RENDER_HOST_PORT%") do (
    set RENDER_HOST=%%a
    set RENDER_PORT=%%b
)

REM Extract database name
for /f "tokens=1 delims=/" %%a in ("%RENDER_URL%") do (
    set RENDER_DB=%%a
)

echo 📥 Restoring to Render database...
echo Host: %RENDER_HOST%
echo Port: %RENDER_PORT%
echo Database: %RENDER_DB%
echo Username: %RENDER_USER%

REM Restore to Render
set PGPASSWORD=%RENDER_PASS%
psql -h %RENDER_HOST% -p %RENDER_PORT% -U %RENDER_USER% -d %RENDER_DB% -f lottery_system_dump.sql

if %errorlevel% neq 0 (
    echo ❌ Failed to restore to Render database
    pause
    exit /b 1
)

echo ✅ Database restored to Render successfully!
echo 🎉 Migration complete!

echo.
echo 🔗 Next steps:
echo 1. Update your Render service environment variables
echo 2. Restart your Render service
echo 3. Test the application

pause
