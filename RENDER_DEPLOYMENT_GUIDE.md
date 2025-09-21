# Render Deployment Guide - CORS Fix

## 🚀 Quick Deployment Steps

### 1. Access Render Dashboard
1. Go to [render.com](https://render.com)
2. Log in to your account
3. Navigate to your `lottery-backend` service

### 2. Update Environment Variables
1. Go to **Environment** tab
2. Find the `CORS_ORIGIN` variable
3. Update the value to:
   ```
   https://lottery-system-gamma.vercel.app,http://localhost:3000,http://localhost:3002
   ```
4. Click **Save Changes**

### 3. Manual Deploy
1. Go to **Manual Deploy** tab
2. Click **Deploy latest commit**
3. Wait for deployment to complete (usually 2-3 minutes)

### 4. Verify Deployment
1. Check the **Logs** tab for CORS-related messages
2. Look for: `CORS Allowed Origins: [array of origins]`
3. Test the API endpoint:
   ```bash
   curl -H "Origin: https://lottery-system-gamma.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        -X OPTIONS \
        https://lottery-system-tna9.onrender.com/api/v1/auth/login
   ```

## 🔍 Expected Log Output

After deployment, you should see logs like:
```
CORS Allowed Origins: ['https://lottery-system-gamma.vercel.app', 'http://localhost:3000', 'http://localhost:3002']
CORS: Checking origin: https://lottery-system-gamma.vercel.app
CORS: Origin allowed: https://lottery-system-gamma.vercel.app
```

## ✅ Success Indicators

- ✅ Deployment completes without errors
- ✅ CORS logs show proper origin handling
- ✅ Frontend can make API calls without CORS errors
- ✅ Authentication works properly

## 🚨 Troubleshooting

### If deployment fails:
1. Check the **Logs** tab for error messages
2. Verify environment variables are set correctly
3. Ensure the GitHub repository is accessible

### If CORS still doesn't work:
1. Check that the exact Vercel URL is in the CORS_ORIGIN
2. Verify the frontend is making requests to the correct backend URL
3. Check browser developer tools for detailed CORS error messages

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify GitHub repository has latest changes
3. Test with curl commands to isolate the issue
