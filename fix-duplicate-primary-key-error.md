# 🔧 Fix Duplicate Primary Key Error

## ❌ **The Problem:**
```
ERROR: multiple primary keys for table "prize_configurations" are not allowed
ERROR: multiple primary keys for table "rate_limits" are not allowed
```

## 🎯 **Root Cause:**
The Render database already has some tables with primary keys, but your backup is trying to recreate them, causing conflicts.

## ✅ **Solutions:**

### **Solution 1: Use --no-owner --no-privileges (Recommended)**
```bash
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  your_backup_file.sql
```

### **Solution 2: Clean Database First, Then Restore**
```bash
# Step 1: Clean the database
psql -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Step 2: Restore schema first
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --schema-only \
  your_backup_file.sql

# Step 3: Restore data
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --data-only \
  your_backup_file.sql
```

### **Solution 3: Use pgAdmin4 (Easiest)**
1. **Open pgAdmin4**
2. **Connect to Render database**
3. **Right-click database** → **Restore**
4. **Select backup file**
5. **Options:**
   - ✅ **Data Only**
   - ✅ **No Owner**
   - ✅ **No Privileges**
   - ✅ **Disable Triggers**
   - ❌ **Clean Before Restore** (uncheck this)

### **Solution 4: Manual Table-by-Table Restore**
If the above doesn't work, restore specific tables:

```bash
# Restore only data for specific tables
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --data-only \
  --table=users \
  --table=tickets \
  --table=draws \
  --table=bets \
  your_backup_file.sql
```

## 🎯 **Recommended Approach:**

### **Method 1: Use pgAdmin4 (Safest)**
1. **Open pgAdmin4**
2. **Connect to Render database**
3. **Right-click database** → **Restore**
4. **Select backup file**
5. **Check these options:**
   - ✅ **Data Only**
   - ✅ **No Owner**
   - ✅ **No Privileges**
   - ✅ **Disable Triggers**
6. **Click Restore**

### **Method 2: Command Line with Flags**
```bash
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  your_backup_file.sql
```

## 💡 **Why This Happens:**
- Render database already has some tables with primary keys
- Your backup is trying to recreate the same primary keys
- PostgreSQL doesn't allow duplicate primary keys

## 🚀 **Quick Fix:**
Add `--no-owner --no-privileges --disable-triggers` to your pg_restore command to avoid these conflicts.

The `--disable-triggers` flag is especially important as it prevents foreign key constraint violations during the restore process.
