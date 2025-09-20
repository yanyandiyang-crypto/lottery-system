#!/bin/bash

echo "🚀 Deploying Lottery System to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku
echo "📱 Logging into Heroku..."
heroku login

# Create Heroku app (replace with your desired name)
echo "🏗️ Creating Heroku app..."
read -p "Enter your app name (or press Enter for auto-generated): " app_name
if [ -z "$app_name" ]; then
    heroku create
else
    heroku create $app_name
fi

# Add PostgreSQL addon
echo "🗄️ Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:mini

# Add Redis addon
echo "🔴 Adding Redis cache..."
heroku addons:create heroku-redis:mini

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set NODE_ENV=production
heroku config:set LOG_LEVEL=info
heroku config:set TZ=UTC

# Get the app URL for CORS
app_url=$(heroku apps:info --json | jq -r '.app.web_url')
echo "🌐 Your app URL: $app_url"

# Deploy
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku with monitoring and backups"
git push heroku main

# Run database migrations
echo "🗄️ Running database migrations..."
heroku run npx prisma migrate deploy
heroku run npx prisma generate

# Test the deployment
echo "🧪 Testing deployment..."
heroku open

echo "✅ Deployment complete!"
echo "🌐 Your backend is now live at: $app_url"
echo "📊 Health check: $app_url/api/v1/health/health"
echo "📈 Metrics: $app_url/metrics"
echo ""
echo "Next steps:"
echo "1. Update your frontend API URL to: $app_url"
echo "2. Deploy frontend to Netlify"
echo "3. Test the full system"
