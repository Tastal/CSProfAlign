@echo off
title CSProfHunt - AI-Powered Professor Discovery
echo.
echo ========================================
echo   CSProfHunt - AI-Powered Professor Discovery
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
    echo [Step 1/3] Dependencies already installed ✓
    echo.
)

:: Check and update CSRankings data
echo [Step 2/3] Checking CSRankings data...
echo.

:: Check if CSRankings directory exists
if not exist "CSRankings" (
    echo WARNING: CSRankings directory not found!
    echo.
    echo To use real data, please clone CSRankings:
    echo   git clone --depth 1 https://github.com/emeryberger/CSRankings.git
    echo.
    echo Press any key to continue with demo mode, or Ctrl+C to exit and clone CSRankings first.
    pause
    goto :start_server
)

:: Check if data files exist
if not exist "public\data\metadata.json" (
    echo Data files not found. Loading data from CSRankings...
    goto :load_data
)

:: Check if CSRankings has updates (check if .git exists for git pull)
if exist "CSRankings\.git" (
    echo Checking for CSRankings updates...
    cd CSRankings
    git fetch origin master --quiet 2>nul
    
    :: Compare local and remote
    for /f %%i in ('git rev-list HEAD...origin/master --count 2^>nul') do set BEHIND=%%i
    
    cd ..
    
    if not "%BEHIND%"=="" if not "%BEHIND%"=="0" (
        echo CSRankings repository has %BEHIND% new commits.
        echo Updating CSRankings and reloading data...
        cd CSRankings
        git pull origin master --quiet
        cd ..
        goto :load_data
    ) else (
        echo CSRankings data is up to date ✓
        echo.
    )
) else (
    echo CSRankings data exists ✓
    echo.
)

goto :start_server

:load_data
echo.
echo ----------------------------------------
echo Loading Real CSRankings Data
echo ----------------------------------------
echo This may take 2-5 minutes...
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.7+ from https://www.python.org/
    echo.
    pause
    exit /b 1
)

:: Check pandas
python -c "import pandas" >nul 2>&1
if errorlevel 1 (
    echo Installing pandas...
    pip install pandas
    if errorlevel 1 (
        echo ERROR: Failed to install pandas
        pause
        exit /b 1
    )
)

:: Run data loading script
python scripts\load-local-data.py
if errorlevel 1 (
    echo.
    echo ERROR: Data loading failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo Data loaded successfully ✓
echo.

:start_server
echo [Step 3/3] Starting development server...
echo.
echo 🌐 Server: http://localhost:3000
echo 📊 Data:   CSRankings data ready
echo 🚀 Ready:  Click "Load Professors" to start
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

echo.
echo Server stopped.
pause
