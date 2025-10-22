#!/bin/bash

echo "========================================"
echo "   CSProfAlign - AI-Powered Professor Discovery"
echo "========================================"
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[Step 1/3] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo
        echo "ERROR: Failed to install dependencies"
        echo "Please check your Node.js installation"
        echo
        exit 1
    fi
    echo
else
    echo "[Step 1/3] Dependencies already installed [OK]"
    echo
fi

# Check and update CSRankings source files
echo "[Step 2/3] Checking CSRankings source files..."
python3 scripts/update-csrankings.py
UPDATE_EXIT=$?

if [ $UPDATE_EXIT -eq 1 ]; then
    echo "ERROR: Failed to check CSRankings files"
    exit 1
fi

if [ $UPDATE_EXIT -eq 2 ]; then
    echo
    echo "CSRankings files updated. Regenerating data..."
    python3 scripts/load-local-data.py
    if [ $? -ne 0 ]; then
        echo "ERROR: Data regeneration failed"
        exit 1
    fi
fi

# Check if data files exist
if [ ! -f "public/data/metadata.json" ]; then
    echo "ERROR: Data files not found!"
    echo "Generating initial data..."
    python3 scripts/load-local-data.py
    if [ $? -ne 0 ]; then
        echo "ERROR: Data generation failed"
        exit 1
    fi
fi

echo

start_server:
echo "[Step 3/3] Starting development server..."
echo
echo "==Server: http://localhost:5173"
echo "==Data:   CSRankings data ready"
echo "==Ready:  Click 'Load Professors' to start"
echo
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo

npm run dev

echo
echo "Server stopped."
