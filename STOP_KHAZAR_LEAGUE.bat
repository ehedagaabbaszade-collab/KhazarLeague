@echo off
REM Khazar League - Windows Stop Script
REM Stops only Khazar League related Node.js processes

echo ========================================
echo Khazar League - Stopping Servers
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "C:\KhazarLeague\STOP_KHAZAR_LEAGUE.ps1"

echo.
echo All Khazar League servers stopped.
echo ========================================
pause