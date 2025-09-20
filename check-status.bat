@echo off
echo ========================================
echo    NewBetting System Status Check
echo ========================================
echo.

echo [1/3] Checking Backend Server...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend Server: RUNNING (http://localhost:3000)
) else (
    echo ❌ Backend Server: NOT RUNNING
)

echo.
echo [2/3] Checking Frontend Server...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend Server: RUNNING (http://localhost:3001)
) else (
    echo ❌ Frontend Server: NOT RUNNING
)

echo.
echo [3/3] Testing API Endpoints...
curl -s http://localhost:3000/api/info >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API Endpoints: WORKING
) else (
    echo ❌ API Endpoints: NOT WORKING
)

echo.
echo ========================================
echo    System Status Summary
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo API Info: http://localhost:3000/api/info
echo.
echo Test Login:
echo POST http://localhost:3000/api/test/login
echo Body: {"username":"admin","password":"admin123"}
echo.
pause




