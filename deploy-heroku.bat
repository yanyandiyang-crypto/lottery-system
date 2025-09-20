@echo off
REM Heroku Deployment Script for NewBetting Lottery System
REM Make sure you have Heroku CLI installed and are logged in

echo 🚀 Starting Heroku deployment for NewBetting Lottery System...

REM Check if Heroku CLI is installed
heroku --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Heroku CLI is not installed. Please install it first:
    echo    https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)

REM Check if user is logged in to Heroku
heroku auth:whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Please login to Heroku first:
    echo    heroku login
    pause
    exit /b 1
)

REM Get app name from user
set /p APP_NAME="Enter your Heroku app name: "

if "%APP_NAME%"=="" (
    echo ❌ App name cannot be empty
    pause
    exit /b 1
)

echo 📱 Setting up Heroku app: %APP_NAME%

REM Create Heroku app (if it doesn't exist)
echo 🔧 Creating Heroku app...
heroku create %APP_NAME% 2>nul || echo App %APP_NAME% already exists or name is taken

REM Add PostgreSQL addon
echo 🗄️ Adding PostgreSQL database...
heroku addons:create heroku-postgresql:mini --app %APP_NAME%

REM Set environment variables
echo ⚙️ Setting environment variables...
heroku config:set NODE_ENV="production" --app %APP_NAME%
heroku config:set JWT_SECRET="%RANDOM%%RANDOM%%RANDOM%" --app %APP_NAME%
heroku config:set JWT_EXPIRES_IN="24h" --app %APP_NAME%
heroku config:set TZ="Asia/Manila" --app %APP_NAME%
heroku config:set CORS_ORIGIN="https://%APP_NAME%.herokuapp.com" --app %APP_NAME%
heroku config:set MIN_BET_AMOUNT="1.00" --app %APP_NAME%
heroku config:set STANDARD_PRIZE="4500.00" --app %APP_NAME%
heroku config:set RAMBOLITO_PRIZE_6="750.00" --app %APP_NAME%
heroku config:set RAMBOLITO_PRIZE_3="1500.00" --app %APP_NAME%

REM Initialize git if not already done
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
)

REM Add Heroku remote
echo 🔗 Adding Heroku remote...
heroku git:remote -a %APP_NAME%

REM Deploy to Heroku
echo 🚀 Deploying to Heroku...
git push heroku main 2>nul || git push heroku master

REM Run database migrations
echo 🗄️ Running database migrations...
heroku run npx prisma migrate deploy --app %APP_NAME%
heroku run npx prisma generate --app %APP_NAME%

REM Open the app
echo 🌐 Opening your app...
heroku open --app %APP_NAME%

echo ✅ Deployment complete!
echo 📱 Your app is available at: https://%APP_NAME%.herokuapp.com
echo.
echo 🔧 Next steps:
echo 1. Deploy your frontend to Vercel/Netlify
echo 2. Set REACT_APP_API_URL to: https://%APP_NAME%.herokuapp.com
echo 3. Test your application
echo.
echo 📊 Useful commands:
echo   heroku logs --tail --app %APP_NAME%    # View logs
echo   heroku ps --app %APP_NAME%             # Check app status
echo   heroku config --app %APP_NAME%         # View config

pause

