/**
 * Export utilities for downloading results
 */

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export professors to CSV
 */
export function exportToCSV(professors, filename = 'professors.csv') {
  const headers = ['Rank', 'Name', 'Institution', 'Match Score', 'Total Papers', 'Areas', 'Homepage', 'Scholar']
  
  const rows = professors.map((prof, index) => {
    const rank = index + 1
    const name = prof.name || ''
    const affiliation = prof.affiliation || ''
    const score = prof.matchScore ? prof.matchScore.toFixed(2) : 'N/A'
    // Fix: Use integer for Total Papers
    const papers = Math.round(prof.relevantPapers || prof.total_papers_recent || 0)
    // Fix: Use research summary if available, fallback to area list
    const areas = prof.researchSummary || (prof.areas || []).join('; ')
    const homepage = prof.homepage || ''
    const scholar = prof.scholarid 
      ? `https://scholar.google.com/citations?user=${prof.scholarid}`
      : ''
    
    // Escape CSV fields
    const escapeCsvField = (field) => {
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    
    return [rank, name, affiliation, score, papers, areas, homepage, scholar]
      .map(escapeCsvField)
      .join(',')
  })
  
  const csv = [headers.join(','), ...rows].join('\n')
  
  // Add BOM for Excel compatibility
  const csvWithBOM = '\uFEFF' + csv
  
  downloadFile(csvWithBOM, filename, 'text/csv;charset=utf-8')
}

/**
 * Export professors to JSON
 */
export function exportToJSON(professors, filename = 'professors.json') {
  const exportData = {
    exported_at: new Date().toISOString(),
    count: professors.length,
    professors: professors.map((prof, index) => ({
      rank: index + 1,
      name: prof.name,
      affiliation: prof.affiliation,
      matchScore: prof.matchScore,
      total_papers_recent: prof.total_papers_recent,
      areas: prof.areas,
      homepage: prof.homepage,
      scholarid: prof.scholarid,
      publications: prof.publications
    }))
  }
  
  const json = JSON.stringify(exportData, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * Export filter configuration
 */
export function exportConfig(config, filename = 'profhunt-config.json') {
  const exportConfig = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    filters: {
      regions: config.regions,
      yearRange: config.yearRange,
      selectedVenues: config.selectedVenues
    },
    llm: {
      provider: config.llmProvider,
      model: config.llmModel,
      researchDirection: config.researchDirection,
      threshold: config.threshold
    },
    processing: {
      maxWorkers: config.maxWorkers,
      batchSize: config.batchSize
    }
  }
  
  const json = JSON.stringify(exportConfig, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * Import configuration from JSON
 */
export function importConfig(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result)
        resolve(config)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Copy to clipboard
 */
export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
}

/**
 * Generate shareable link
 */
export function generateShareLink(config) {
  const params = new URLSearchParams()
  
  if (config.regions && config.regions.length > 0) {
    params.set('regions', config.regions.join(','))
  }
  
  if (config.yearRange) {
    params.set('startYear', config.yearRange[0])
    params.set('endYear', config.yearRange[1])
  }
  
  if (config.selectedVenues && config.selectedVenues.length > 0) {
    params.set('venues', config.selectedVenues.join(','))
  }
  
  if (config.researchDirection) {
    // Compress and encode research direction
    params.set('research', encodeURIComponent(config.researchDirection))
  }
  
  if (config.threshold !== undefined) {
    params.set('threshold', config.threshold)
  }
  
  const url = new URL(window.location.href)
  url.search = params.toString()
  
  return url.toString()
}

