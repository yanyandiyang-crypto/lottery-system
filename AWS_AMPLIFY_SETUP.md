# AWS Amplify Deployment Guide

## 🚀 Complete Setup for Lottery System

Your lottery system will be deployed as:
- **Frontend:** AWS Amplify (React app)
- **Backend:** AWS Elastic Beanstalk or Lambda
- **Database:** AWS RDS PostgreSQL

---

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com
2. **GitHub Repository** - Already set up ✅
3. **AWS CLI** (Optional) - For command-line deployment

---

## Part 1: Deploy Frontend to AWS Amplify

### Step 1: Go to AWS Amplify Console

1. Log into AWS Console: https://console.aws.amazon.com
2. Search for **"Amplify"** in the services search bar
3. Click **"Get Started"** under "Host your web app"

### Step 2: Connect GitHub Repository

1. Choose **GitHub** as your repository provider
2. Click **Authorize AWS Amplify**
3. Select repository: `yanyandiyang-crypto/lottery-system`
4. Select branch: **master**
5. Click **Next**

### Step 3: Configure Build Settings

The `amplify.yml` file is already created in your project root.

**Amplify will auto-detect your React app in the `/frontend` folder.**

Build settings:
```yaml
Root directory: frontend
Build command: npm run build
Output directory: build
```

Click **Next**

### Step 4: Review and Deploy

1. Review all settings
2. Click **Save and Deploy**
3. Wait 5-10 minutes for deployment

Your frontend will be available at:
```
https://master.xxxxxx.amplifyapp.com
```

---

## Part 2: Deploy Backend API

### Option A: AWS Elastic Beanstalk (Recommended) ⭐

**Best for your Express.js backend**

1. **Install EB CLI:**
```bash
pip install awsebcli
```

2. **Initialize Elastic Beanstalk:**
```bash
cd "d:\para flutter mag flutterv2"
eb init -p node.js -r us-east-1 lottery-backend
```

3. **Create Environment:**
```bash
eb create lottery-backend-prod
```

4. **Deploy:**
```bash
eb deploy
```

5. **Set Environment Variables:**
```bash
eb setenv NODE_ENV=production
eb setenv DATABASE_URL=your_rds_connection_string
eb setenv JWT_SECRET=your_jwt_secret
eb setenv PORT=8080
```

### Option B: AWS Lambda + API Gateway

**For serverless backend (requires code modification)**

Would need to convert Express routes to Lambda functions.

---

## Part 3: Setup PostgreSQL Database (AWS RDS)

### Step 1: Create RDS PostgreSQL Instance

1. Go to **RDS Console**: https://console.aws.amazon.com/rds
2. Click **Create database**
3. Choose **PostgreSQL**
4. Select **Free tier** template
5. Settings:
   - DB instance identifier: `lottery-database`
   - Master username: `lottery_admin`
   - Master password: (create strong password)
6. Instance configuration:
   - DB instance class: `db.t3.micro` (free tier)
   - Storage: 20 GB
7. Connectivity:
   - Public access: **Yes** (for testing)
   - VPC security group: Create new (open port 5432)
8. Click **Create database**

### Step 2: Get Connection String

After database is created (takes ~10 minutes):

1. Click on your database instance
2. Copy the **Endpoint**
3. Your connection string format:
```
postgresql://lottery_admin:YOUR_PASSWORD@your-endpoint.rds.amazonaws.com:5432/postgres
```

### Step 3: Update Environment Variables

**For Amplify Frontend:**
1. Go to Amplify Console
2. Click on your app
3. Go to **Environment variables**
4. Add:
   - `REACT_APP_API_URL` = Your backend API URL

**For Elastic Beanstalk Backend:**
```bash
eb setenv DATABASE_URL=your_rds_connection_string
```

---

## Part 4: Configure CORS

Update `CORS_ORIGIN` in your backend to include Amplify URL:

```bash
eb setenv CORS_ORIGIN=https://master.xxxxxx.amplifyapp.com,http://localhost:3000
```

---

## Part 5: Run Database Migrations

Once backend is deployed:

1. **Connect to your EB instance:**
```bash
eb ssh
```

2. **Run Prisma migrations:**
```bash
npx prisma migrate deploy
```

Or run migrations from your local machine:
```bash
# Set DATABASE_URL to your RDS connection string
export DATABASE_URL="postgresql://lottery_admin:password@endpoint.rds.amazonaws.com:5432/postgres"
npx prisma migrate deploy
```

---

## 💰 AWS Free Tier Limits

- **Amplify:** 1000 build minutes/month, 15 GB served/month
- **Elastic Beanstalk:** Free (you pay for EC2)
- **EC2:** 750 hours/month (t2.micro or t3.micro)
- **RDS:** 750 hours/month (db.t2.micro or db.t3.micro), 20GB storage
- **Data Transfer:** 15 GB/month

---

## 📊 Cost Estimate (After Free Tier)

- **Amplify (Frontend):** ~$1-5/month
- **Elastic Beanstalk (Backend):** ~$10-15/month
- **RDS PostgreSQL:** ~$15-20/month
- **Total:** ~$25-40/month

---

## 🔒 Security Checklist

- [ ] RDS database in private subnet (for production)
- [ ] Security groups configured properly
- [ ] JWT_SECRET is secure and unique
- [ ] Database password is strong
- [ ] CORS configured correctly
- [ ] Environment variables set in Amplify & EB

---

## 📝 Quick Commands Reference

### Amplify (Frontend)
```bash
# View app status
aws amplify list-apps

# Redeploy
git push origin master  # Auto-deploys via Amplify
```

### Elastic Beanstalk (Backend)
```bash
# View status
eb status

# View logs
eb logs

# Deploy updates
git commit -am "Update"
eb deploy

# Open app in browser
eb open

# SSH into instance
eb ssh
```

### RDS Database
```bash
# Connect to RDS from local
psql "postgresql://lottery_admin:password@endpoint.rds.amazonaws.com:5432/postgres"

# Run migrations
DATABASE_URL="connection_string" npx prisma migrate deploy
```

---

## 🎯 Next Steps

1. ✅ Deploy Frontend to Amplify (Part 1)
2. ✅ Create RDS Database (Part 3)
3. ✅ Deploy Backend to Elastic Beanstalk (Part 2)
4. ✅ Configure CORS and Environment Variables
5. ✅ Run database migrations
6. ✅ Test your application!

---

## 🆘 Troubleshooting

### Frontend not loading
- Check Amplify build logs
- Verify `amplify.yml` configuration
- Check environment variables

### Backend API errors
- Check EB logs: `eb logs`
- Verify DATABASE_URL is set correctly
- Check security group allows traffic on port 8080

### Database connection issues
- Verify RDS security group allows inbound on 5432
- Check connection string format
- Ensure RDS is publicly accessible (for testing)

### CORS errors
- Update CORS_ORIGIN environment variable
- Include your Amplify URL

---

## 📚 Useful Links

- AWS Amplify Console: https://console.aws.amazon.com/amplify
- AWS Elastic Beanstalk: https://console.aws.amazon.com/elasticbeanstalk
- AWS RDS: https://console.aws.amazon.com/rds
- AWS Free Tier: https://aws.amazon.com/free

---

**Ready to deploy? Let's start with Part 1! 🚀**

