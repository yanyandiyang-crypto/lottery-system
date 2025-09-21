# Enhanced GitHub Auto-Sync PowerShell Script
param(
    [string]$CommitMessage = "",
    [switch]$Force = $false
)

Write-Host "🚀 Enhanced GitHub Auto-Sync Starting..." -ForegroundColor Green
Write-Host ""

# Check if we're in a git repository
try {
    $gitStatus = git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not in a git repository"
    }
} catch {
    Write-Host "❌ Error: Not in a git repository!" -ForegroundColor Red
    Write-Host "Please run this script from your project directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Cyan
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ No changes to commit. Repository is up to date." -ForegroundColor Green
    Write-Host "🌐 Repository: https://github.com/yanyandiyang-crypto/lottery-system" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host "📤 Changes detected! Adding all changes..." -ForegroundColor Cyan
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error adding files to git!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create commit message
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "Auto-sync: $timestamp - Updated lottery system"
}

Write-Host "💾 Committing changes..." -ForegroundColor Cyan
Write-Host "📝 Commit message: $CommitMessage" -ForegroundColor Yellow
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error committing changes!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
if ($Force) {
    git push origin master --force-with-lease
} else {
    git push origin master
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error pushing to GitHub!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection" -ForegroundColor White
    Write-Host "2. Verify GitHub credentials" -ForegroundColor White
    Write-Host "3. Check if you have push permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 You can also try: .\sync-to-github.ps1 -Force" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "✅ Sync complete!" -ForegroundColor Green
Write-Host "🌐 Repository: https://github.com/yanyandiyang-crypto/lottery-system" -ForegroundColor Blue
Write-Host "📝 Commit: $CommitMessage" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 All changes have been successfully pushed to GitHub!" -ForegroundColor Green
Read-Host "Press Enter to exit"
