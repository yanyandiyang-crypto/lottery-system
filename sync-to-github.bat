@echo off
echo 🚀 Syncing to GitHub...
echo.

echo 📋 Checking status...
git status

echo.
echo 📤 Adding all changes...
git add .

echo.
echo 💾 Committing changes...
git commit -m "Auto-sync: %date% %time%"

echo.
echo 🚀 Pushing to GitHub...
git push origin master

echo.
echo ✅ Sync complete!
echo 🌐 Repository: https://github.com/yanyandiyang-crypto/lottery-system
pause
