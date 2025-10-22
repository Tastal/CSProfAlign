@echo off
echo ========================================
echo   Finalizing CSRankings Migration
echo ========================================
echo.

REM Check if data/csrankings files exist
if not exist "data\csrankings\csrankings.csv" (
    echo ERROR: CSRankings files not found in data\csrankings\
    echo Please run copy-csrankings-files.bat first
    pause
    exit /b 1
)

echo ✓ CSRankings files found in data\csrankings\
echo.

REM Delete CSRankings directory
echo Deleting CSRankings directory...
if exist "CSRankings" (
    rmdir /s /q CSRankings
    echo ✓ CSRankings directory deleted
) else (
    echo ✓ CSRankings directory already deleted
)
echo.

REM Stage changes
echo Staging files for commit...
git add data\csrankings\
git add scripts\
git add .gitignore
git add GITHUB_PUSH.md
git add README.md
git add start.bat
git add start.sh
echo ✓ Files staged
echo.

REM Show status
echo Current status:
git status --short
echo.

echo ========================================
echo   Ready to commit and push!
echo ========================================
echo.
echo Next steps:
echo   1. git commit -m "Fix: Move CSRankings files to data/csrankings/"
echo   2. git push
echo.
pause
