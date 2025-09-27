# Create New Render Database for Clean Restore

## Problem
The current Render database has schema conflicts when trying to restore NEW27back.sql due to existing tables and constraints.

## Solution: Create New Database

### Step 1: Create New Database on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"PostgreSQL"**
3. **Configure new database**:
   - **Name**: `lottery_db_clean` (or any name you prefer)
   - **Database**: `lottery_db_clean`
   - **User**: `lottery_db_clean_user`
   - **Region**: Same as current (Oregon)
   - **Plan**: Free tier

4. **Click "Create Database"**

### Step 2: Get New Database URL

After creation, you'll get a new connection string like:
```
postgresql://lottery_db_clean_user:NEW_PASSWORD@dpg-XXXXX-XXXXX.oregon-postgres.render.com/lottery_db_clean
```

### Step 3: Restore NEW27back.sql to New Database

**Option A: Using pgAdmin4**
1. **Connect to new database** using the new connection string
2. **Right-click database** → **Restore...**
3. **Select**: `NEW27back.sql`
4. **Check**: "Clean before restore"
5. **Click**: Restore

**Option B: Using pg_restore command**
```bash
set PGPASSWORD=NEW_PASSWORD
pg_restore --verbose --no-owner --no-privileges --clean --if-exists --dbname=lottery_db_clean --host=dpg-XXXXX-XXXXX.oregon-postgres.render.com --port=5432 --username=lottery_db_clean_user NEW27back.sql
```

### Step 4: Update Backend Configuration

1. **Update Render service environment variables**:
   - **DATABASE_URL**: New database connection string
2. **Redeploy backend service**

### Step 5: Test

1. **Test backend**: https://lottery-system-tna9.onrender.com/health
2. **Test frontend**: https://lottery-system-gamma.vercel.app
3. **Try login** with your restored credentials

## Benefits

✅ **Clean slate** - No schema conflicts  
✅ **Complete data** - All your data from NEW27back.sql  
✅ **No errors** - Fresh database structure  
✅ **Reliable** - Standard PostgreSQL restore process  

## Current Status

❌ **Current Render DB**: Has schema conflicts  
✅ **Local DB**: Fully restored with all data  
🎯 **Next**: Create new Render DB and restore cleanly  

Would you like me to help you with the steps once you create the new database?
