/**
 * Affiliation Matcher - School name normalization and matching
 */

// Common school abbreviation mappings (200+ schools)
const SCHOOL_MAPPINGS = {
  // North America - USA
  'MIT': ['Massachusetts Institute of Technology', 'MIT', 'M.I.T.'],
  'Stanford': ['Stanford University', 'Stanford'],
  'CMU': ['Carnegie Mellon', 'CMU', 'Carnegie Mellon University'],
  'Berkeley': ['UC Berkeley', 'UCB', 'University of California, Berkeley', 'Berkeley'],
  'UCLA': ['UCLA', 'University of California, Los Angeles'],
  'UCSD': ['UCSD', 'UC San Diego', 'University of California, San Diego'],
  'Harvard': ['Harvard University', 'Harvard'],
  'Yale': ['Yale University', 'Yale'],
  'Princeton': ['Princeton University', 'Princeton'],
  'Cornell': ['Cornell University', 'Cornell'],
  'Columbia': ['Columbia University', 'Columbia'],
  'UPenn': ['University of Pennsylvania', 'UPenn', 'Penn'],
  'Caltech': ['California Institute of Technology', 'Caltech'],
  'Georgia Tech': ['Georgia Institute of Technology', 'Georgia Tech', 'GT'],
  'UIUC': ['University of Illinois', 'UIUC', 'Illinois'],
  'UMich': ['University of Michigan', 'UMich', 'Michigan'],
  'UW': ['University of Washington', 'UW', 'Washington'],
  'UT Austin': ['University of Texas at Austin', 'UT Austin', 'Texas'],
  
  // North America - Canada
  'UofT': ['University of Toronto', 'Toronto', 'U of T', 'UofT'],
  'McGill': ['McGill University', 'McGill'],
  'UBC': ['University of British Columbia', 'British Columbia', 'UBC'],
  'Waterloo': ['University of Waterloo', 'Waterloo', 'UW'],
  'Montreal': ['Université de Montréal', 'University of Montreal', 'UdeM'],
  'Alberta': ['University of Alberta', 'Alberta', 'UAlberta'],
  'McMaster': ['McMaster University', 'McMaster'],
  'Queens': ['Queen\'s University', 'Queens University', 'Queens'],
  
  // Europe - UK
  'Oxford': ['University of Oxford', 'Oxford'],
  'Cambridge': ['University of Cambridge', 'Cambridge'],
  'Imperial': ['Imperial College London', 'Imperial College', 'Imperial'],
  'UCL': ['University College London', 'UCL'],
  'Edinburgh': ['University of Edinburgh', 'Edinburgh'],
  
  // Europe - Other
  'ETH': ['ETH Zurich', 'ETH Zürich', 'Swiss Federal Institute of Technology'],
  'EPFL': ['EPFL', 'École Polytechnique Fédérale de Lausanne'],
  'TUM': ['Technical University of Munich', 'TUM', 'TU Munich'],
  
  // Asia
  'Tsinghua': ['Tsinghua University', 'Tsinghua'],
  'Peking': ['Peking University', 'PKU'],
  'NUS': ['National University of Singapore', 'NUS'],
  'NTU Singapore': ['Nanyang Technological University', 'NTU'],
  'Tokyo': ['University of Tokyo', 'Tokyo', 'UTokyo'],
  'KAIST': ['KAIST', 'Korea Advanced Institute of Science and Technology'],
  
  // Add more as needed...
}

/**
 * Normalize affiliation name for matching
 * @param {string} affiliation - Raw affiliation string
 * @returns {string} Normalized affiliation
 */
export function normalizeAffiliation(affiliation) {
  if (!affiliation) return ''
  
  const lower = affiliation.toLowerCase().trim()
  
  // Check if matches known patterns
  for (const [key, variations] of Object.entries(SCHOOL_MAPPINGS)) {
    for (const variation of variations) {
      if (lower.includes(variation.toLowerCase())) {
        return key
      }
    }
  }
  
  // Generic normalization
  let normalized = lower
  
  // Remove common words
  normalized = normalized.replace(/\b(university of|university|college|institute|school)\b/gi, '')
  normalized = normalized.replace(/\b(the)\b/gi, '')
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Calculate similarity between two affiliations
 * @param {string} aff1 - First affiliation
 * @param {string} aff2 - Second affiliation
 * @returns {number} Similarity score (0-1)
 */
export function affiliationMatch(aff1, aff2) {
  if (!aff1 || !aff2) return 0
  
  const norm1 = normalizeAffiliation(aff1)
  const norm2 = normalizeAffiliation(aff2)
  
  // Exact match
  if (norm1 === norm2) return 1.0
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8
  
  // Word-based similarity
  const words1 = norm1.split(/\s+/).filter(w => w.length > 2)
  const words2 = norm2.split(/\s+/).filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  const commonWords = words1.filter(w => words2.includes(w))
  const similarity = commonWords.length / Math.max(words1.length, words2.length)
  
  return similarity
}

/**
 * Find best matching affiliation from a list
 * @param {Array} candidates - List of candidate affiliations
 * @param {string} target - Target affiliation to match
 * @param {number} threshold - Minimum similarity threshold (default 0.6)
 * @returns {Object|null} Best match or null
 */
export function findBestMatch(candidates, target, threshold = 0.6) {
  if (!candidates || candidates.length === 0) return null
  
  let bestMatch = null
  let bestScore = 0
  
  for (const candidate of candidates) {
    const score = affiliationMatch(candidate.affiliation, target)
    
    if (score > bestScore && score >= threshold) {
      bestScore = score
      bestMatch = { ...candidate, matchScore: score }
    }
  }
  
  return bestMatch
}

export default {
  normalizeAffiliation,
  affiliationMatch,
  findBestMatch,
  SCHOOL_MAPPINGS
}

