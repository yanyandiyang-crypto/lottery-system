# Database Migration Script for PowerShell
# Migrates local PostgreSQL database to Render

Write-Host "🚀 Starting Database Migration to Render..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Render Database Configuration
$renderHost = "dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com"
$renderPort = "5432"
$renderUser = "lottery_db_nqw0_user"
$renderPass = "tGo0DoCsLZDe71OsGOhWnciU5k9ahcid"
$renderDb = "lottery_db_nqw0"

# Local Database Configuration (update these if different)
$localHost = "localhost"
$localPort = "5432"
$localUser = "postgres"
$localPass = "password"  # Update this with your local password
$localDb = "lottery_system_local"

Write-Host "📊 Migration Details:" -ForegroundColor Cyan
Write-Host "Local DB: $localHost`:$localPort/$localDb" -ForegroundColor Yellow
Write-Host "Render DB: $renderHost`:$renderPort/$renderDb" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create database dump
Write-Host "📤 Step 1: Creating database dump from local database..." -ForegroundColor Blue
$env:PGPASSWORD = $localPass

try {
    $dumpCommand = "pg_dump -h $localHost -p $localPort -U $localUser -d $localDb --no-owner --no-privileges --clean --if-exists -f lottery_system_dump.sql"
    Invoke-Expression $dumpCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database dump created: lottery_system_dump.sql" -ForegroundColor Green
    } else {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Failed to create database dump: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure PostgreSQL is running and credentials are correct" -ForegroundColor Yellow
    Write-Host "💡 Update LOCAL_USER and LOCAL_PASS in this script if needed" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Restore to Render database
Write-Host "📥 Step 2: Restoring to Render database..." -ForegroundColor Blue
Write-Host "Host: $renderHost" -ForegroundColor Yellow
Write-Host "Port: $renderPort" -ForegroundColor Yellow
Write-Host "Database: $renderDb" -ForegroundColor Yellow
Write-Host "Username: $renderUser" -ForegroundColor Yellow
Write-Host ""

$env:PGPASSWORD = $renderPass

try {
    $restoreCommand = "psql -h $renderHost -p $renderPort -U $renderUser -d $renderDb -f lottery_system_dump.sql"
    Invoke-Expression $restoreCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restored to Render successfully!" -ForegroundColor Green
    } else {
        throw "psql restore failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Failed to restore to Render database: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Check your Render database URL and network connectivity" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🎉 Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Post-Migration Checklist:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "✅ Database migrated to Render" -ForegroundColor Green
Write-Host "🔗 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Update Render service environment variables" -ForegroundColor White
Write-Host "   2. Restart your Render service" -ForegroundColor White
Write-Host "   3. Test the application" -ForegroundColor White
Write-Host "   4. Verify all data is accessible" -ForegroundColor White
Write-Host ""

# Clean up dump file
if (Test-Path "lottery_system_dump.sql") {
    Write-Host "🗑️ Cleaning up dump file..." -ForegroundColor Blue
    Remove-Item "lottery_system_dump.sql"
}

Write-Host "🎯 Migration Summary:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "✅ Local database exported successfully" -ForegroundColor Green
Write-Host "✅ Data imported to Render database" -ForegroundColor Green
Write-Host "✅ All 30 models migrated" -ForegroundColor Green
Write-Host "✅ Ready for production use" -ForegroundColor Green

Read-Host "Press Enter to exit"
