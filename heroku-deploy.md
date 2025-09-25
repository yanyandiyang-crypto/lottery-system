# 🚀 Heroku Deployment Guide

## Prerequisites

1. **Heroku CLI** - Install from [heroku.com](https://devcenter.heroku.com/articles/heroku-cli)
2. **Git** - Make sure your project is in a Git repository
3. **Node.js** - Version 18 or higher

## Step 1: Prepare Your Project

### 1.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create .gitignore (if not exists)
```bash
# Create .gitignore file
echo "node_modules/
.env
.env.local
.env.production
.env.development
uploads/
.DS_Store
*.log
dist/
build/
coverage/
.nyc_output/
.cache/
" > .gitignore
```

## Step 2: Deploy to Heroku

### 2.1 Login to Heroku
```bash
heroku login
```

### 2.2 Create Heroku App
```bash
# Create app (replace 'your-app-name' with your desired name)
heroku create your-app-name

# Or create with specific region
heroku create your-app-name --region us
```

### 2.3 Add PostgreSQL Addon
```bash
# Add PostgreSQL database
heroku addons:create heroku-postgresql:mini
```

### 2.4 Set Environment Variables
```bash
# Set JWT secret
heroku config:set JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Set other environment variables
heroku config:set NODE_ENV="production"
heroku config:set JWT_EXPIRES_IN="24h"
heroku config:set TZ="Asia/Manila"
heroku config:set CORS_ORIGIN="https://your-app-name.herokuapp.com"
heroku config:set MIN_BET_AMOUNT="1.00"
heroku config:set STANDARD_PRIZE="4500.00"
heroku config:set RAMBOLITO_PRIZE_6="750.00"
heroku config:set RAMBOLITO_PRIZE_3="1500.00"
```

### 2.5 Deploy to Heroku
```bash
# Deploy your code
git push heroku main

# Or if your main branch is 'master'
git push heroku master
```

### 2.6 Run Database Migrations
```bash
# Run Prisma migrations
heroku run npx prisma migrate deploy

# Generate Prisma client
heroku run npx prisma generate
```

### 2.7 Open Your App
```bash
# Open the app in your browser
heroku open
```

## Step 3: Deploy Frontend Separately (Recommended)

Since Heroku is better for backend APIs, consider deploying the frontend separately:

### Option A: Vercel (Recommended for React)
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Set build command: `cd frontend && npm run build`
4. Set output directory: `frontend/build`
5. Set environment variables:
   - `REACT_APP_API_URL`: `https://your-app-name.herokuapp.com`
   - `REACT_APP_SOCKET_URL`: `https://your-app-name.herokuapp.com`

### Option B: Netlify
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Set build command: `cd frontend && npm run build`
4. Set publish directory: `frontend/build`
5. Set environment variables (same as Vercel)

### Option C: Heroku (Frontend as separate app)
```bash
# Create separate Heroku app for frontend
heroku create your-app-name-frontend

# Set environment variables
heroku config:set REACT_APP_API_URL="https://your-app-name.herokuapp.com"
heroku config:set REACT_APP_SOCKET_URL="https://your-app-name.herokuapp.com"

# Deploy frontend
cd frontend
git subtree push --prefix=frontend heroku main
```

## Step 4: Configure Domain (Optional)

### 4.1 Custom Domain
```bash
# Add custom domain
heroku domains:add your-domain.com

# Configure DNS
# Point your domain to: your-app-name.herokuapp.com
```

## Step 5: Monitoring and Maintenance

### 5.1 View Logs
```bash
# View real-time logs
heroku logs --tail

# View specific number of lines
heroku logs --tail -n 100
```

### 5.2 Scale Your App
```bash
# Scale web dynos
heroku ps:scale web=1

# Scale to multiple dynos (if needed)
heroku ps:scale web=2
```

### 5.3 Database Management
```bash
# Access database console
heroku pg:psql

# View database info
heroku pg:info

# Create database backup
heroku pg:backups:capture
```

## Step 6: Environment-Specific Configuration

### 6.1 Production Environment Variables
Make sure these are set in Heroku:
- `DATABASE_URL` (automatically set by PostgreSQL addon)
- `JWT_SECRET` (set a strong secret)
- `NODE_ENV=production`
- `CORS_ORIGIN` (your frontend URL)

### 6.2 Frontend Environment Variables
Set these in your frontend deployment platform:
- `REACT_APP_API_URL` (your Heroku backend URL)
- `REACT_APP_SOCKET_URL` (your Heroku backend URL)

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version in package.json
   - Ensure all dependencies are in package.json
   - Check build logs: `heroku logs --tail`

2. **Database Connection Issues**
   - Verify DATABASE_URL is set: `heroku config:get DATABASE_URL`
   - Run migrations: `heroku run npx prisma migrate deploy`

3. **CORS Issues**
   - Update CORS_ORIGIN to match your frontend URL
   - Check CORS configuration in server.js

4. **Frontend Can't Connect to Backend**
   - Verify REACT_APP_API_URL is correct
   - Check if backend is running: `heroku ps`

### Useful Commands:

```bash
# Check app status
heroku ps

# Restart app
heroku restart

# Check config variables
heroku config

# Access app console
heroku run bash

# View app info
heroku info
```

## Security Considerations

1. **Environment Variables**: Never commit .env files
2. **JWT Secret**: Use a strong, random secret
3. **CORS**: Configure CORS properly for production
4. **HTTPS**: Heroku provides HTTPS by default
5. **Database**: Use Heroku's managed PostgreSQL

## Cost Optimization

1. **Free Tier**: Heroku free tier is no longer available
2. **Basic Plan**: $7/month for basic dyno
3. **Database**: PostgreSQL mini is $5/month
4. **Total**: ~$12/month for basic setup

## Next Steps

1. Set up monitoring (Heroku metrics)
2. Configure automated backups
3. Set up CI/CD pipeline
4. Add error tracking (Sentry)
5. Set up logging (Papertrail)

---

**Note**: Replace `your-app-name` with your actual Heroku app name throughout this guide.

