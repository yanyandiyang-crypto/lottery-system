@echo off
echo ========================================
echo    NewBetting Lottery System Setup
echo ========================================

echo.
echo [1/6] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/6] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [3/6] Setting up environment files...
cd ..
copy env.example .env
echo Environment file created. Please edit .env with your database credentials.

echo.
echo [4/6] Database setup...
echo Please run the following commands in PostgreSQL:
echo 1. psql -U postgres -f setup-database.sql
echo 2. psql -U postgres -d newbetting -f database_schema.sql

echo.
echo [5/6] Starting backend server...
cd backend
start "NewBetting Backend" cmd /k "npm run dev"

echo.
echo [6/6] Starting frontend server...
cd ..\frontend
start "NewBetting Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    System is starting up...
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Please wait for both servers to start completely.
echo.
pause




