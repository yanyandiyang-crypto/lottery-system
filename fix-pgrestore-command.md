# 🔧 Fix pg_restore Command Error

## ❌ **The Problem:**
```
pg_restore: error: options -c/--clean and -a/--data-only cannot be used together
```

## ✅ **The Solution:**

### **Option 1: Use --clean without --data-only (Recommended)**
```bash
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --clean --if-exists \
  your_backup_file.sql
```

### **Option 2: Use --data-only without --clean**
```bash
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --data-only \
  your_backup_file.sql
```

### **Option 3: Manual Clean + Data Restore (Safest)**
```bash
# Step 1: Clean the database first
psql -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Step 2: Restore data only
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --data-only \
  your_backup_file.sql
```

## 🎯 **Recommended Approach:**

### **Method 1: Use pgAdmin4 (Easiest)**
1. **Open pgAdmin4**
2. **Connect to Render database**
3. **Right-click database** → **Restore**
4. **Select backup file**
5. **Uncheck "Clean Before Restore"** (since we want data only)
6. **Check "Data Only"**
7. **Click Restore**

### **Method 2: Use psql for SQL files**
If your backup is a `.sql` file:
```bash
psql -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  -f your_backup_file.sql
```

## 🔍 **What Each Option Does:**

- **`--clean`**: Drops existing objects before restoring
- **`--data-only`**: Only restores data, not schema
- **`--if-exists`**: Only drops objects if they exist

## 💡 **Why This Happens:**
The `--clean` option tries to drop schema objects, but `--data-only` says "don't touch schema", so they conflict.

## 🚀 **Quick Fix:**
Just remove `--clean` from your command:
```bash
pg_restore -h dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com \
  -p 5432 \
  -U lottery_db_nqw0_user \
  -d lottery_db_nqw0 \
  --data-only \
  your_backup_file.sql
```

This will restore all your data without the schema conflicts!
