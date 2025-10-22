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

# Check and update CSRankings data
echo "[Step 2/3] Checking CSRankings data..."
echo

# Check if CSRankings directory exists
if [ ! -d "CSRankings" ]; then
    echo "WARNING: CSRankings directory not found!"
    echo
    echo "To use real data, please clone CSRankings:"
    echo "  git clone --depth 1 https://github.com/emeryberger/CSRankings.git"
    echo
    echo "Press any key to continue with demo mode, or Ctrl+C to exit and clone CSRankings first."
    read -n 1 -s
    echo
    goto_start_server
fi

# Check if data files exist
if [ ! -f "public/data/metadata.json" ]; then
    echo "Data files not found. Loading data from CSRankings..."
    goto_load_data
fi

# Check if CSRankings has updates (check if .git exists for git pull)
if [ -d "CSRankings/.git" ]; then
    echo "Checking for CSRankings updates..."
    cd CSRankings
    git fetch origin master --quiet 2>/dev/null
    
    # Compare local and remote
    BEHIND=$(git rev-list HEAD...origin/master --count 2>/dev/null)
    cd ..
    
    if [ ! -z "$BEHIND" ] && [ "$BEHIND" != "0" ]; then
        echo "CSRankings repository has $BEHIND new commits."
        echo "Updating CSRankings and reloading data..."
        cd CSRankings
        git pull origin master --quiet
        cd ..
        goto_load_data
    else
        echo "CSRankings data is up to date [OK]"
        echo
    fi
else
    echo "CSRankings data exists [OK]"
    echo
fi

goto_start_server

load_data:
echo
echo "----------------------------------------"
echo "Loading Real CSRankings Data"
echo "----------------------------------------"
echo "This may take 2-5 minutes..."
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python not found!"
    echo "Please install Python 3.7+ from https://www.python.org/"
    echo
    exit 1
fi

# Check pandas
python3 -c "import pandas" &> /dev/null
if [ $? -ne 0 ]; then
    echo "Installing pandas..."
    pip3 install pandas
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install pandas"
        exit 1
    fi
fi

# Run data loading script
python3 scripts/load-local-data.py
if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Data loading failed!"
    echo "Please check the error messages above."
    exit 1
fi

echo
echo "Data loaded successfully [OK]"
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
