# Restore SQL Backups to AWS RDS

## 📦 Your Available Backups

You have these backup files:
```
✅ backup-2025-09-28T02-00-00-215Z.sql (Most recent)
✅ backup-2025-09-25T02-00-00-325Z.sql
✅ pg-dump-complete-2025-09-25.sql (Complete dump)
✅ pg-dump-compressed-2025-09-25.sql.gz (Compressed)
✅ pg-dump-data-only-2025-09-25.sql (Data only)
✅ pg-dump-schema-only-2025-09-25.sql (Schema only)
```

---

## 🎯 Quick Start - Restore Latest Backup

### Method 1: Using psql (Command Line) - Recommended ⭐

**Step 1: Set your AWS RDS connection string**

```powershell
# PowerShell
$env:PGPASSWORD="your_rds_password"
$RDS_HOST="your-database.xxxxx.us-east-1.rds.amazonaws.com"
$RDS_USER="postgres"
$RDS_DB="postgres"
```

**Step 2: Restore the backup**

```powershell
# Go to your project directory
cd "d:\para flutter mag flutterv2"

# Restore the most recent backup
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f "backups\backup-2025-09-28T02-00-00-215Z.sql"
```

**That's it!** ✅

---

## Method 2: Using pgAdmin 4 (GUI) - Easy for Beginners

### Step 1: Connect to AWS RDS in pgAdmin

Make sure you're connected to your AWS RDS (follow the SSL fix we did earlier).

### Step 2: Restore Backup

1. **In pgAdmin:**
   - Right-click on your **database** (usually `postgres`)
   - Click **"Restore..."**

2. **Restore Dialog:**
   ```
   Format: Plain
   Filename: [Browse to] d:\para flutter mag flutterv2\backups\backup-2025-09-28T02-00-00-215Z.sql
   ```

3. **Restore Options Tab:**
   - ✅ Pre-data (schema)
   - ✅ Data
   - ✅ Post-data (indexes, constraints)

4. **Click "Restore"**

5. **Wait** for completion (check pgAdmin bottom-right for progress)

---

## Method 3: Step-by-Step PowerShell Script

I'll create an automated script for you:

### restore-to-aws.ps1

Save and run this script:

```powershell
# Configuration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restore Database to AWS RDS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get RDS connection details
$RDS_HOST = Read-Host "Enter RDS endpoint (e.g., lottery.xxxxx.us-east-1.rds.amazonaws.com)"
$RDS_USER = Read-Host "Enter username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($RDS_USER)) { $RDS_USER = "postgres" }

$RDS_DB = Read-Host "Enter database name (default: postgres)"
if ([string]::IsNullOrWhiteSpace($RDS_DB)) { $RDS_DB = "postgres" }

$RDS_PASSWORD = Read-Host "Enter password" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($RDS_PASSWORD)
)

# Select backup file
Write-Host ""
Write-Host "Available backups:" -ForegroundColor Yellow
Write-Host "1. backup-2025-09-28T02-00-00-215Z.sql (Most recent)" -ForegroundColor White
Write-Host "2. backup-2025-09-25T02-00-00-325Z.sql" -ForegroundColor White
Write-Host "3. pg-dump-complete-2025-09-25.sql" -ForegroundColor White
Write-Host "4. pg-dump-compressed-2025-09-25.sql.gz" -ForegroundColor White

$choice = Read-Host "Select backup (1-4)"

$BACKUP_FILE = switch ($choice) {
    "1" { "backups\backup-2025-09-28T02-00-00-215Z.sql" }
    "2" { "backups\backup-2025-09-25T02-00-00-325Z.sql" }
    "3" { "backups\pg-dump-complete-2025-09-25.sql" }
    "4" { "backups\pg-dump-compressed-2025-09-25.sql.gz" }
    default { "backups\backup-2025-09-28T02-00-00-215Z.sql" }
}

Write-Host ""
Write-Host "Restoring: $BACKUP_FILE" -ForegroundColor Cyan
Write-Host "To: $RDS_HOST" -ForegroundColor Cyan
Write-Host ""

# Handle compressed file
if ($BACKUP_FILE -like "*.gz") {
    Write-Host "Decompressing..." -ForegroundColor Yellow
    & "C:\Program Files\7-Zip\7z.exe" x $BACKUP_FILE -o"backups\" -y
    $BACKUP_FILE = $BACKUP_FILE -replace ".gz", ""
}

# Restore
Write-Host "Starting restore..." -ForegroundColor Yellow

try {
    psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f $BACKUP_FILE --set ON_ERROR_STOP=off
    
    Write-Host ""
    Write-Host "✅ Restore completed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Error during restore: $($_.Exception.Message)" -ForegroundColor Red
}

# Clear password
$env:PGPASSWORD = ""

Write-Host ""
pause
```

---

## Detailed Instructions for Each Backup Type

### 1. Regular SQL Files (.sql)

```powershell
# Set password (so you don't have to type it repeatedly)
$env:PGPASSWORD="your_password"

# Restore schema first
psql -h your-rds-endpoint.rds.amazonaws.com `
     -U postgres `
     -d postgres `
     -f "backups\pg-dump-schema-only-2025-09-25.sql"

# Then restore data
psql -h your-rds-endpoint.rds.amazonaws.com `
     -U postgres `
     -d postgres `
     -f "backups\pg-dump-data-only-2025-09-25.sql"

# Clear password
$env:PGPASSWORD=""
```

### 2. Compressed Files (.sql.gz)

**First decompress:**

```powershell
# Using 7-Zip (if installed)
& "C:\Program Files\7-Zip\7z.exe" x "backups\pg-dump-compressed-2025-09-25.sql.gz"

# OR using PowerShell (built-in)
# For .gz files, you need gunzip or 7-zip
```

**Then restore:**

```powershell
psql -h your-rds-endpoint.rds.amazonaws.com `
     -U postgres `
     -d postgres `
     -f "backups\pg-dump-compressed-2025-09-25.sql"
```

### 3. Complete Backup (All-in-One)

```powershell
psql -h your-rds-endpoint.rds.amazonaws.com `
     -U postgres `
     -d postgres `
     -f "backups\backup-2025-09-28T02-00-00-215Z.sql"
```

---

## Important: Prerequisites

### Install PostgreSQL Client Tools

If you don't have `psql` command:

1. **Download PostgreSQL:**
   - https://www.postgresql.org/download/windows/

2. **Install** (you only need the command-line tools)

3. **Add to PATH:**
   - Default location: `C:\Program Files\PostgreSQL\16\bin`
   - Add to Windows PATH environment variable

4. **Verify:**
   ```powershell
   psql --version
   ```

---

## Step-by-Step: First Time Restore

### Step 1: Prepare AWS RDS

```sql
-- Connect to RDS first
psql -h your-endpoint.rds.amazonaws.com -U postgres -d postgres

-- Create a fresh database for your lottery system (optional)
CREATE DATABASE lottery_system;

-- Exit
\q
```

### Step 2: Restore to New Database

```powershell
# Restore to lottery_system database
psql -h your-endpoint.rds.amazonaws.com `
     -U postgres `
     -d lottery_system `
     -f "backups\backup-2025-09-28T02-00-00-215Z.sql"
```

### Step 3: Update Environment Variables

```bash
# Update DATABASE_URL in Elastic Beanstalk
eb setenv DATABASE_URL="postgresql://postgres:password@your-endpoint.rds.amazonaws.com:5432/lottery_system?sslmode=require"
```

---

## Alternative: Using pg_restore (for custom format backups)

If you have `.dump` or custom format files:

```powershell
pg_restore -h your-endpoint.rds.amazonaws.com `
           -U postgres `
           -d postgres `
           -v `
           "backups\your-backup.dump"
```

---

## Connection String Format

For all commands, replace these:

```
Host:     your-database.xxxxx.us-east-1.rds.amazonaws.com
Port:     5432
Username: postgres (or your master username)
Password: your_rds_password
Database: postgres (or lottery_system)
SSL:      Add ?sslmode=require to connection string
```

---

## Verify Restore Success

After restoring, check if data is there:

```powershell
# Connect to RDS
psql -h your-endpoint.rds.amazonaws.com -U postgres -d postgres

# Check tables
\dt

# Check users table
SELECT COUNT(*) FROM users;

# Check draws
SELECT COUNT(*) FROM draws;

# Exit
\q
```

---

## Troubleshooting

### Error: "psql: command not found"

**Fix:** Install PostgreSQL client tools (see Prerequisites above)

### Error: "password authentication failed"

**Fix:** Double-check your RDS master password

### Error: "SSL required"

**Fix:** Add `?sslmode=require` to connection or set:
```powershell
$env:PGSSLMODE="require"
```

### Error: "database does not exist"

**Fix:** Create database first:
```sql
CREATE DATABASE lottery_system;
```

### Error: "permission denied"

**Fix:** Make sure you're using the master username (usually `postgres`)

### Warning: "relation already exists"

**This is OK!** It just means some tables are already there. The restore will continue.

---

## Automated Restore Script

Save this as `restore-latest-backup.bat`:

```batch
@echo off
echo Restoring latest backup to AWS RDS...
echo.

set /p RDS_HOST="Enter RDS endpoint: "
set /p RDS_USER="Enter username (default postgres): "
if "%RDS_USER%"=="" set RDS_USER=postgres

set /p RDS_PASSWORD="Enter password: "
set PGPASSWORD=%RDS_PASSWORD%

echo.
echo Restoring backup-2025-09-28T02-00-00-215Z.sql...
echo.

psql -h %RDS_HOST% -U %RDS_USER% -d postgres -f "backups\backup-2025-09-28T02-00-00-215Z.sql"

set PGPASSWORD=

echo.
echo Done!
pause
```

Run it:
```
restore-latest-backup.bat
```

---

## Best Practices

1. ✅ **Test first:** Restore to a test database
2. ✅ **Backup RDS:** Take RDS snapshot before restoring
3. ✅ **Check compatibility:** Ensure PostgreSQL versions match
4. ✅ **Use transactions:** For safety
5. ✅ **Monitor:** Check RDS CloudWatch during restore

---

## Quick Reference Commands

```powershell
# Restore full backup
psql -h HOST -U USER -d DATABASE -f backup.sql

# Restore with error checking
psql -h HOST -U USER -d DATABASE -f backup.sql --set ON_ERROR_STOP=on

# Restore quietly (less output)
psql -h HOST -U USER -d DATABASE -f backup.sql -q

# Restore with variables
psql -h HOST -U USER -d DATABASE -f backup.sql -v ON_ERROR_STOP=1

# Check what's in backup (don't execute)
psql -h HOST -U USER -d DATABASE -f backup.sql --single-transaction --dry-run
```

---

## Need Help?

If you run into issues:

1. Check `FIX_RDS_TIMEOUT.md` for connection issues
2. Check `AWS_RDS_SSL_FIX.md` for SSL problems
3. Verify RDS is running in AWS Console
4. Check CloudWatch logs in AWS

---

**Ready to restore? Use Method 1 (psql) for fastest results!** 🚀

