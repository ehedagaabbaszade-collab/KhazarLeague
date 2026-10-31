@echo off
setlocal
set PROJECT_DIR=C:\KhazarLeague
set BACKEND_PORT=3000
set FRONTEND_PORT=4173
echo ========================================
echo KHAZAR LEAGUE 2026
echo ========================================
cd /d "%PROJECT_DIR%" || (echo Project folder not found: %PROJECT_DIR% & pause & exit /b 1)
node --version >nul 2>&1 || (echo Node.js 18+ is required. & pause & exit /b 1)

if not exist "node_modules\express" (
  echo Installing backend dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 (echo Backend dependency installation failed. & pause & exit /b 1)
)
if not exist "frontend\node_modules\vite" (
  echo Installing frontend dependencies...
  pushd frontend
  call npm install --no-audit --no-fund
  if errorlevel 1 (popd & echo Frontend dependency installation failed. & pause & exit /b 1)
  popd
)
echo Building frontend...
pushd frontend
call npm run build
if errorlevel 1 (popd & echo Frontend build failed. & pause & exit /b 1)
popd

echo Starting backend...
start "Khazar League Backend" cmd /c "cd /d %PROJECT_DIR% && node backend\server.js"
timeout /t 2 /nobreak >nul
echo Starting frontend...
start "Khazar League Frontend" cmd /c "cd /d %PROJECT_DIR%\frontend && npm run preview -- --host 0.0.0.0"
timeout /t 3 /nobreak >nul
echo.
echo Public website: http://localhost:%FRONTEND_PORT%
echo Admin login: http://localhost:%FRONTEND_PORT%/login
echo API health: http://localhost:%BACKEND_PORT%/api/health
echo.
echo First run: change the default administrator password before exposing the site to the internet.
pause
