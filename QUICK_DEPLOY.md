# 🚀 Quick Deploy Guide - NewBetting Lottery System

## Prerequisites
- [ ] Heroku CLI installed
- [ ] Git repository initialized
- [ ] Node.js 18+ installed

## 🎯 Quick Start (5 minutes)

### Step 1: Deploy Backend to Heroku
```bash
# Run the deployment script
./deploy-heroku.bat

# Or manually:
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set NODE_ENV="production"
git push heroku main
heroku run npx prisma migrate deploy
```

### Step 2: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set **Root Directory**: `frontend`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `build`
6. Add environment variables:
   - `REACT_APP_API_URL`: `https://your-app-name.herokuapp.com`
   - `REACT_APP_SOCKET_URL`: `https://your-app-name.herokuapp.com`

### Step 3: Update CORS
```bash
heroku config:set CORS_ORIGIN="https://your-frontend.vercel.app"
heroku restart
```

## ✅ You're Done!

Your lottery system is now live at:
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend API**: `https://your-app-name.herokuapp.com`

## 🔧 Test Your System

1. **Visit your frontend URL**
2. **Login with test credentials**
3. **Test the winning tickets feature**
4. **Check mobile responsiveness**

## 📱 Mobile Testing

- Open your frontend URL on mobile
- Test the responsive design
- Verify all features work on mobile

## 🆘 Need Help?

- **Backend Issues**: Check `heroku logs --tail`
- **Frontend Issues**: Check Vercel deployment logs
- **Database Issues**: Run `heroku run npx prisma migrate deploy`

## 💰 Cost Estimate

- **Heroku**: ~$12/month (Basic dyno + PostgreSQL)
- **Vercel**: Free tier (100GB bandwidth)
- **Total**: ~$12/month

---

**Ready to deploy? Run `deploy-heroku.bat` and follow the prompts!**

