@echo off
echo 🚀 Manual Heroku Deployment Guide
echo.
echo After installing Heroku CLI, run these commands:
echo.
echo 1. Login to Heroku:
echo    heroku login
echo.
echo 2. Create your app (replace 'your-app-name'):
echo    heroku create your-app-name
echo.
echo 3. Add PostgreSQL database:
echo    heroku addons:create heroku-postgresql:mini
echo.
echo 4. Set environment variables:
echo    heroku config:set JWT_SECRET="your-secret-key-here"
echo    heroku config:set NODE_ENV="production"
echo    heroku config:set JWT_EXPIRES_IN="24h"
echo    heroku config:set TZ="Asia/Manila"
echo.
echo 5. Deploy your code:
echo    git push heroku main
echo.
echo 6. Run database migrations:
echo    heroku run npx prisma migrate deploy
echo.
echo 7. Open your app:
echo    heroku open
echo.
echo 📱 Your app will be available at: https://your-app-name.herokuapp.com
echo.
echo 🌐 For frontend deployment:
echo    - Go to vercel.com
echo    - Import your GitHub repository
echo    - Set root directory to 'frontend'
echo    - Add REACT_APP_API_URL environment variable
echo.
pause

