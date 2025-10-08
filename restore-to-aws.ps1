# Restore Database Backup to AWS RDS
# Automated script for easy restoration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restore Database to AWS RDS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlCheck = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCheck) {
    Write-Host "ERROR: psql command not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit
}

Write-Host "PostgreSQL client found:" $psqlCheck.Source -ForegroundColor Green
Write-Host ""

# Get RDS connection details
Write-Host "Enter AWS RDS Connection Details:" -ForegroundColor Yellow
Write-Host ""

$RDS_HOST = Read-Host "RDS Endpoint (e.g., lottery.xxxxx.us-east-1.rds.amazonaws.com)"
if ([string]::IsNullOrWhiteSpace($RDS_HOST)) {
    Write-Host "ERROR: RDS endpoint is required!" -ForegroundColor Red
    pause
    exit
}

$RDS_USER = Read-Host "Username (press Enter for 'postgres')"
if ([string]::IsNullOrWhiteSpace($RDS_USER)) { 
    $RDS_USER = "postgres" 
}

$RDS_DB = Read-Host "Database name (press Enter for 'postgres')"
if ([string]::IsNullOrWhiteSpace($RDS_DB)) { 
    $RDS_DB = "postgres" 
}

$RDS_PASSWORD = Read-Host "Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($RDS_PASSWORD)
$env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGSSLMODE = "require"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Test connection first
Write-Host "Testing connection to AWS RDS..." -ForegroundColor Yellow
$testResult = psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Connection successful!" -ForegroundColor Green
} else {
    Write-Host "Connection failed!" -ForegroundColor Red
    Write-Host "Error: $testResult" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. RDS endpoint is correct" -ForegroundColor White
    Write-Host "  2. Security group allows your IP" -ForegroundColor White
    Write-Host "  3. Username and password are correct" -ForegroundColor White
    Write-Host "  4. RDS is publicly accessible" -ForegroundColor White
    Write-Host ""
    Write-Host "See FIX_RDS_TIMEOUT.md and AWS_RDS_SSL_FIX.md for help" -ForegroundColor Cyan
    $env:PGPASSWORD = ""
    $env:PGSSLMODE = ""
    pause
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Select backup file
Write-Host "Available backup files:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. backup-2025-09-28T02-00-00-215Z.sql (Most recent - Recommended)" -ForegroundColor Green
Write-Host "2. backup-2025-09-25T02-00-00-325Z.sql" -ForegroundColor White
Write-Host "3. pg-dump-complete-2025-09-25.sql (Complete dump)" -ForegroundColor White
Write-Host "4. pg-dump-schema-only-2025-09-25.sql (Schema only)" -ForegroundColor White
Write-Host "5. pg-dump-data-only-2025-09-25.sql (Data only)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select backup to restore (1-5, default is 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

$BACKUP_FILE = switch ($choice) {
    "1" { "backups\backup-2025-09-28T02-00-00-215Z.sql" }
    "2" { "backups\backup-2025-09-25T02-00-00-325Z.sql" }
    "3" { "backups\pg-dump-complete-2025-09-25.sql" }
    "4" { "backups\pg-dump-schema-only-2025-09-25.sql" }
    "5" { "backups\pg-dump-data-only-2025-09-25.sql" }
    default { "backups\backup-2025-09-28T02-00-00-215Z.sql" }
}

# Check if file exists
if (-not (Test-Path $BACKUP_FILE)) {
    Write-Host "ERROR: Backup file not found: $BACKUP_FILE" -ForegroundColor Red
    $env:PGPASSWORD = ""
    $env:PGSSLMODE = ""
    pause
    exit
}

$fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
Write-Host ""
Write-Host "Selected file: $BACKUP_FILE" -ForegroundColor Cyan
Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
Write-Host ""

# Confirmation
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "READY TO RESTORE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  From: $BACKUP_FILE" -ForegroundColor White
Write-Host "  To:   $RDS_HOST" -ForegroundColor White
Write-Host "  DB:   $RDS_DB" -ForegroundColor White
Write-Host "  User: $RDS_USER" -ForegroundColor White
Write-Host ""
Write-Host "WARNING: This will modify the database!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    $env:PGPASSWORD = ""
    $env:PGSSLMODE = ""
    pause
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting restore..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Execute restore
$startTime = Get-Date

try {
    psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f $BACKUP_FILE --set ON_ERROR_STOP=off
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RESTORE COMPLETED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Duration: $($duration.Minutes) minutes, $($duration.Seconds) seconds" -ForegroundColor Gray
    Write-Host ""
    
    # Verify data
    Write-Host "Verifying restore..." -ForegroundColor Yellow
    
    $tableCount = psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
    
    if ($tableCount) {
        Write-Host "Tables found: $($tableCount.Trim())" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify data in pgAdmin 4" -ForegroundColor White
    Write-Host "  2. Update Elastic Beanstalk DATABASE_URL" -ForegroundColor White
    Write-Host "  3. Run: eb setenv DATABASE_URL='...'" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ERROR DURING RESTORE" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host "Some errors may be normal (e.g., 'relation already exists')" -ForegroundColor Gray
}

# Cleanup
$env:PGPASSWORD = ""
$env:PGSSLMODE = ""

Write-Host ""
pause

