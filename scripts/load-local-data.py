#!/usr/bin/env python3
"""
Load data from local CSRankings directory
Generates JSON files for immediate use
"""

import pandas as pd
import json
from pathlib import Path
from collections import defaultdict
import sys

# Paths
CSRANKINGS_DIR = Path('CSRankings')
OUTPUT_DIR = Path('public/data')

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def check_csrankings_exists():
    """Check if CSRankings directory exists"""
    if not CSRANKINGS_DIR.exists():
        print("ERROR: CSRankings directory not found!")
        print(f"Expected location: {CSRANKINGS_DIR.absolute()}")
        print("\nPlease ensure CSRankings is cloned in the project root:")
        print("  git clone --depth 1 https://github.com/emeryberger/CSRankings.git")
        sys.exit(1)
    
    required_files = [
        'csrankings.csv',
        'generated-author-info.csv',
        'country-info.csv'
    ]
    
    for file in required_files:
        if not (CSRANKINGS_DIR / file).exists():
            print(f"ERROR: Required file not found: {file}")
            sys.exit(1)
    
    print("✓ CSRankings directory found")
    print("✓ All required files present")

def load_csrankings_data():
    """Load CSRankings data files"""
    print("\nLoading CSRankings data...")
    
    try:
        # Load main data files
        faculty = pd.read_csv(CSRANKINGS_DIR / 'csrankings.csv')
        authors = pd.read_csv(CSRANKINGS_DIR / 'generated-author-info.csv')
        countries = pd.read_csv(CSRANKINGS_DIR / 'country-info.csv')
        
        print(f"✓ Loaded {len(faculty)} faculty records")
        print(f"✓ Loaded {len(authors)} author publication records")
        print(f"✓ Loaded {len(countries)} institution records")
        
        return faculty, authors, countries
    except Exception as e:
        print(f"ERROR loading data: {e}")
        sys.exit(1)

def aggregate_publications(prof_data):
    """Aggregate publications by area and year"""
    pubs = defaultdict(lambda: defaultdict(float))
    
    for _, row in prof_data.iterrows():
        area = str(row['area']).lower()
        year = int(row['year'])
        count = float(row['adjustedcount'])
        pubs[area][year] += count
    
    # Convert to serializable format
    result = {}
    for area, years in pubs.items():
        result[area] = {str(year): round(count, 2) for year, count in years.items()}
    
    return result

def process_professors(data, region_name):
    """Process professor data and generate structured JSON"""
    professors = []
    
    grouped = data.groupby('name')
    total = len(grouped)
    
    print(f"  Processing {total} professors for {region_name}...")
    
    for i, (name, prof_data) in enumerate(grouped):
        if (i + 1) % 100 == 0:
            print(f"    Processed {i + 1}/{total}...")
        
        # Get basic info (from first row since they're the same)
        first_row = prof_data.iloc[0]
        
        # Aggregate publications
        publications = aggregate_publications(prof_data)
        
        # Get unique areas
        areas = [str(area).lower() for area in prof_data['area'].unique()]
        
        # Calculate total papers (recent 5 years for relevance)
        recent_years = [2020, 2021, 2022, 2023, 2024]
        total_papers = 0
        for area_pubs in publications.values():
            for year_str, count in area_pubs.items():
                if int(year_str) in recent_years:
                    total_papers += count
        
        professor = {
            'name': str(name),
            'affiliation': str(first_row['affiliation']),
            'homepage': str(first_row.get('homepage', '')) if pd.notna(first_row.get('homepage')) else '',
            'scholarid': str(first_row.get('scholarid', '')) if pd.notna(first_row.get('scholarid')) else '',
            'publications': publications,
            'areas': areas,
            'total_papers_recent': round(total_papers, 2)
        }
        
        professors.append(professor)
    
    print(f"  ✓ Processed {len(professors)} professors")
    return professors

def group_by_region(faculty, authors, countries):
    """Group professors by region"""
    print("\nMerging and grouping data...")
    
    # Merge data
    merged = faculty.merge(countries, left_on='affiliation', right_on='institution', how='left')
    merged = merged.merge(authors, on='name', how='left')
    
    # CSRankings convention: missing region = US
    # Fill NaN region values with 'us'
    merged['region'] = merged['region'].fillna('us')
    
    # Remove rows with missing critical data (but not region anymore)
    merged = merged.dropna(subset=['area', 'year'])
    
    print(f"✓ Merged data: {len(merged)} records")
    
    # Group by region
    regions = {}
    region_counts = merged['region'].value_counts()
    
    print("\nProcessing regions:")
    for region in merged['region'].unique():
        region_str = str(region)
        count = region_counts[region]
        print(f"  {region_str}: {count} publication records")
        
        region_data = merged[merged['region'] == region]
        regions[region_str] = process_professors(region_data, region_str)
    
    return regions

def generate_metadata(regions):
    """Generate metadata file"""
    metadata = {
        'last_updated': pd.Timestamp.now().isoformat(),
        'source': 'CSRankings local directory',
        'regions': {}
    }
    
    for region, professors in regions.items():
        metadata['regions'][region] = {
            'count': len(professors),
            'filename': f'professors-{region}.json'
        }
    
    return metadata

def main():
    """Main processing function"""
    print("=" * 70)
    print("  CSProfHunt - Load Data from CSRankings")
    print("=" * 70)
    
    # Check if CSRankings exists
    check_csrankings_exists()
    
    # Load data
    faculty, authors, countries = load_csrankings_data()
    
    # Group by region
    regions = group_by_region(faculty, authors, countries)
    
    # Generate metadata
    metadata = generate_metadata(regions)
    
    # Save files
    print("\n" + "=" * 70)
    print("Saving output files...")
    print("=" * 70)
    
    # Save metadata
    metadata_path = OUTPUT_DIR / 'metadata.json'
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Saved {metadata_path}")
    
    # Save region files
    total_professors = 0
    for region, professors in regions.items():
        output_path = OUTPUT_DIR / f'professors-{region}.json'
        data = {
            'region': region,
            'count': len(professors),
            'last_updated': metadata['last_updated'],
            'professors': professors
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        file_size = output_path.stat().st_size / (1024 * 1024)  # MB
        print(f"✓ Saved {output_path.name}: {len(professors)} professors ({file_size:.2f} MB)")
        total_professors += len(professors)
    
    print("\n" + "=" * 70)
    print(f"✓ SUCCESS! Generated data for {len(regions)} regions")
    print(f"✓ Total professors: {total_professors}")
    print("=" * 70)
    print("\nYou can now reload the web application to use real CSRankings data!")

if __name__ == '__main__':
    main()

