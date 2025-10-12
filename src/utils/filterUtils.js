/**
 * Utility functions for filtering professors
 */

/**
 * Filter professors by year range
 */
export function filterByYearRange(professors, startYear, endYear) {
  return professors.filter(prof => {
    // Check if professor has publications in the specified range
    for (const areaPubs of Object.values(prof.publications)) {
      for (const year in areaPubs) {
        const y = parseInt(year)
        if (y >= startYear && y <= endYear && areaPubs[year] > 0) {
          return true
        }
      }
    }
    return false
  })
}

/**
 * Filter professors by selected venues
 */
export function filterByVenues(professors, selectedVenues) {
  if (!selectedVenues || selectedVenues.length === 0) {
    return professors
  }
  
  return professors.filter(prof => {
    // Check if professor has publications in any of the selected venues
    return prof.areas.some(area => selectedVenues.includes(area))
  })
}

/**
 * Calculate professor's publication count in selected venues and year range
 */
export function calculateRelevantPapers(prof, selectedVenues, startYear, endYear) {
  let count = 0
  
  for (const [area, years] of Object.entries(prof.publications)) {
    if (selectedVenues.length === 0 || selectedVenues.includes(area)) {
      for (const [year, paperCount] of Object.entries(years)) {
        const y = parseInt(year)
        if (y >= startYear && y <= endYear) {
          count += parseFloat(paperCount)
        }
      }
    }
  }
  
  return Math.round(count) // Round to integer
}

/**
 * Search professors by name or affiliation
 */
export function searchProfessors(professors, query) {
  if (!query || query.trim() === '') {
    return professors
  }
  
  const lowerQuery = query.toLowerCase().trim()
  
  return professors.filter(prof => {
    const name = (prof.name || '').toLowerCase()
    const affiliation = (prof.affiliation || '').toLowerCase()
    return name.includes(lowerQuery) || affiliation.includes(lowerQuery)
  })
}

/**
 * Sort professors by various criteria
 */
export function sortProfessors(professors, sortBy, sortOrder = 'desc') {
  const sorted = [...professors]
  
  sorted.sort((a, b) => {
    let valueA, valueB
    
    switch (sortBy) {
      case 'name':
        valueA = a.name || ''
        valueB = b.name || ''
        return sortOrder === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      
      case 'affiliation':
        valueA = a.affiliation || ''
        valueB = b.affiliation || ''
        return sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      
      case 'papers':
        valueA = a.total_papers_recent || 0
        valueB = b.total_papers_recent || 0
        return sortOrder === 'asc'
          ? valueA - valueB
          : valueB - valueA
      
      case 'score':
        valueA = a.matchScore || 0
        valueB = b.matchScore || 0
        return sortOrder === 'asc'
          ? valueA - valueB
          : valueB - valueA
      
      default:
        return 0
    }
  })
  
  return sorted
}

/**
 * Group professors by affiliation
 */
export function groupByAffiliation(professors) {
  const grouped = {}
  
  for (const prof of professors) {
    const affiliation = prof.affiliation || 'Unknown'
    if (!grouped[affiliation]) {
      grouped[affiliation] = []
    }
    grouped[affiliation].push(prof)
  }
  
  return grouped
}

/**
 * Get publication statistics
 */
export function getPublicationStats(professors, selectedVenues, startYear, endYear) {
  const stats = {
    totalProfessors: professors.length,
    totalPapers: 0,
    avgPapersPerProfessor: 0,
    areaDistribution: {}
  }
  
  for (const prof of professors) {
    const papers = calculateRelevantPapers(prof, selectedVenues, startYear, endYear)
    stats.totalPapers += papers
    
    // Count area distribution
    for (const area of prof.areas) {
      if (selectedVenues.length === 0 || selectedVenues.includes(area)) {
        stats.areaDistribution[area] = (stats.areaDistribution[area] || 0) + 1
      }
    }
  }
  
  stats.avgPapersPerProfessor = stats.totalProfessors > 0
    ? Math.round((stats.totalPapers / stats.totalProfessors) * 10) / 10
    : 0
  
  return stats
}

