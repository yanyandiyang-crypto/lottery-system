@echo off
echo GitHub Auto-Sync Starting...

echo Checking git status...
git status --porcelain > temp_status.txt
set /p has_changes=<temp_status.txt
del temp_status.txt

if "%has_changes%"=="" (
    echo No changes to commit. Repository is up to date.
    echo Repository: https://github.com/yanyandiyang-crypto/lottery-system
    pause
    exit /b 0
)

echo Adding changes...
git add .

echo Committing changes...
for /f "tokens=1-6 delims=/: " %%a in ("%date% %time%") do (
    set timestamp=%%c-%%a-%%b %%d:%%e:%%f
)
git commit -m "Auto-sync: %timestamp% - Lottery system updates"

echo Pushing to GitHub...
git push origin master

if %errorlevel% equ 0 (
    echo Sync complete!
    echo Repository: https://github.com/yanyandiyang-crypto/lottery-system
) else (
    echo Error pushing to GitHub!
    echo Try running: git push origin master --force-with-lease
)

pause
