/**
 * Data loading and caching service
 */

import axios from 'axios'

class DataService {
  constructor() {
    this.cache = new Map()
    this.metadata = null
    this.baseURL = import.meta.env.VITE_DATA_URL || '/data'
    
    // Map countries to their continent files
    this.countryToContinentMap = {
      // North America
      'us': 'us',
      'ca': 'canada',
      
      // Europe
      'uk': 'europe', 'de': 'europe', 'fr': 'europe', 'nl': 'europe',
      'ch': 'europe', 'se': 'europe', 'dk': 'europe', 'no': 'europe',
      'fi': 'europe', 'be': 'europe', 'at': 'europe', 'it': 'europe',
      'es': 'europe', 'gr': 'europe', 'pl': 'europe', 'cz': 'europe',
      'il': 'europe', 'ie': 'europe', 'pt': 'europe', 'ro': 'europe',
      'tr': 'europe',
      
      // Asia
      'cn': 'asia', 'jp': 'asia', 'kr': 'asia', 'sg': 'asia',
      'hk': 'asia', 'tw': 'asia', 'in': 'asia', 'sa': 'asia',
      'ae': 'asia', 'th': 'asia', 'my': 'asia', 'pk': 'asia',
      
      // Australasia
      'au': 'australasia', 'nz': 'australasia',
      
      // South America
      'br': 'southamerica', 'cl': 'southamerica', 'ar': 'southamerica',
      
      // Africa
      'za': 'africa', 'eg': 'africa'
    }
    
    // Map country codes to their full names
    this.countryNames = {
      'us': 'USA', 'ca': 'Canada',
      'uk': 'United Kingdom', 'de': 'Germany', 'fr': 'France',
      'nl': 'Netherlands', 'ch': 'Switzerland', 'se': 'Sweden',
      'dk': 'Denmark', 'no': 'Norway', 'fi': 'Finland',
      'be': 'Belgium', 'at': 'Austria', 'it': 'Italy',
      'es': 'Spain', 'gr': 'Greece', 'pl': 'Poland',
      'cz': 'Czech Republic', 'il': 'Israel', 'ie': 'Ireland',
      'pt': 'Portugal', 'ro': 'Romania', 'tr': 'Turkey',
      'cn': 'China', 'jp': 'Japan', 'kr': 'South Korea',
      'sg': 'Singapore', 'hk': 'Hong Kong', 'tw': 'Taiwan',
      'in': 'India', 'sa': 'Saudi Arabia', 'ae': 'UAE',
      'th': 'Thailand', 'my': 'Malaysia', 'pk': 'Pakistan',
      'au': 'Australia', 'nz': 'New Zealand',
      'br': 'Brazil', 'cl': 'Chile', 'ar': 'Argentina',
      'za': 'South Africa', 'eg': 'Egypt'
    }
  }

  /**
   * Load metadata
   */
  async loadMetadata() {
    if (this.metadata) {
      return this.metadata
    }

    try {
      const response = await axios.get(`${this.baseURL}/metadata.json`)
      this.metadata = response.data
      return this.metadata
    } catch (error) {
      console.error('Failed to load metadata:', error)
      throw new Error('Failed to load professor data metadata')
    }
  }

  /**
   * Load professors for a specific region (handles both countries and continents)
   */
  async loadRegion(region) {
    console.log(`Loading region: ${region}`)
    
    // Check cache first
    if (this.cache.has(region)) {
      console.log(`  → Found in cache: ${this.cache.get(region).length || 0} professors`)
      return this.cache.get(region)
    }

    // Map country code to continent file if needed
    const fileRegion = this.countryToContinentMap[region] || region
    const isCountryFilter = fileRegion !== region
    
    console.log(isCountryFilter ? `  → Mapping ${region} to ${fileRegion} file` : `  → Loading ${region} directly`)

    try {
      const url = `${this.baseURL}/professors-${fileRegion}.json`
      console.log(`  → Fetching: ${url}`)
      
      const response = await axios.get(url)
      const data = response.data
      
      console.log(`  → Loaded: ${data.professors?.length || 0} professors from file`)
      
      // If this is a country filter, filter professors by country
      let professors = data.professors || []
      if (isCountryFilter) {
        // Special handling for countries with dedicated files (us, ca)
        if (region === 'us' || region === 'ca') {
          // These have their own files, no filtering needed
          console.log(`  → Using dedicated ${region} file (no filtering)`)
        } else {
          // Filter by country keywords
          const countryName = this.countryNames[region]
          console.log(`  → Filtering by country: ${countryName}`)
          
          professors = professors.filter(prof => {
            const affiliation = prof.affiliation.toLowerCase()
            const country = countryName.toLowerCase()
            
            // Check if affiliation contains country name or known keywords
            return affiliation.includes(country) || 
                   this.matchesCountry(affiliation, region)
          })
          
          console.log(`  → After country filter: ${professors.length} professors`)
        }
      }
      
      // Cache the filtered data
      this.cache.set(region, professors)
      
      return professors
    } catch (error) {
      console.error(`Failed to load region ${region}:`, error)
      console.error(`  URL attempted: ${this.baseURL}/professors-${fileRegion}.json`)
      // Don't throw - return empty array instead
      return []
    }
  }
  
  /**
   * Match affiliation to country using heuristics
   */
  matchesCountry(affiliation, countryCode) {
    const patterns = {
      'uk': ['uk', 'u.k.', 'united kingdom', 'england', 'scotland', 'wales', 'britain', 'london', 'cambridge', 'oxford', 'imperial', 'ucl', 'edinburgh', 'manchester', 'warwick', 'bristol', 'southampton'],
      'de': ['germany', 'deutschland', 'german', 'berlin', 'munich', 'münchen', 'hamburg', 'cologne', 'köln', 'frankfurt', 'stuttgart', 'dortmund', 'karlsruhe', 'aachen', 'saarland', 'tum', 'rwth'],
      'fr': ['france', 'french', 'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'bordeaux', 'inria', 'cnrs', 'sorbonne', 'polytechnique'],
      'cn': ['china', 'chinese', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou', 'nanjing', 'tsinghua', 'peking', 'pku', 'fudan', 'sjtu', 'zhejiang', 'ustc'],
      'hk': ['hong kong', 'hongkong', 'hku', 'hkust', 'cuhk', 'cityu'],
      'tw': ['taiwan', 'taipei', 'nthu', 'ntu taiwan'],
      'jp': ['japan', 'japanese', 'tokyo', 'kyoto', 'osaka', 'nagoya', 'tohoku', 'waseda', 'keio', 'titech'],
      'kr': ['korea', 'korean', 'seoul', 'busan', 'kaist', 'snu', 'postech', 'yonsei'],
      'sg': ['singapore', 'singaporean', 'nus', 'ntu singapore', 'smu', 'sutd'],
      'au': ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'unsw', 'anu', 'uq', 'monash'],
      'nz': ['new zealand', 'zealand', 'auckland', 'wellington', 'christchurch', 'otago'],
      'ch': ['switzerland', 'swiss', 'zurich', 'zürich', 'geneva', 'lausanne', 'bern', 'basel', 'eth', 'epfl'],
      'nl': ['netherlands', 'dutch', 'holland', 'amsterdam', 'delft', 'utrecht', 'eindhoven', 'rotterdam', 'leiden', 'groningen'],
      'se': ['sweden', 'swedish', 'stockholm', 'gothenburg', 'uppsala', 'lund', 'kth', 'chalmers'],
      'dk': ['denmark', 'danish', 'copenhagen', 'aarhus', 'dtu', 'aalborg'],
      'no': ['norway', 'norwegian', 'oslo', 'bergen', 'trondheim', 'ntnu'],
      'fi': ['finland', 'finnish', 'helsinki', 'espoo', 'aalto', 'tampere'],
      'be': ['belgium', 'belgian', 'brussels', 'leuven', 'ghent', 'antwerp', 'ku leuven'],
      'at': ['austria', 'austrian', 'vienna', 'wien', 'graz', 'linz', 'innsbruck'],
      'it': ['italy', 'italian', 'rome', 'milan', 'milano', 'bologna', 'padua', 'pisa', 'turin', 'torino'],
      'es': ['spain', 'spanish', 'madrid', 'barcelona', 'valencia', 'seville', 'zaragoza'],
      'pt': ['portugal', 'portuguese', 'lisbon', 'lisboa', 'porto', 'coimbra'],
      'gr': ['greece', 'greek', 'athens', 'thessaloniki', 'crete'],
      'pl': ['poland', 'polish', 'warsaw', 'krakow', 'wroclaw', 'poznan'],
      'cz': ['czech', 'prague', 'brno'],
      'ro': ['romania', 'romanian', 'bucharest', 'cluj'],
      'tr': ['turkey', 'turkish', 'ankara', 'istanbul', 'izmir'],
      'il': ['israel', 'israeli', 'jerusalem', 'tel aviv', 'haifa', 'technion', 'weizmann'],
      'ie': ['ireland', 'irish', 'dublin', 'cork', 'galway', 'trinity'],
      'in': ['india', 'indian', 'mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune', 'iit', 'iisc', 'iiit'],
      'br': ['brazil', 'brazilian', 'são paulo', 'sao paulo', 'rio de janeiro', 'brasília', 'brasilia', 'usp', 'unicamp'],
      'ar': ['argentina', 'argentinian', 'buenos aires', 'córdoba', 'cordoba'],
      'cl': ['chile', 'chilean', 'santiago', 'valparaíso', 'valparaiso'],
      'za': ['south africa', 'african', 'cape town', 'johannesburg', 'pretoria'],
      'eg': ['egypt', 'egyptian', 'cairo', 'alexandria'],
      'sa': ['saudi', 'arabia', 'riyadh', 'jeddah', 'kaust'],
      'ae': ['uae', 'dubai', 'abu dhabi', 'emirates'],
      'th': ['thailand', 'thai', 'bangkok', 'chiang mai'],
      'my': ['malaysia', 'malaysian', 'kuala lumpur', 'penang'],
      'pk': ['pakistan', 'pakistani', 'islamabad', 'karachi', 'lahore']
    }
    
    const keywords = patterns[countryCode] || []
    return keywords.some(keyword => affiliation.includes(keyword))
  }

  /**
   * Load professors for multiple regions
   */
  async loadRegions(regions) {
    console.log('loadRegions called with:', regions)
    
    // Handle 'world' or 'worldwide' - load all regions
    if (regions.includes('world') || regions.includes('worldwide')) {
      console.log('Loading all regions (worldwide)')
      return this.loadAllRegions()
    }
    
    // Load specified regions
    const promises = regions.map(region => this.loadRegion(region))
    const results = await Promise.allSettled(promises)
    
    console.log('loadRegions results:', results.length)
    
    // Combine professors from all regions
    const allProfessors = []
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        // loadRegion now returns array directly
        const professors = Array.isArray(result.value) ? result.value : (result.value.professors || [])
        console.log(`  Adding ${professors.length} professors`)
        allProfessors.push(...professors)
      } else if (result.status === 'rejected') {
        console.error('  Failed to load region:', result.reason)
      }
    }
    
    console.log(`Total professors combined: ${allProfessors.length}`)
    return allProfessors
  }
  
  /**
   * Check if region is a continent-level region
   */
  isContinentRegion(region) {
    const continents = ['northamerica', 'europe', 'asia', 'australasia', 'southamerica', 'africa']
    return continents.includes(region)
  }

  /**
   * Load all available regions
   */
  async loadAllRegions() {
    console.log('Loading all regions...')
    
    try {
      const metadata = await this.loadMetadata()
      const regions = Object.keys(metadata.regions || {})
      
      console.log('Available regions from metadata:', regions)
      
      if (regions.length === 0) {
        console.warn('No regions found in metadata!')
        return []
      }
      
      // Load all regions
      const promises = regions.map(region => this.loadRegion(region))
      const results = await Promise.allSettled(promises)
      
      const allProfessors = []
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const professors = Array.isArray(result.value) ? result.value : (result.value.professors || [])
          allProfessors.push(...professors)
        }
      }
      
      console.log(`Loaded ${allProfessors.length} professors from ${regions.length} regions`)
      return allProfessors
    } catch (error) {
      console.error('Failed to load all regions:', error)
      return []
    }
  }

  /**
   * Get available regions from metadata
   */
  async getAvailableRegions() {
    const metadata = await this.loadMetadata()
    return Object.keys(metadata.regions || {})
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    this.metadata = null
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size
  }

  /**
   * Preload regions in background
   */
  async preloadRegions(regions) {
    // Load regions without blocking
    regions.forEach(region => {
      this.loadRegion(region).catch(err => {
        console.warn(`Failed to preload region ${region}:`, err)
      })
    })
  }
}

// Singleton instance
export const dataService = new DataService()

export default dataService

