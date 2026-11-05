@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Khazar League Torneo AutoBot - adi Chrome rejimi
echo.

python -m pip install -r requirements.txt
if errorlevel 1 (
  echo Python paketleri qurasdirila bilmedi.
  pause
  exit /b 1
)

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Google Chrome tapilmadi. Chrome qurasdirildigini yoxla.
  pause
  exit /b 1
)

echo.
echo Ayrica Chrome profili acilir. Google/Torneo hesabina ozun daxil ol.
start "" "%CHROME%" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\TorneoAutoBotChrome" --no-first-run --no-default-browser-check
timeout /t 5 /nobreak >nul
python torneo_bot.py
pause
