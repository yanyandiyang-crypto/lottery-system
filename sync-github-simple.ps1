# Simple GitHub Sync Script
Write-Host "🚀 GitHub Auto-Sync Starting..." -ForegroundColor Green

# Check git status
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ No changes to commit. Repository is up to date." -ForegroundColor Green
    exit 0
}

Write-Host "📤 Adding changes..." -ForegroundColor Cyan
git add .

Write-Host "💾 Committing changes..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMsg = "Auto-sync: $timestamp - Lottery system updates"
git commit -m $commitMsg

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sync complete!" -ForegroundColor Green
    Write-Host "🌐 Repository: https://github.com/yanyandiyang-crypto/lottery-system" -ForegroundColor Blue
} else {
    Write-Host "❌ Error pushing to GitHub!" -ForegroundColor Red
    Write-Host "Try running: git push origin master --force-with-lease" -ForegroundColor Yellow
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
