#!/usr/bin/env python3
"""
ProfHunt Data Preprocessing Script
Processes CSRankings data and generates region-based JSON files
"""

import pandas as pd
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any
import sys

# Configuration
CSRANKINGS_DIR = Path('CSRankings')
OUTPUT_DIR = Path('public/data')

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def load_csrankings_data():
    """Load CSRankings data files"""
    print("Loading CSRankings data...")
    
    try:
        # Load main data files
        faculty = pd.read_csv(CSRANKINGS_DIR / 'csrankings.csv')
        authors = pd.read_csv(CSRANKINGS_DIR / 'generated-author-info.csv')
        countries = pd.read_csv(CSRANKINGS_DIR / 'country-info.csv')
        
        print(f"Loaded {len(faculty)} faculty records")
        print(f"Loaded {len(authors)} author publication records")
        print(f"Loaded {len(countries)} country records")
        
        return faculty, authors, countries
    except Exception as e:
        print(f"Error loading data: {e}")
        sys.exit(1)

def aggregate_publications(prof_data):
    """Aggregate publications by area and year"""
    pubs = defaultdict(lambda: defaultdict(float))
    
    for _, row in prof_data.iterrows():
        area = row['area']
        year = int(row['year'])
        count = float(row['adjustedcount'])
        pubs[area][year] += count
    
    # Convert to serializable format
    result = {}
    for area, years in pubs.items():
        result[area] = {str(year): count for year, count in years.items()}
    
    return result

def process_professors(data):
    """Process professor data and generate structured JSON"""
    professors = []
    
    grouped = data.groupby('name')
    
    for name, prof_data in grouped:
        # Get basic info (from first row since they're the same)
        first_row = prof_data.iloc[0]
        
        # Aggregate publications
        publications = aggregate_publications(prof_data)
        
        # Get unique areas
        areas = list(prof_data['area'].unique())
        
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
            'homepage': str(first_row['homepage']) if pd.notna(first_row['homepage']) else '',
            'scholarid': str(first_row['scholarid']) if pd.notna(first_row['scholarid']) else '',
            'publications': publications,
            'areas': areas,
            'total_papers_recent': round(total_papers, 2)
        }
        
        professors.append(professor)
    
    return professors

def group_by_region(faculty, authors, countries):
    """Group professors by region"""
    print("\nProcessing and grouping data by region...")
    
    # Merge data
    merged = faculty.merge(countries, left_on='affiliation', right_on='institution', how='left')
    merged = merged.merge(authors, on='name', how='left')
    
    # Remove rows with missing critical data
    merged = merged.dropna(subset=['region', 'area', 'year'])
    
    print(f"After merging: {len(merged)} records")
    
    # Group by region
    regions = {}
    region_counts = merged['region'].value_counts()
    
    print("\nProcessing regions:")
    for region in merged['region'].unique():
        print(f"  - {region}: {region_counts[region]} records")
        region_data = merged[merged['region'] == region]
        regions[region] = process_professors(region_data)
        print(f"    Generated {len(regions[region])} professor profiles")
    
    return regions

def generate_metadata(regions):
    """Generate metadata file"""
    metadata = {
        'last_updated': pd.Timestamp.now().isoformat(),
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
    print("=" * 60)
    print("ProfHunt Data Preprocessing")
    print("=" * 60)
    
    # Load data
    faculty, authors, countries = load_csrankings_data()
    
    # Group by region
    regions = group_by_region(faculty, authors, countries)
    
    # Generate metadata
    metadata = generate_metadata(regions)
    
    # Save files
    print("\nSaving output files...")
    
    # Save metadata
    metadata_path = OUTPUT_DIR / 'metadata.json'
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Saved {metadata_path}")
    
    # Save region files
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
        
        file_size = output_path.stat().st_size / 1024  # KB
        print(f"  ✓ Saved {output_path} ({file_size:.1f} KB, {len(professors)} professors)")
    
    print("\n" + "=" * 60)
    print("✓ Data preprocessing completed successfully!")
    print("=" * 60)

if __name__ == '__main__':
    main()

