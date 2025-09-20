# 🚀 **FREE DEPLOYMENT WITH NEON DATABASE**

## **Step 1: Get Free PostgreSQL from Neon**

1. Go to [neon.tech](https://neon.tech)
2. Sign up with your GitHub account
3. Create a new project
4. Copy the connection string (it will look like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## **Step 2: Deploy Backend to Heroku**

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create lottery-system-$(date +%Y%m%d)

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="your-neon-connection-string"
heroku config:set CORS_ORIGIN=https://your-netlify-app.netlify.app

# Deploy
git add .
git commit -m "Deploy to Heroku with Neon database"
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

## **Step 3: Deploy Frontend to Netlify**

```bash
cd frontend
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify login
netlify deploy --prod --dir=build
```

## **Benefits**
- ✅ **Neon**: Free PostgreSQL (3GB storage, 10GB transfer)
- ✅ **Heroku**: Free hosting (550-1000 hours/month)
- ✅ **Netlify**: Free frontend hosting (100GB bandwidth)
- ✅ **Total Cost**: $0/month
