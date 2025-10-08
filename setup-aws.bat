@echo off
echo ========================================
echo AWS Setup for Lottery System
echo ========================================
echo.

echo This script will help you set up AWS deployment
echo.

echo Step 1: Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ AWS CLI is installed
    aws --version
) else (
    echo ❌ AWS CLI is NOT installed
    echo.
    echo Please install AWS CLI from:
    echo https://aws.amazon.com/cli/
    echo.
    echo After installation, run: aws configure
    pause
    exit /b
)
echo.

echo Step 2: Check if EB CLI is installed
where eb >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Elastic Beanstalk CLI is installed
    eb --version
) else (
    echo ❌ EB CLI is NOT installed
    echo.
    echo Installing EB CLI via pip...
    pip install awsebcli
    echo.
)
echo.

echo Step 3: Configure AWS Credentials
echo.
set /p configure="Run 'aws configure'? (y/n): "
if /i "%configure%"=="y" (
    aws configure
) else (
    echo ⏭️  Skipped AWS configuration
)
echo.

echo Step 4: Initialize Elastic Beanstalk
echo.
set /p init_eb="Initialize Elastic Beanstalk? (y/n): "
if /i "%init_eb%"=="y" (
    echo.
    echo Select settings:
    echo - Platform: Node.js
    echo - Region: us-east-1 (or your preferred region)
    echo.
    eb init
) else (
    echo ⏭️  Skipped EB initialization
)
echo.

echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo Next steps:
echo 1. Deploy Frontend: Push to GitHub (Amplify auto-deploys)
echo 2. Deploy Backend:  Run 'eb create lottery-backend-prod'
echo 3. Set Env Vars:    Run 'eb setenv DATABASE_URL=...'
echo 4. View Guide:      Open AWS_AMPLIFY_SETUP.md
echo.
pause

