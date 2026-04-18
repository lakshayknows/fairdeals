@echo off
title FairDeals Billing System
echo ==================================================
echo         FAIRDEALS BILLING - STARTING...
echo ==================================================
echo.

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install it from nodejs.org
    pause
    exit /b
)

:: Check if mysqldump is available (for SQL backups)
mysqldump --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] mysqldump not found in PATH. SQL backups will be unavailable.
    echo        JSON backups will still work.
    echo.
)

:: Sync Prisma client with the current schema
echo [1/2] Syncing database schema...
call npx prisma generate >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed. Check your DATABASE_URL in .env
    pause
    exit /b
)
echo       Done.

echo [2/2] Launching app with auto-restart...
echo.
echo ==================================================
echo    App running at: http://localhost:3000
echo    Logs saved to:  logs\error.log
echo    Backups at:     backups\
echo    Press Ctrl+C twice to fully stop.
echo ==================================================
echo.

:: Auto-restart loop — if the app crashes, it restarts after 3 seconds.
:: Press Ctrl+C once to interrupt the current run; press it again to exit.
:restart
npm run dev
echo.
echo [%TIME%] App exited. Restarting in 3 seconds... (Press Ctrl+C to stop)
timeout /t 3 /nobreak >nul
goto restart
