# 🚀 **Deploy Frontend to Netlify**

## **Step 1: Update API Configuration**

Update your frontend to use the Heroku backend:

```javascript
// frontend/src/utils/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-heroku-app.herokuapp.com';
```

## **Step 2: Build Frontend**

```bash
cd frontend
npm run build
```

## **Step 3: Deploy to Netlify**

### **Option A: Netlify CLI (Recommended)**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=build
```

### **Option B: Netlify Dashboard**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `frontend/build` folder
3. Set environment variables:
   - `REACT_APP_API_URL=https://your-heroku-app.herokuapp.com`
   - `REACT_APP_VERSION=1.0.0`

## **Step 4: Configure Environment Variables**

In Netlify dashboard:
- `REACT_APP_API_URL` = Your Heroku app URL
- `REACT_APP_VERSION` = 1.0.0
- `REACT_APP_ENVIRONMENT` = production

## **Step 5: Test**

1. Visit your Netlify URL
2. Test login functionality
3. Test all user flows
4. Check console for errors

## **Benefits**
- ✅ **Free SSL certificate**
- ✅ **Global CDN**
- ✅ **Automatic deployments**
- ✅ **100GB bandwidth/month**
- ✅ **Professional domain**
