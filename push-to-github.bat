@echo off
echo ========================================
echo   Pushing to GitHub (Force Overwrite)
echo ========================================
echo.

echo Step 1: Adding all changes...
git add -A
echo.

echo Step 2: Showing status...
git status --short
echo.

echo Step 3: Committing...
git commit -m "Fix: Move CSRankings to data/csrankings and cleanup"
echo.

echo Step 4: Force pushing to GitHub...
git push -f origin main
echo.

echo ========================================
echo   Push completed!
echo ========================================
echo.
echo Deleting this script...
del "%~f0"

