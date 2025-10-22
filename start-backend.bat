@echo off
echo ========================================
echo    CSProfAlign Local LLM Backend Server
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker found

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Stop any existing containers
echo.
echo 🛑 Stopping existing containers...
docker-compose down >nul 2>&1

REM Start the backend
echo.
echo 🚀 Starting CSProfAlign backend server...
docker-compose up -d

REM Wait for container to start
echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Check if container is running
docker-compose ps | findstr "csprofalign-vllm" | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo ❌ Backend failed to start
    echo.
    echo 📋 Container logs:
    docker-compose logs --tail=20
    echo.
    echo 💡 Try running: docker-compose up --build
    pause
    exit /b 1
)

echo ✅ Backend started successfully
echo.
echo 📊 Backend Status:
docker-compose ps

echo.
echo 🌐 Backend URL: http://localhost:8000
echo 📋 Health Check: http://localhost:8000/health
echo.
echo 💡 To view logs: docker-compose logs -f
echo 💡 To stop backend: docker-compose down
echo.
echo ✅ Ready! You can now start the frontend with start.bat
echo.
pause