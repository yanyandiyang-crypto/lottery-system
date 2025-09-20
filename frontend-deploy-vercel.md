# 🌐 Frontend Deployment to Vercel

## Why Vercel?
- **Free tier** with generous limits
- **Automatic deployments** from GitHub
- **Global CDN** for fast loading
- **Easy environment variable management**
- **Perfect for React applications**

## Step 1: Prepare Frontend for Production

### 1.1 Update API URLs
Make sure your frontend is configured to use the Heroku backend URL.

In `frontend/src/utils/api.js`, update the base URL:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-app-name.herokuapp.com';
```

### 1.2 Build the Frontend
```bash
cd frontend
npm run build
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure the project:**
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from frontend directory:**
   ```bash
   cd frontend
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? (select your account)
   - Link to existing project? `N`
   - Project name: `newbetting-frontend`
   - Directory: `./frontend`
   - Override settings? `N`

## Step 3: Configure Environment Variables

### 3.1 In Vercel Dashboard:
1. Go to your project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables**
4. Add these variables:

```
REACT_APP_API_URL = https://your-app-name.herokuapp.com
REACT_APP_SOCKET_URL = https://your-app-name.herokuapp.com
```

### 3.2 Via Vercel CLI:
```bash
vercel env add REACT_APP_API_URL
# Enter: https://your-app-name.herokuapp.com

vercel env add REACT_APP_SOCKET_URL
# Enter: https://your-app-name.herokuapp.com
```

## Step 4: Update CORS Settings

### 4.1 Update Heroku Backend CORS
```bash
# Update CORS_ORIGIN to your Vercel domain
heroku config:set CORS_ORIGIN="https://your-frontend-name.vercel.app" --app your-app-name
```

### 4.2 Restart Heroku App
```bash
heroku restart --app your-app-name
```

## Step 5: Test Your Deployment

1. **Visit your Vercel URL**
2. **Test the login functionality**
3. **Check if API calls are working**
4. **Test the winning tickets feature**

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain in Vercel:
1. Go to project settings
2. Click on **Domains**
3. Add your custom domain
4. Configure DNS as instructed

### 6.2 Update Environment Variables:
```bash
# Update CORS_ORIGIN with your custom domain
heroku config:set CORS_ORIGIN="https://your-custom-domain.com" --app your-app-name
```

## Troubleshooting

### Common Issues:

1. **API Connection Failed**
   - Check if `REACT_APP_API_URL` is set correctly
   - Verify Heroku app is running: `heroku ps --app your-app-name`
   - Check CORS settings

2. **Build Fails**
   - Check if all dependencies are in `package.json`
   - Verify Node.js version compatibility
   - Check build logs in Vercel dashboard

3. **Environment Variables Not Working**
   - Make sure variables start with `REACT_APP_`
   - Redeploy after adding new variables
   - Check variable names are correct

### Useful Commands:

```bash
# Check Vercel deployment status
vercel ls

# View deployment logs
vercel logs

# Redeploy
vercel --prod

# Check environment variables
vercel env ls
```

## Alternative: Netlify Deployment

If you prefer Netlify over Vercel:

### 1. Go to [netlify.com](https://netlify.com)
### 2. Connect your GitHub repository
### 3. Configure build settings:
   - **Build command**: `cd frontend && npm run build`
   - **Publish directory**: `frontend/build`
### 4. Set environment variables:
   - `REACT_APP_API_URL`: `https://your-app-name.herokuapp.com`
   - `REACT_APP_SOCKET_URL`: `https://your-app-name.herokuapp.com`

## Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Vercel** | 100GB bandwidth/month | $20/month |
| **Netlify** | 100GB bandwidth/month | $19/month |
| **Heroku** | No free tier | $7/month (basic) |

## Final Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vercel)      │◄──►│   (Heroku)      │◄──►│   (PostgreSQL)  │
│   React App     │    │   Node.js API   │    │   Heroku Addon  │
│   https://...   │    │   https://...   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Next Steps

1. **Set up monitoring** (Vercel Analytics)
2. **Configure custom domain**
3. **Set up CI/CD** (automatic deployments)
4. **Add error tracking** (Sentry)
5. **Set up backups** (database backups)

---

**Note**: Replace `your-app-name` and `your-frontend-name` with your actual app names.

