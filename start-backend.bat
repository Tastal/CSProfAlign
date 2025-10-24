@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo    CSProfAlign Local LLM Backend Server
echo ========================================
echo.

REM Set default backend port if not already set
if "%BACKEND_PORT%"=="" (
    set BACKEND_PORT=8000
)
echo [CONFIG] Backend port: %BACKEND_PORT%
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker found

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo [OK] Docker is running

REM Stop any existing containers
echo.
echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

REM Start the backend
echo.
echo [INFO] Starting CSProfAlign backend server...
docker-compose up -d

REM Wait for container to start
echo.
echo [INFO] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Check if container is running
docker-compose ps | findstr "csprofalign-vllm" | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Backend failed to start
    echo.
    echo Container logs:
    docker-compose logs --tail=20
    echo.
    echo Try running: docker-compose up --build
    pause
    exit /b 1
)

echo [OK] Backend started successfully
echo.
echo ========================================
echo   Backend Status:
echo ========================================
docker-compose ps

echo.
echo Backend URL: http://localhost:%BACKEND_PORT%
echo Health Check: http://localhost:%BACKEND_PORT%/health
echo.
echo To view logs: docker-compose logs -f
echo To stop backend: docker-compose down
echo.
echo [OK] Ready! You can now start the frontend with start.bat
echo.
pause
