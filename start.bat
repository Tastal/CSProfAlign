@echo off
title CSProfAlign - AI-Powered Professor Discovery
echo.
echo ========================================
echo   CSProfAlign - AI-Powered Professor Discovery
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [Step 1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo Please check your Node.js installation
        echo.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [Step 1/3] Dependencies already installed [OK]
    echo.
)

:: Check and update CSRankings source files
echo [Step 2/3] Checking CSRankings source files...
python scripts\update-csrankings.py
set UPDATE_EXIT=%errorlevel%

if %UPDATE_EXIT% equ 1 (
    echo ERROR: Failed to check CSRankings files
    pause
    exit /b 1
)

if %UPDATE_EXIT% equ 2 (
    echo.
    echo CSRankings files updated. Regenerating data...
    python scripts\load-local-data.py
    if errorlevel 1 (
        echo ERROR: Data regeneration failed
        pause
        exit /b 1
    )
)

:: Check if data files exist
if not exist "public\data\metadata.json" (
    echo ERROR: Data files not found!
    echo Generating initial data...
    python scripts\load-local-data.py
    if errorlevel 1 (
        echo ERROR: Data generation failed
        pause
        exit /b 1
    )
)

echo.

:start_server
echo [Step 3/3] Starting development server...
echo.
echo ==Server: http://localhost:5173
echo ==Data:   CSRankings data ready
echo ==Ready:  Click "Load Professors" to start
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   Server Start Failed
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Port 5173 is already in use
    echo    - Close other applications using port 5173
    echo    - Or kill the process: netstat -ano ^| findstr :5173
    echo.
    echo 2. Permission denied
    echo    - Try running as Administrator
    echo    - Right-click start.bat and select "Run as administrator"
    echo.
    echo 3. Antivirus or Firewall blocking
    echo    - Add exception for Node.js in your security software
    echo.
    pause
    exit /b 1
)

echo.
echo Server stopped.
pause
