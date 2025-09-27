# 🚀 Manual Deployment Guide

## Issue Diagnosis
Your deployments are not updating automatically. Here's how to manually trigger them:

## 🔧 Render Backend Deployment

### Step 1: Access Render Dashboard
1. Go to: https://dashboard.render.com
2. Sign in to your account
3. Find your "lottery-backend" service

### Step 2: Manual Deploy
1. Click on your service name
2. Go to the "Deploys" tab
3. Click the **"Manual Deploy"** button
4. Select "Deploy latest commit"
5. Wait for deployment to complete (2-3 minutes)

### Step 3: Check Deployment Status
- Look for green checkmark ✅ when deployment succeeds
- Check logs for any errors
- Test health endpoint: `https://lottery-system-tna9.onrender.com/api/v1/health`

## 🌐 Vercel Frontend Deployment

### Step 1: Access Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Sign in to your account
3. Find your lottery system project

### Step 2: Manual Deploy
1. Click on your project
2. Go to the "Deployments" tab
3. Click **"Redeploy"** on the latest deployment
4. Wait for build to complete (2-3 minutes)

### Step 3: Check Deployment Status
- Look for green checkmark ✅ when deployment succeeds
- Check build logs for any errors
- Test frontend: `https://lottery-system-gamma.vercel.app`

## 🔍 Troubleshooting Common Issues

### Render Issues:
- **Auto-deploy disabled**: Enable in Settings > Auto-Deploy
- **Wrong branch**: Check Settings > Branch (should be "master")
- **Build failures**: Check build logs for errors
- **Database issues**: Verify DATABASE_URL environment variable

### Vercel Issues:
- **GitHub integration**: Reconnect repository in Settings > Git
- **Wrong branch**: Check Production Branch setting
- **Build failures**: Check build logs for errors
- **Environment variables**: Verify REACT_APP_API_URL

## 📋 Quick Checklist

- [ ] GitHub repository updated (✅ Done)
- [ ] Render manual deployment triggered
- [ ] Vercel manual deployment triggered
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] API connection works

## 🆘 If Still Not Working

1. **Check Service URLs**:
   - Render: https://lottery-system-tna9.onrender.com
   - Vercel: https://lottery-system-gamma.vercel.app

2. **Verify Environment Variables**:
   - Render: DATABASE_URL, NODE_ENV, CORS_ORIGIN
   - Vercel: REACT_APP_API_URL, REACT_APP_SOCKET_URL

3. **Contact Support**:
   - Render: https://render.com/support
   - Vercel: https://vercel.com/support

## 📞 Next Steps
After manual deployment:
1. Wait 5 minutes for services to fully start
2. Test both frontend and backend
3. Check that new features are working
4. Verify database migrations applied correctly
