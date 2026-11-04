@echo off
setlocal
set PROJECT_DIR=%~dp0
set BACKEND_PORT=3000
set FRONTEND_PORT=4174
echo ========================================
echo KHAZAR LEAGUE 2.0 DESIGN PREVIEW
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
echo Starting backend...
start "Khazar League Backend" cmd /c "cd /d %PROJECT_DIR% && node backend\server.js"
timeout /t 2 /nobreak >nul
echo Starting local Vite preview...
start "Khazar League Frontend" cmd /c "cd /d %PROJECT_DIR%\frontend && set VITE_API_BASE_URL=/api&& npm run dev -- --host 127.0.0.1 --port %FRONTEND_PORT% --strictPort"
timeout /t 3 /nobreak >nul
echo.
echo Live source website: http://127.0.0.1:%FRONTEND_PORT%
echo Admin login: http://127.0.0.1:%FRONTEND_PORT%/login
echo API health: http://localhost:%BACKEND_PORT%/api/health
echo.
echo First run: change the default administrator password before exposing the site to the internet.
pause
