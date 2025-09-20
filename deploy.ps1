# PowerShell Deployment Script
Write-Host "🚀 Deploying Lottery System to Cloud..." -ForegroundColor Green

# Check if git is initialized
if (!(Test-Path ".git")) {
    Write-Host "❌ Git not initialized. Please run: git init" -ForegroundColor Red
    exit 1
}

# Check if we have commits
$commitCount = (git rev-list --count HEAD 2>$null)
if ($commitCount -eq 0) {
    Write-Host "❌ No commits found. Please commit your changes first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git repository ready with $commitCount commits" -ForegroundColor Green

# Check if remote is set
$remote = (git remote get-url origin 2>$null)
if ($remote) {
    Write-Host "✅ Remote repository: $remote" -ForegroundColor Green
    Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Go to https://render.com" -ForegroundColor White
        Write-Host "2. Sign up with GitHub" -ForegroundColor White
        Write-Host "3. Click New + Web Service" -ForegroundColor White
        Write-Host "4. Connect your GitHub repository" -ForegroundColor White
        Write-Host "5. Select lottery-system" -ForegroundColor White
        Write-Host "6. Render will auto-detect render.yaml" -ForegroundColor White
        Write-Host "7. Click Create Web Service" -ForegroundColor White
        Write-Host ""
        Write-Host "💰 Cost: $0/month (Free hosting + PostgreSQL)" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    }
} else {
    Write-Host "❌ No remote repository set" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Please follow these steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://github.com" -ForegroundColor White
    Write-Host "2. Click New repository" -ForegroundColor White
    Write-Host "3. Name: lottery-system" -ForegroundColor White
    Write-Host "4. Make it Public" -ForegroundColor White
    Write-Host "5. Do not add README" -ForegroundColor White
    Write-Host "6. Click Create repository" -ForegroundColor White
    Write-Host "7. Copy the commands GitHub shows you" -ForegroundColor White
    Write-Host "8. Run them in this terminal" -ForegroundColor White
}