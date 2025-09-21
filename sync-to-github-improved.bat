@echo off
setlocal enabledelayedexpansion

echo 🚀 Enhanced GitHub Auto-Sync Starting...
echo.

REM Check if we're in a git repository
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Not in a git repository!
    echo Please run this script from your project directory.
    pause
    exit /b 1
)

echo 📋 Checking git status...
git status --porcelain > temp_status.txt
set /p has_changes=<temp_status.txt
del temp_status.txt

if "%has_changes%"=="" (
    echo ✅ No changes to commit. Repository is up to date.
    echo 🌐 Repository: https://github.com/yanyandiyang-crypto/lottery-system
    pause
    exit /b 0
)

echo 📤 Changes detected! Adding all changes...
git add .

if errorlevel 1 (
    echo ❌ Error adding files to git!
    pause
    exit /b 1
)

echo 💾 Committing changes...
set commit_msg=Auto-sync: %date% %time% - Fixed TicketTemplates.js toast import
git commit -m "%commit_msg%"

if errorlevel 1 (
    echo ❌ Error committing changes!
    pause
    exit /b 1
)

echo 🚀 Pushing to GitHub...
git push origin master

if errorlevel 1 (
    echo ❌ Error pushing to GitHub!
    echo.
    echo 🔧 Troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Verify GitHub credentials
    echo 3. Check if you have push permissions
    echo.
    echo 💡 You can also try: git push origin master --force-with-lease
    pause
    exit /b 1
)

echo.
echo ✅ Sync complete!
echo 🌐 Repository: https://github.com/yanyandiyang-crypto/lottery-system
echo 📝 Commit: %commit_msg%
echo.
echo 🎉 All changes have been successfully pushed to GitHub!
pause
