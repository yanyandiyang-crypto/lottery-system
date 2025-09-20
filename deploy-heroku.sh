#!/bin/bash

# Heroku Deployment Script for NewBetting Lottery System
# Make sure you have Heroku CLI installed and are logged in

echo "🚀 Starting Heroku deployment for NewBetting Lottery System..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Please login to Heroku first:"
    echo "   heroku login"
    exit 1
fi

# Get app name from user
read -p "Enter your Heroku app name: " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "❌ App name cannot be empty"
    exit 1
fi

echo "📱 Setting up Heroku app: $APP_NAME"

# Create Heroku app (if it doesn't exist)
echo "🔧 Creating Heroku app..."
heroku create $APP_NAME 2>/dev/null || echo "App $APP_NAME already exists or name is taken"

# Add PostgreSQL addon
echo "🗄️ Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:mini --app $APP_NAME

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set NODE_ENV="production" --app $APP_NAME
heroku config:set JWT_SECRET="$(openssl rand -base64 32)" --app $APP_NAME
heroku config:set JWT_EXPIRES_IN="24h" --app $APP_NAME
heroku config:set TZ="Asia/Manila" --app $APP_NAME
heroku config:set CORS_ORIGIN="https://$APP_NAME.herokuapp.com" --app $APP_NAME
heroku config:set MIN_BET_AMOUNT="1.00" --app $APP_NAME
heroku config:set STANDARD_PRIZE="4500.00" --app $APP_NAME
heroku config:set RAMBOLITO_PRIZE_6="750.00" --app $APP_NAME
heroku config:set RAMBOLITO_PRIZE_3="1500.00" --app $APP_NAME

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
fi

# Add Heroku remote
echo "🔗 Adding Heroku remote..."
heroku git:remote -a $APP_NAME

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git push heroku main || git push heroku master

# Run database migrations
echo "🗄️ Running database migrations..."
heroku run npx prisma migrate deploy --app $APP_NAME
heroku run npx prisma generate --app $APP_NAME

# Open the app
echo "🌐 Opening your app..."
heroku open --app $APP_NAME

echo "✅ Deployment complete!"
echo "📱 Your app is available at: https://$APP_NAME.herokuapp.com"
echo ""
echo "🔧 Next steps:"
echo "1. Deploy your frontend to Vercel/Netlify"
echo "2. Set REACT_APP_API_URL to: https://$APP_NAME.herokuapp.com"
echo "3. Test your application"
echo ""
echo "📊 Useful commands:"
echo "  heroku logs --tail --app $APP_NAME    # View logs"
echo "  heroku ps --app $APP_NAME             # Check app status"
echo "  heroku config --app $APP_NAME         # View config"

