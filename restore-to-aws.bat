@echo off
echo ========================================
echo   Restore Database to AWS RDS
echo ========================================
echo.
echo This will restore your local backup to AWS RDS PostgreSQL
echo.

powershell -ExecutionPolicy Bypass -File restore-to-aws.ps1

pause

