@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo    CSProfAlign Port Configuration
echo ========================================
echo.
echo Current backend port: %BACKEND_PORT%
if "%BACKEND_PORT%"=="" echo (default: 8000)
echo.
echo Common free ports: 8001, 8080, 8888, 9000
echo.
set /p NEW_PORT="Enter new port number (or press Enter to cancel): "

if "%NEW_PORT%"=="" (
    echo.
    echo [INFO] No changes made
    pause
    exit /b 0
)

REM Validate port number
echo %NEW_PORT%| findstr /r "^[0-9][0-9]*$" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Invalid port number
    pause
    exit /b 1
)

if %NEW_PORT% LSS 1024 (
    echo [WARNING] Ports below 1024 may require admin privileges
)

if %NEW_PORT% GTR 65535 (
    echo [ERROR] Port must be between 1 and 65535
    pause
    exit /b 1
)

REM Check if port is available
netstat -ano | findstr :%NEW_PORT% >nul
if %errorlevel% equ 0 (
    echo.
    echo [WARNING] Port %NEW_PORT% may already be in use:
    netstat -ano | findstr :%NEW_PORT%
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        echo [INFO] Cancelled
        pause
        exit /b 0
    )
)

echo.
echo [OK] Setting BACKEND_PORT=%NEW_PORT% for this session
set BACKEND_PORT=%NEW_PORT%

REM Create .env.local for frontend
echo VITE_BACKEND_PORT=%NEW_PORT% > .env.local
echo [OK] Created .env.local for frontend

echo.
echo ========================================
echo   Configuration Updated!
echo ========================================
echo Backend port: %NEW_PORT%
echo.
echo Next steps:
echo 1. Run: start-backend.bat
echo 2. Run: npm run dev
echo.
echo To make this permanent, add to Windows environment variables:
echo    Variable: BACKEND_PORT
echo    Value: %NEW_PORT%
echo.
pause

