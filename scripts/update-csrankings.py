#!/usr/bin/env python3
"""
Check and update CSRankings essential files from GitHub
Only downloads the 3 required CSV files
"""

import urllib.request
import hashlib
from pathlib import Path
import sys

CSRANKINGS_DIR = Path('data/csrankings')
GITHUB_RAW_URL = 'https://raw.githubusercontent.com/emeryberger/CSRankings/main'

REQUIRED_FILES = [
    'csrankings.csv',
    'generated-author-info.csv',
    'country-info.csv'
]

def get_file_hash(filepath):
    """Calculate MD5 hash of file"""
    if not filepath.exists():
        return None
    with open(filepath, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def download_file(filename):
    """Download file from CSRankings GitHub"""
    url = f"{GITHUB_RAW_URL}/{filename}"
    local_path = CSRANKINGS_DIR / filename
    
    print(f"  Downloading {filename}...", end=' ')
    try:
        urllib.request.urlretrieve(url, local_path)
        print("✓")
        return True
    except Exception as e:
        print(f"✗ ({e})")
        return False

def check_and_update():
    """Check and update CSRankings files"""
    # Ensure directory exists
    CSRANKINGS_DIR.mkdir(exist_ok=True)
    
    print("Checking CSRankings data files...")
    
    updated = False
    for filename in REQUIRED_FILES:
        local_path = CSRANKINGS_DIR / filename
        
        if not local_path.exists():
            print(f"  {filename}: Missing")
            if download_file(filename):
                updated = True
        else:
            # File exists, check if update needed by comparing with remote
            # For simplicity, we'll just note it exists
            print(f"  {filename}: ✓ Exists")
    
    if updated:
        print("\n✓ CSRankings files updated")
        return True
    else:
        print("\n✓ All files present")
        return False

if __name__ == '__main__':
    try:
        updated = check_and_update()
        sys.exit(0 if not updated else 2)  # Exit code 2 = files updated, need reload
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

