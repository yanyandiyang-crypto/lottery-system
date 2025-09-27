# Solution 1: Complete Data Migration Guide

## Problem Analysis
The `pg_restore` command is failing due to:
1. **Duplicate key violations** - Data already exists in Render database
2. **Column mismatches** - Schema differences between local and Render
3. **Permission issues** - Can't disable system triggers
4. **Configuration errors** - Unrecognized parameters

## Solution 1: Clean Database + Proper Restore

### Step 1: Clean Render Database Completely
```bash
# Connect to Render database and drop all tables
psql "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO lottery_db_nqw0_user;
GRANT ALL ON SCHEMA public TO public;
"
```

### Step 2: Use Proper pg_restore Command
```bash
# Use these flags to avoid the errors:
pg_restore --verbose --no-owner --no-privileges --disable-triggers --data-only --single-transaction "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" "C:\Users\Lags\Desktop\pisting yawa 2\backups\lottery_backup_2025-09-27_21-10-42.backup"
```

### Step 3: Alternative - Schema + Data Separate
If Step 2 fails, try this approach:

```bash
# First restore schema only
pg_restore --verbose --no-owner --no-privileges --schema-only "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" "C:\Users\Lags\Desktop\pisting yawa 2\backups\lottery_backup_2025-09-27_21-10-42.backup"

# Then restore data only
pg_restore --verbose --no-owner --no-privileges --disable-triggers --data-only "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" "C:\Users\Lags\Desktop\pisting yawa 2\backups\lottery_backup_2025-09-27_21-10-42.backup"
```

## Solution 2: Use pgAdmin4 GUI (Recommended)

### Step 1: Open pgAdmin4
1. Open pgAdmin4
2. Connect to your Render database
3. Right-click on your database
4. Select "Restore..."

### Step 2: Configure Restore Settings
1. **Filename**: Select your backup file
2. **Format**: Custom
3. **Role name**: Leave empty
4. **Sections**:
   - ✅ Data
   - ✅ Schema
   - ❌ Pre-data (uncheck to avoid trigger issues)
   - ❌ Post-data (uncheck to avoid trigger issues)

### Step 3: Options Tab
- ✅ **Clean before restore** (IMPORTANT!)
- ✅ **Create database**
- ❌ **Single transaction** (uncheck to avoid timeout issues)
- ✅ **No owner**
- ✅ **No privileges**

## Solution 3: Automated Script

Run this script to handle everything automatically:

```bash
node clean-and-restore-database.js
```

## Verification Steps

After successful restore:

1. **Check data counts**:
```bash
node verify-data-migration.js
```

2. **Test backend connection**:
```bash
node test-render-connection.js
```

3. **Test frontend login**:
- Go to: https://lottery-system-gamma.vercel.app
- Try logging in with your credentials

## Expected Results

After successful migration:
- ✅ All tables created with proper schema
- ✅ All data migrated from local to Render
- ✅ Frontend can connect to backend
- ✅ Login works with existing credentials
- ✅ All lottery functionality restored

## Troubleshooting

If you still get errors:

1. **Permission denied**: Use `--no-owner --no-privileges` flags
2. **Duplicate keys**: Clean database first with DROP SCHEMA
3. **Column mismatches**: Use `--disable-triggers` flag
4. **Timeout issues**: Remove `--single-transaction` flag

## Quick Commands Summary

```bash
# Clean database
psql "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO lottery_db_nqw0_user; GRANT ALL ON SCHEMA public TO public;"

# Restore with proper flags
pg_restore --verbose --no-owner --no-privileges --disable-triggers --data-only --single-transaction "postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0" "C:\Users\Lags\Desktop\pisting yawa 2\backups\lottery_backup_2025-09-27_21-10-42.backup"
```
