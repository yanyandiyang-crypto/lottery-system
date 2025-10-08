@echo off
echo ========================================
echo  PUSH TO GITHUB - WebView Optimizations
echo ========================================
echo.

REM Navigate to project directory
cd /d "D:\para flutter mag flutterv2"

echo Current directory: %CD%
echo.

echo ========================================
echo Step 1: Adding new optimization files
echo ========================================

REM Add new documentation files
git add frontend/OPTIMIZATION_GUIDE.md
git add frontend/WEBVIEW_vs_PWA_COMPARISON.md
git add frontend/RECOMMENDATION_SUMMARY.md
git add DEPLOYMENT_GUIDE.md
git add PUSH_TO_GITHUB.bat

REM Add new utility files
git add frontend/src/config/performanceConfig.js
git add frontend/src/utils/apiBatcher.js
git add frontend/src/utils/androidPOS.js

echo ✅ New files staged
echo.

echo ========================================
echo Step 2: Check what will be committed
echo ========================================
git status
echo.

echo ========================================
echo Step 3: Commit changes
echo ========================================

git commit -m "feat: WebView App optimizations for low-end devices

Added:
- Performance config with auto device detection
- API request batching for better network performance  
- Enhanced AndroidPOS integration with print queue
- Comprehensive documentation (WebView vs PWA comparison)
- Deployment guide for GitHub, Render, Cloudflare

Features:
- Optimized for Android 6+ low-end devices
- Better API connection handling
- Print queue management
- Request deduplication
- Memory optimization

Benefits:
- 40-50%% smaller bundle size potential
- Better offline support
- Reliable POS printing
- Improved low-end device performance"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Commit successful
    echo.
    
    echo ========================================
    echo Step 4: Push to GitHub
    echo ========================================
    
    REM Try pushing to main branch
    git push origin main
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ⚠️ Push to main failed, trying master branch...
        git push origin main:master
    )
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo ✅ SUCCESS! Pushed to GitHub
        echo ========================================
        echo.
        echo Next steps:
        echo 1. Render will auto-deploy backend (2-5 min)
        echo 2. Setup Cloudflare Pages for frontend
        echo 3. Update Android WebView app URL
        echo.
        echo Check deployment status:
        echo - Render: https://dashboard.render.com
        echo - Cloudflare: https://dash.cloudflare.com
        echo.
    ) else (
        echo.
        echo ❌ Push failed!
        echo.
        echo Possible issues:
        echo 1. Not authenticated (run: git config credential.helper store)
        echo 2. No remote repository
        echo 3. Network issue
        echo.
        echo Run this to setup remote:
        echo git remote add origin https://github.com/yourusername/your-repo.git
        echo.
    )
) else (
    echo ❌ Commit failed - no changes to commit or error occurred
)

echo.
echo ========================================
echo Press any key to exit...
pause > nul

