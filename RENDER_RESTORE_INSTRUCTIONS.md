# 🚀 Render Database Restore Instructions

## 📋 **Current Status**
- ✅ New Render database created: `lottery_db_5m56`
- ✅ Schema applied (31 tables created)
- ✅ Ready for data restoration

## 🎯 **Method 1: pgAdmin4 (Recommended)**

### Step 1: Open pgAdmin4
- Launch pgAdmin4 application

### Step 2: Connect to New Render Database
- **Right-click** "Servers" → **Create** → **Server**
- **General Tab**:
  - Name: `Render Lottery DB`
- **Connection Tab**:
  - Host: `dpg-d3bussb7mgec73a2p5sg-a.oregon-postgres.render.com`
  - Port: `5432`
  - Database: `lottery_db_5m56`
  - Username: `lottery_db_5m56_user`
  - Password: `1zMsrPkB0sJycCFWK7z25BuWR8DQeUE4`
- **Click**: Save

### Step 3: Restore Data
- **Right-click** on `lottery_db_5m56` database
- **Select**: "Restore..."
- **Filename**: Browse to `NEW27back.sql`
- **Options Tab**:
  - ✅ Check "Clean before restore"
  - ✅ Check "Create database"
  - ✅ Check "Data only" (since schema already exists)
- **Click**: Restore

## 🎯 **Method 2: Alternative - Use Online Tools**

If pgAdmin4 doesn't work, you can:

1. **Export NEW27back.sql to SQL format** using pgAdmin4
2. **Use our Node.js script** to restore the SQL data

## 📋 **After Successful Restore**

### 1. Update Render Backend Environment
- Go to: https://dashboard.render.com
- Find: "lottery-backend" service
- Go to: Environment tab
- Update `DATABASE_URL` to:
```
postgresql://lottery_db_5m56_user:1zMsrPkB0sJycCFWK7z25BuWR8DQeUE4@dpg-d3bussb7mgec73a2p5sg-a.oregon-postgres.render.com/lottery_db_5m56
```

### 2. Redeploy Backend
- Click "Manual Deploy" or push new commit

### 3. Test Frontend
- Visit: https://lottery-system-gamma.vercel.app
- Try logging in with your credentials

## 🔧 **Database Connection Details**
```
Host: dpg-d3bussb7mgec73a2p5sg-a.oregon-postgres.render.com
Port: 5432
Database: lottery_db_5m56
Username: lottery_db_5m56_user
Password: 1zMsrPkB0sJycCFWK7z25BuWR8DQeUE4
```

## ✅ **Expected Result**
After restore, you should have:
- All your users (superadmin, etc.)
- All your tickets and draws
- All your betting data
- Working login on Vercel frontend
