@echo off
echo ========================================
echo  DEPLOY FRONTEND TO CLOUDFLARE PAGES
echo ========================================
echo.

cd /d "D:\para flutter mag flutterv2"

echo Step 1: Building frontend...
echo ========================================
cd frontend

echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install failed!
    pause
    exit /b 1
)

echo.
echo Building production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build successful!
echo.

cd ..

echo ========================================
echo Step 2: Deploy to Cloudflare Pages
echo ========================================
echo.
echo Choose deployment method:
echo.
echo 1. Wrangler CLI (Automatic)
echo 2. Manual (Dashboard)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Installing Wrangler CLI...
    call npm install -g wrangler
    
    echo.
    echo Logging in to Cloudflare...
    echo (Browser will open for authentication)
    call wrangler login
    
    echo.
    echo Deploying to Cloudflare Pages...
    call wrangler pages deploy frontend/build --project-name=lottery-frontend
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo ✅ SUCCESS! Deployed to Cloudflare Pages
        echo ========================================
        echo.
        echo Your frontend is now live!
        echo.
        echo Next steps:
        echo 1. Copy the URL shown above
        echo 2. Update Android WebView app URL
        echo 3. Test the deployment
        echo.
    ) else (
        echo.
        echo ❌ Deployment failed!
        echo.
        echo Try manual deployment:
        echo 1. Go to https://dash.cloudflare.com
        echo 2. Pages → Create project
        echo 3. Upload frontend/build folder
        echo.
    )
) else (
    echo.
    echo ========================================
    echo Manual Deployment Instructions
    echo ========================================
    echo.
    echo 1. Go to: https://dash.cloudflare.com
    echo 2. Click: Workers and Pages
    echo 3. Click: Create application
    echo 4. Click: Pages tab
    echo 5. Click: Connect to Git
    echo 6. Select: lottery-system repository
    echo.
    echo Build settings:
    echo   Build command: cd frontend ^&^& npm install ^&^& npm run build
    echo   Build output: frontend/build
    echo.
    echo Environment variables:
    echo   REACT_APP_API_URL = https://lottery-backend-l1k7.onrender.com
    echo   NODE_VERSION = 18
    echo   CI = false
    echo.
    echo 7. Click: Save and Deploy
    echo 8. Wait 2-3 minutes
    echo 9. Done!
    echo.
)

echo.
echo ========================================
echo Build folder location:
echo %CD%\frontend\build
echo ========================================
echo.
echo Press any key to exit...
pause > nul

