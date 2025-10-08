# AWS RDS Connection Diagnostic Tool
# Run this to check if your RDS is accessible

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AWS RDS Connection Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get RDS endpoint from user
$RDS_ENDPOINT = Read-Host "Enter your RDS endpoint (e.g., lottery-db.xxxxx.us-east-1.rds.amazonaws.com)"

if ([string]::IsNullOrWhiteSpace($RDS_ENDPOINT)) {
    Write-Host "No endpoint provided. Exiting..." -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "=== Step 1: Getting Your Public IP ===" -ForegroundColor Yellow

try {
    $MY_IP = (Invoke-RestMethod -Uri "https://api.ipify.org?format=json").ip
    Write-Host "Your public IP: $MY_IP" -ForegroundColor Green
    Write-Host "This IP must be allowed in RDS Security Group" -ForegroundColor Gray
} catch {
    Write-Host "Could not detect IP automatically" -ForegroundColor Yellow
    $MY_IP = Read-Host "Enter your public IP manually"
}

Write-Host ""
Write-Host "=== Step 2: Testing Connection to RDS ===" -ForegroundColor Yellow
Write-Host "Testing: $RDS_ENDPOINT on port 5432..." -ForegroundColor Gray

$result = $null
try {
    $result = Test-NetConnection -ComputerName $RDS_ENDPOINT -Port 5432 -WarningAction SilentlyContinue
    
    Write-Host ""
    if ($result.TcpTestSucceeded) {
        Write-Host "SUCCESS! Port 5432 is REACHABLE" -ForegroundColor Green
        Write-Host ""
        Write-Host "You should be able to connect with pgAdmin 4!" -ForegroundColor Green
        Write-Host ""
        Write-Host "pgAdmin Connection Settings:" -ForegroundColor Cyan
        Write-Host "  Host:     $RDS_ENDPOINT" -ForegroundColor White
        Write-Host "  Port:     5432" -ForegroundColor White
        Write-Host "  Database: postgres" -ForegroundColor White
        Write-Host "  Username: lottery_admin" -ForegroundColor White
        Write-Host "  Password: [your password]" -ForegroundColor White
    } else {
        Write-Host "FAILED! Port 5432 is BLOCKED" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common causes:" -ForegroundColor Yellow
        Write-Host "  1. RDS Security Group does not allow your IP ($MY_IP)" -ForegroundColor Yellow
        Write-Host "  2. RDS is not publicly accessible" -ForegroundColor Yellow
        Write-Host "  3. Wrong endpoint address" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Fixes:" -ForegroundColor Cyan
        Write-Host "  1. Go to AWS Console > RDS > Your Database" -ForegroundColor White
        Write-Host "  2. Click on VPC Security Group" -ForegroundColor White
        Write-Host "  3. Edit Inbound Rules > Add Rule:" -ForegroundColor White
        Write-Host "     Type: PostgreSQL, Port: 5432, Source: My IP" -ForegroundColor White
        Write-Host "  4. In RDS, click Modify > Public access: Yes" -ForegroundColor White
        Write-Host ""
        Write-Host "See FIX_RDS_TIMEOUT.md for detailed instructions" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Error testing connection: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Step 3: DNS Resolution ===" -ForegroundColor Yellow

try {
    $dns = Resolve-DnsName -Name $RDS_ENDPOINT -ErrorAction Stop
    Write-Host "DNS resolves correctly" -ForegroundColor Green
    Write-Host "IP Address: $($dns.IPAddress)" -ForegroundColor Gray
} catch {
    Write-Host "DNS resolution failed - check your endpoint address" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostics Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "Summary:" -ForegroundColor White
Write-Host "  Your IP:      $MY_IP" -ForegroundColor Gray
Write-Host "  RDS Endpoint: $RDS_ENDPOINT" -ForegroundColor Gray
if ($result -and $result.TcpTestSucceeded) {
    Write-Host "  Port 5432:    Open" -ForegroundColor Green
} else {
    Write-Host "  Port 5432:    Blocked" -ForegroundColor Red
}
Write-Host ""

if ($result -and -not $result.TcpTestSucceeded) {
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Open FIX_RDS_TIMEOUT.md" -ForegroundColor White
    Write-Host "  2. Follow Fix 1: Configure Security Group" -ForegroundColor White
    Write-Host "  3. Run this script again to verify" -ForegroundColor White
}

Write-Host ""
pause
