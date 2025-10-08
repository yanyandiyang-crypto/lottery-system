# AWS Environment Variables

## Required Environment Variables

### Backend (Elastic Beanstalk)

```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://lottery_admin:PASSWORD@endpoint.rds.amazonaws.com:5432/postgres
JWT_SECRET=00130fc95f7437bc6e24ad416830110b5a57605df247b34b501253e9c57f00d6782ce19c709a6a86db5642749347b0ad757336d9182ba6cacce5b11ccf08f590
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://master.xxxxx.amplifyapp.com,http://localhost:3000
```

### Frontend (Amplify)

```bash
REACT_APP_API_URL=https://lottery-backend-prod.elasticbeanstalk.com
```

---

## How to Set Environment Variables

### Method 1: Using EB CLI (Recommended)

```bash
eb setenv NODE_ENV=production \
  PORT=8080 \
  DATABASE_URL="postgresql://lottery_admin:PASSWORD@endpoint.rds.amazonaws.com:5432/postgres" \
  JWT_SECRET="your_jwt_secret_here" \
  BCRYPT_ROUNDS=10 \
  CORS_ORIGIN="https://master.xxxxx.amplifyapp.com,http://localhost:3000"
```

### Method 2: Using AWS Console

**For Elastic Beanstalk:**
1. Go to AWS Console → Elastic Beanstalk
2. Select your environment
3. Configuration → Software
4. Scroll to "Environment properties"
5. Add each variable

**For Amplify:**
1. Go to AWS Console → Amplify
2. Select your app
3. Environment variables (left sidebar)
4. Add variables

### Method 3: Using Configuration File

Create `.ebextensions/environment.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
    BCRYPT_ROUNDS: 10
```

⚠️ **Do NOT put sensitive data (DATABASE_URL, JWT_SECRET) in config files!**

---

## Getting Your Values

### DATABASE_URL (RDS Connection String)

After creating RDS instance:

1. Go to RDS Console
2. Select your database
3. Copy the "Endpoint"
4. Format: `postgresql://[username]:[password]@[endpoint]:5432/[database]`

Example:
```
postgresql://lottery_admin:MySecurePass123@lottery-db.xxxx.us-east-1.rds.amazonaws.com:5432/postgres
```

### CORS_ORIGIN (Amplify Frontend URL)

After deploying to Amplify:

1. Go to Amplify Console
2. Your app URL will be shown
3. Copy the URL (e.g., `https://master.d1a2b3c4.amplifyapp.com`)
4. Add to CORS_ORIGIN

### JWT_SECRET

Already generated: ✅
```
00130fc95f7437bc6e24ad416830110b5a57605df247b34b501253e9c57f00d6782ce19c709a6a86db5642749347b0ad757336d9182ba6cacce5b11ccf08f590
```

---

## Verify Environment Variables

### For Elastic Beanstalk:

```bash
# View all environment variables
eb printenv

# SSH and check
eb ssh
printenv | grep NODE_ENV
```

### For Amplify:

Check in AWS Console → Amplify → Environment variables

---

## Complete Setup Commands

```bash
# 1. Set backend environment variables
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  DATABASE_URL="YOUR_RDS_CONNECTION_STRING" \
  JWT_SECRET="00130fc95f7437bc6e24ad416830110b5a57605df247b34b501253e9c57f00d6782ce19c709a6a86db5642749347b0ad757336d9182ba6cacce5b11ccf08f590" \
  BCRYPT_ROUNDS=10 \
  CORS_ORIGIN="YOUR_AMPLIFY_URL,http://localhost:3000"

# 2. Restart environment
eb restart

# 3. Check status
eb status

# 4. View logs
eb logs
```

