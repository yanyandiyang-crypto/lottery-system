# Deploy Frontend to Vercel

This guide will help you deploy your React frontend to Vercel, which is often more reliable than Netlify for React applications.

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. Your frontend code ready for deployment
3. Your backend API URL (currently: `https://lottery-system-tna9.onrender.com`)

## Deployment Steps

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to your frontend directory:**
   ```bash
   cd frontend
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy your project:**
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Set up and deploy? **Yes**
     - Which scope? **Your account**
     - Link to existing project? **No**
     - Project name: **newbetting-frontend** (or your preferred name)
     - Directory: **./** (current directory)
     - Override settings? **No**

5. **Set environment variables:**
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter: https://lottery-system-tna9.onrender.com
   
   vercel env add REACT_APP_API_VERSION
   # Enter: v1
   
   vercel env add REACT_APP_VERSION
   # Enter: 1.0.0
   
   vercel env add GENERATE_SOURCEMAP
   # Enter: false
   ```

6. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "New Project"**

3. **Import your Git repository:**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your repository
   - Choose the `frontend` folder as the root directory

4. **Configure the project:**
   - Framework Preset: **Create React App**
   - Root Directory: **frontend**
   - Build Command: **npm run build**
   - Output Directory: **build**
   - Install Command: **npm install**

5. **Set Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add the following:
     ```
     REACT_APP_API_URL = https://lottery-system-tna9.onrender.com
     REACT_APP_API_VERSION = v1
     REACT_APP_VERSION = 1.0.0
     GENERATE_SOURCEMAP = false
     ```

6. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete

## Configuration Files

### vercel.json
The `vercel.json` file has been created with the following configuration:
- Builds the React app using `@vercel/static-build`
- Sets up proper routing for SPA (Single Page Application)
- Configures environment variables
- Sets the output directory to `build`

### package.json
Added `vercel-build` script for Vercel compatibility.

## Environment Variables

Make sure these environment variables are set in your Vercel project:

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://lottery-system-tna9.onrender.com` | Backend API URL |
| `REACT_APP_API_VERSION` | `v1` | API version |
| `REACT_APP_VERSION` | `1.0.0` | Frontend version |
| `GENERATE_SOURCEMAP` | `false` | Disable source maps for production |

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility
   - Check for TypeScript errors

2. **Environment Variables Not Working:**
   - Verify variables are set in Vercel dashboard
   - Ensure variables start with `REACT_APP_`
   - Redeploy after adding variables

3. **Routing Issues:**
   - The `vercel.json` includes SPA routing configuration
   - All routes will redirect to `index.html`

4. **API Connection Issues:**
   - Verify your backend is running
   - Check CORS settings on your backend
   - Ensure API URL is correct

### ESLint Issues:
Vercel typically handles ESLint issues better than Netlify. If you encounter ESLint errors:

1. **Disable ESLint during build (temporary fix):**
   ```bash
   vercel env add DISABLE_ESLINT_PLUGIN
   # Enter: true
   ```

2. **Or fix ESLint errors:**
   - Run `npm run build` locally to see errors
   - Fix the errors in your code
   - Commit and redeploy

## Automatic Deployments

Once connected to Git:
- Every push to the main branch will trigger a new deployment
- Preview deployments are created for pull requests
- You can manage deployments in the Vercel dashboard

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate will be automatically provisioned

## Performance Optimization

Vercel automatically provides:
- Global CDN
- Automatic HTTPS
- Edge functions
- Image optimization
- Analytics (Pro plan)

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**Note:** Vercel offers better performance and reliability for React applications compared to Netlify, especially for complex builds and ESLint configurations.