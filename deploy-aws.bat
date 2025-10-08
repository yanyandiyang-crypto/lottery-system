@echo off
echo ========================================
echo AWS Lottery System Deployment
echo ========================================
echo.

echo Step 1: Check Git Status
git status
echo.

echo Step 2: Commit and Push to GitHub
set /p commit_msg="Enter commit message (or press Enter to skip): "
if not "%commit_msg%"=="" (
    git add -A
    git commit -m "%commit_msg%"
    git push origin main:master
    echo ✅ Pushed to GitHub - Amplify will auto-deploy frontend
) else (
    echo ⏭️  Skipped commit
)
echo.

echo Step 3: Deploy Backend to Elastic Beanstalk
set /p deploy_backend="Deploy backend? (y/n): "
if /i "%deploy_backend%"=="y" (
    echo Deploying backend...
    eb deploy
    echo ✅ Backend deployed to Elastic Beanstalk
) else (
    echo ⏭️  Skipped backend deployment
)
echo.

echo ========================================
echo Deployment Complete! 🚀
echo ========================================
echo.
echo Next steps:
echo 1. Frontend URL: Check AWS Amplify Console
echo 2. Backend URL:  Run 'eb open' or check EB Console
echo 3. Database:     Ensure RDS connection string is set
echo.
pause

