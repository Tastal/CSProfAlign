/**
 * Publication Service - Smart publication data fetching
 * Supports multiple data sources: CSRankings local, DBLP API, Scholar scraper
 */

import { RequestQueue } from '@/utils/requestQueue'
import { affiliationMatch, normalizeAffiliation, findBestMatch } from '@/utils/affiliationMatcher'
import { logService } from './logService'

// Data source enumeration
export const DataSource = {
  CSRANKINGS_LOCAL: 'csrankings-local',
  DBLP_API: 'dblp-api',
  SCHOLAR_SCRAPER: 'scholar-scraper',
  SCHOLAR_CACHE: 'scholar-cache'
}

// DBLP API configuration
const DBLP_CONFIG = {
  pidAPI: 'https://dblp.org/pid/',
  searchAPI: 'https://dblp.org/search/publ/api',
  maxResults: 100,
  timeout: 30000, // Increased to 30 seconds for high concurrency
  retryDelay: 100 // Delay between retries
}

/**
 * DBLP Cache - 7 day TTL with localStorage persistence and optimized storage
 */
class DBLPCache {
  constructor() {
    this.cache = new Map()
    this.ttl = 7 * 24 * 60 * 60 * 1000 // 7 days
    this.storageKey = 'csprofhunt-dblp-cache'
    this.maxPapersToCache = 30 // Only cache first 30 papers to save space
    this.loadFromStorage()
  }

  // Compress paper data to only essential fields
  // Reduces storage size by ~90%: 30KB -> 3KB per professor
  compressPaperData(papers) {
    if (!Array.isArray(papers)) return []
    
    return papers.slice(0, this.maxPapersToCache).map(paper => ({
      title: paper.title || '',
      year: paper.year || 0,
      venue: paper.venue || ''
    }))
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        const now = Date.now()
        let loadedCount = 0
        
        // Load and filter expired entries
        for (const [key, item] of Object.entries(data)) {
          if (now - item.timestamp <= this.ttl) {
            this.cache.set(key, item)
            loadedCount++
          }
        }
        
        if (loadedCount > 0) {
          console.log(`[DBLPCache] Loaded ${loadedCount} items from localStorage`)
        }
      }
    } catch (error) {
      console.warn('[DBLPCache] Failed to load from localStorage:', error)
    }
  }

  saveToStorage() {
    try {
      const data = Object.fromEntries(this.cache)
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      // Graceful degradation: if storage fails, continue without caching
      if (error.name === 'QuotaExceededError') {
        console.warn('[DBLPCache] localStorage quota exceeded. Cache will work in memory only for this session.')
        logService.log('dblp', 'warning', 'localStorage quota exceeded. Cache working in memory only')
        // Try to clear old entries and save again
        this.pruneOldEntries()
      } else {
        console.warn('[DBLPCache] Failed to save to localStorage:', error)
        logService.log('dblp', 'warning', 'Failed to save cache to localStorage: ' + error.message)
      }
    }
  }

  // Remove oldest entries when quota is exceeded
  pruneOldEntries() {
    try {
      const entries = Array.from(this.cache.entries())
      // Sort by timestamp, oldest first
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // Remove oldest 30% of entries
      const toRemove = Math.ceil(entries.length * 0.3)
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0])
      }
      
      console.log(`[DBLPCache] Pruned ${toRemove} old entries to free space`)
      logService.log('dblp', 'warning', `Pruned ${toRemove} old cache entries to free space`)
      
      // Try to save again
      const data = Object.fromEntries(this.cache)
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('[DBLPCache] Failed to prune and save:', error)
    }
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      this.saveToStorage()
      return null
    }

    return item.data
  }

  set(key, data) {
    // Compress data before storing
    const compressedData = this.compressPaperData(data)
    
    this.cache.set(key, {
      data: compressedData,
      timestamp: Date.now()
    })
    this.saveToStorage()
  }

  clear() {
    this.cache.clear()
    localStorage.removeItem(this.storageKey)
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

/**
 * Scholar Cache - 7 day TTL with localStorage persistence and optimized storage (changed from 30 days)
 */
class ScholarCache {
  constructor() {
    this.papersCache = new Map()
    this.redirectCache = new Map()
    this.ttl = 7 * 24 * 60 * 60 * 1000 // 7 days (changed from 30 days)
    this.storageKey = 'csprofhunt-scholar-cache'
    this.maxPapersToCache = 30 // Only cache first 30 papers to save space
    this.loadFromStorage()
  }

  // Compress paper data to only essential fields
  // Reduces storage size by ~90%: 30KB -> 3KB per professor
  compressPaperData(papers) {
    if (!Array.isArray(papers)) return []
    
    return papers.slice(0, this.maxPapersToCache).map(paper => ({
      title: paper.title || '',
      year: paper.year || 0,
      venue: paper.venue || ''
    }))
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        const now = Date.now()
        let loadedPapers = 0
        let loadedRedirects = 0
        
        // Load papers cache
        if (data.papers) {
          for (const [key, item] of Object.entries(data.papers)) {
            if (now - item.timestamp <= this.ttl) {
              this.papersCache.set(key, item)
              loadedPapers++
            }
          }
        }
        
        // Load redirect cache
        if (data.redirects) {
          for (const [key, item] of Object.entries(data.redirects)) {
            if (now - item.timestamp <= this.ttl) {
              this.redirectCache.set(key, item)
              loadedRedirects++
            }
          }
        }
        
        if (loadedPapers > 0 || loadedRedirects > 0) {
          console.log(`[ScholarCache] Loaded ${loadedPapers} papers and ${loadedRedirects} redirects from localStorage`)
        }
      }
    } catch (error) {
      console.warn('[ScholarCache] Failed to load from localStorage:', error)
    }
  }

  saveToStorage() {
    try {
      const data = {
        papers: Object.fromEntries(this.papersCache),
        redirects: Object.fromEntries(this.redirectCache)
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      // Graceful degradation: if storage fails, continue without caching
      if (error.name === 'QuotaExceededError') {
        console.warn('[ScholarCache] localStorage quota exceeded. Cache will work in memory only for this session.')
        // Try to prune old entries
        this.pruneOldEntries()
      } else {
        console.warn('[ScholarCache] Failed to save to localStorage:', error)
      }
    }
  }

  // Remove oldest entries when quota is exceeded
  pruneOldEntries() {
    try {
      const paperEntries = Array.from(this.papersCache.entries())
      paperEntries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // Remove oldest 30% of papers
      const toRemove = Math.ceil(paperEntries.length * 0.3)
      for (let i = 0; i < toRemove; i++) {
        this.papersCache.delete(paperEntries[i][0])
      }
      
      console.log(`[ScholarCache] Pruned ${toRemove} old paper entries to free space`)
      
      // Try to save again
      const data = {
        papers: Object.fromEntries(this.papersCache),
        redirects: Object.fromEntries(this.redirectCache)
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('[ScholarCache] Failed to prune and save:', error)
    }
  }

  getPapers(scholarid) {
    if (!scholarid) return null
    
    const item = this.papersCache.get(`papers_${scholarid}`)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.papersCache.delete(`papers_${scholarid}`)
      this.saveToStorage()
      return null
    }

    return item.data
  }

  setPapers(scholarid, papers) {
    if (!scholarid) return
    
    // Compress data before storing
    const compressedData = this.compressPaperData(papers)
    
    this.papersCache.set(`papers_${scholarid}`, {
      data: compressedData,
      timestamp: Date.now()
    })
    this.saveToStorage()
  }

  getRedirect(originalUrl) {
    const item = this.redirectCache.get(originalUrl)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.redirectCache.delete(originalUrl)
      this.saveToStorage()
      return null
    }

    return item.newUrl
  }

  setRedirect(originalUrl, newUrl) {
    this.redirectCache.set(originalUrl, {
      newUrl,
      timestamp: Date.now()
    })
    this.saveToStorage()
  }

  clear() {
    this.papersCache.clear()
    this.redirectCache.clear()
    localStorage.removeItem(this.storageKey)
  }
}

/**
 * Publication Service - Main class
 */
class PublicationService {
  constructor() {
    this.cache = new DBLPCache()
    this.scholarCache = new ScholarCache()
    this.dblpQueue = new RequestQueue(3, 500) // Default: 3 concurrent, 500ms interval (conservative)
    this.abortSignal = null // Will be set when processing starts
  }

  /**
   * Set abort signal for cancellation support
   * @param {AbortSignal} signal - Abort signal
   */
  setAbortSignal(signal) {
    this.abortSignal = signal
  }

  /**
   * Configure DBLP request queue
   * @param {number} maxConcurrent - Maximum concurrent DBLP requests
   * @param {number} minInterval - Minimum interval between requests (ms)
   */
  configureDBLPQueue(maxConcurrent, minInterval = 500) {
    // Increased default interval to 500ms to avoid DBLP rate limiting
    this.dblpQueue.updateConfig(maxConcurrent, minInterval)
    console.log(`[PublicationService] DBLP queue configured: ${maxConcurrent} concurrent, ${minInterval}ms interval`)
  }

  /**
   * Get DBLP queue statistics
   */
  getDBLPQueueStats() {
    return this.dblpQueue.getStats()
  }

  /**
   * Hybrid method - Four-level fallback strategy with real titles
   * @param {Object} professor - Professor object with name, publications, scholarid
   * @param {Object} options - { maxPapers, enableDBLP, allowScholar }
   * @returns {Object} { papers: [], sources: [], errors: [], quality: 0-100 }
   */
  async getPublicationsHybrid(professor, options = {}) {
    const results = {
      papers: [],
      sources: [],
      errors: [],
      quality: 0
    }

    const maxPapers = options.maxPapers || 20

    // Level 1: DBLP API with smart school matching (Priority - 90% success)
    if (options.enableDBLP !== false) {
      try {
        const dblpPapers = await this.searchDBLPByNameAndAffiliation(
          professor.name,
          professor.affiliation
        )

        if (dblpPapers.length >= 15) {
          // DBLP success - use directly
          results.papers = dblpPapers.slice(0, maxPapers)
          results.sources.push(DataSource.DBLP_API)
          results.quality = 90
          console.log(`[PublicationService] ✅ DBLP API: ${dblpPapers.length} papers for ${professor.name}`)
          logService.log('dblp', 'success', `✅ DBLP API: ${dblpPapers.length} papers for ${professor.name}`)
          return results
        } else if (dblpPapers.length >= 5) {
          // DBLP partial success - merge with local
          const localPapers = this.getFromCSRankings(professor.name, professor.publications)
          results.papers = this.enrichWithDBLP(localPapers, dblpPapers)
          results.sources.push(DataSource.CSRANKINGS_LOCAL, DataSource.DBLP_API)
          results.quality = 75
          console.log(`[PublicationService] ⚡ DBLP+Local: ${results.papers.length} papers for ${professor.name}`)
          logService.log('dblp', 'info', `⚡ DBLP+Local: ${results.papers.length} papers for ${professor.name}`)
          return results
        } else {
          console.log(`[PublicationService] ⚠️ DBLP insufficient (${dblpPapers.length} papers)`)
        }
      } catch (error) {
        console.warn(`[PublicationService] DBLP failed for ${professor.name}:`, error.message)
        results.errors.push({ source: 'dblp', error: error.message })
      }
    }

    // Level 2: Scholar Cache (if available)
    const cachedScholar = this.scholarCache.getPapers(professor.scholarid)
    if (cachedScholar && cachedScholar.length >= 10) {
      results.papers = cachedScholar.slice(0, maxPapers)
      results.sources.push(DataSource.SCHOLAR_CACHE)
      results.quality = 95
      console.log(`[PublicationService] 📦 Scholar cache hit: ${cachedScholar.length} papers for ${professor.name}`)
      return results
    }

    // Level 3: Local CSRankings data (fallback)
    const localPapers = this.getFromCSRankings(professor.name, professor.publications)
    if (localPapers.length > 0) {
      results.papers = localPapers.slice(0, maxPapers)
      results.sources.push(DataSource.CSRANKINGS_LOCAL)
      results.quality = 60
      console.log(`[PublicationService] 📁 Local data: ${localPapers.length} papers for ${professor.name}`)
      return results
    }

    // Level 4: No data available
    console.warn(`[PublicationService] ❌ No publication data for ${professor.name}`)
    results.quality = 0
    return results
  }

  /**
   * Get publications from CSRankings local data
   * @param {string} professorName - Professor name
   * @param {Object} publications - Publications object from JSON
   * @returns {Array} Paper objects
   */
  getFromCSRankings(professorName, publications) {
    if (!publications || Object.keys(publications).length === 0) {
      return []
    }

    const papers = []

    for (const [venue, years] of Object.entries(publications)) {
      for (const [year, count] of Object.entries(years)) {
        const yearInt = parseInt(year)
        const countInt = parseFloat(count) // CSRankings may have decimals

        // Generate paper records
        for (let i = 0; i < Math.ceil(countInt); i++) {
          papers.push({
            title: `Publication in ${venue.toUpperCase()} ${year}`,
            year: yearInt,
            venue: venue,
            authors: [professorName],
            source: DataSource.CSRANKINGS_LOCAL
          })
        }
      }
    }

    // Sort by year (newest first)
    papers.sort((a, b) => b.year - a.year)

    return papers
  }

  /**
   * Search DBLP by name and affiliation (smart matching)
   * @param {string} name - Professor name
   * @param {string} affiliation - Professor affiliation
   * @returns {Array} Paper objects
   */
  async searchDBLPByNameAndAffiliation(name, affiliation) {
    // Check cache first
    const cacheKey = `dblp_${name.toLowerCase().replace(/\s+/g, '_')}`
    const cached = this.cache.get(cacheKey)
    if (cached) {
      console.log(`[PublicationService] DBLP cache hit for ${name}`)
      return cached
    }

    try {
      // Use request queue to control concurrency and rate limiting
      const papers = await this.dblpQueue.execute(async () => {
        // Step 1: Search DBLP by name
        const searchUrl = `${DBLP_CONFIG.searchAPI}?q=author:${encodeURIComponent(name)}&format=json&h=100`
        
        // Use external abort signal if available, otherwise create local timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), DBLP_CONFIG.timeout)
        
        // Listen to external abort signal
        if (this.abortSignal) {
          this.abortSignal.addEventListener('abort', () => controller.abort(), { once: true })
        }

        const response = await fetch(searchUrl, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(`DBLP rate limiting: 429 Too Many Requests`)
          }
          throw new Error(`DBLP search error: ${response.status}`)
        }

        const data = await response.json()
        const hits = data?.result?.hits?.hit || []

        if (hits.length === 0) {
          console.log(`[PublicationService] No DBLP results for ${name}`)
          return []
        }

        // Step 2: Extract author candidates with affiliations
        const candidates = this.extractAuthorsFromDBLPHits(hits)

        // Step 3: Match by affiliation
        const matched = findBestMatch(candidates, affiliation, 0.6)

        if (matched && matched.papers) {
          console.log(`[PublicationService] Matched ${name} at ${matched.affiliation} (score: ${matched.matchScore.toFixed(2)})`)
          return matched.papers
        }

        // Step 4: If no match, use first author's papers
        console.log(`[PublicationService] No affiliation match for ${name}, using first result`)
        return this.parseDBLPSearchResponse(data)
      }, this.abortSignal)  // Pass abort signal to queue

      // Cache the result
      if (papers.length > 0) {
        this.cache.set(cacheKey, papers)
      }

      return papers

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[PublicationService] DBLP search timeout for ${name}`)
      } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.error(`[PublicationService] DBLP rate limited for ${name} - will use local data`)
      } else if (error.message.includes('aborted')) {
        // User cancelled, rethrow
        throw error
      } else {
        console.error(`[PublicationService] DBLP error for ${name}:`, error.message)
      }
      return []
    }
  }

  /**
   * Extract author candidates from DBLP search hits
   * @param {Array} hits - DBLP search hits
   * @returns {Array} Author candidates with papers
   */
  extractAuthorsFromDBLPHits(hits) {
    const authorsMap = new Map()

    for (const hit of hits) {
      const info = hit.info
      if (!info) continue

      // Extract author information
      const authors = info.authors?.author || []
      const authorsArray = Array.isArray(authors) ? authors : [authors]

      for (const author of authorsArray) {
        const authorText = typeof author === 'string' ? author : (author.text || author)
        if (!authorText) continue

        // Group papers by author
        if (!authorsMap.has(authorText)) {
          authorsMap.set(authorText, {
            name: authorText,
            affiliation: '', // DBLP search doesn't provide affiliation directly
            papers: []
          })
        }

        // Add paper
        const paper = {
          title: Array.isArray(info.title) ? info.title[0] : info.title,
          year: parseInt(info.year),
          venue: info.venue || info.journal || info.booktitle || '',
          authors: authorsArray.map(a => typeof a === 'string' ? a : (a.text || a)),
          source: DataSource.DBLP_API
        }

        authorsMap.get(authorText).papers.push(paper)
      }
    }

    // Convert to array and sort by paper count
    const candidates = Array.from(authorsMap.values())
    candidates.sort((a, b) => b.papers.length - a.papers.length)

    return candidates
  }

  /**
   * Match author by affiliation
   * @param {Array} candidates - Author candidates
   * @param {string} targetAffiliation - Target affiliation
   * @returns {Object|null} Matched author
   */
  matchAuthorByAffiliation(candidates, targetAffiliation) {
    if (!candidates || candidates.length === 0) return null
    if (!targetAffiliation) return candidates[0] // Return first if no affiliation to match

    // For now, since DBLP search doesn't provide affiliation,
    // we'll rely on the findBestMatch function from affiliationMatcher
    // In practice, DBLP search results are usually ordered by relevance
    // So the first result with most papers is likely correct
    
    // Future: Can be enhanced by fetching author profile page for affiliation
    return candidates[0]
  }

  /**
   * Get publications from DBLP API (legacy method)
   * @param {string} professorName - Professor name
   * @param {string} dblpUrl - DBLP URL or Scholar URL
   * @returns {Array} Paper objects
   */
  async getFromDBLP(professorName, dblpUrl) {
    // Check cache first
    const cacheKey = `dblp_${professorName.toLowerCase().replace(/\s+/g, '_')}`
    const cached = this.cache.get(cacheKey)
    if (cached) {
      console.log(`[PublicationService] DBLP cache hit for ${professorName}`)
      return cached
    }

    try {
      let papers = []

      // Method 1: If we have a DBLP URL, use it directly
      if (dblpUrl && dblpUrl.includes('dblp.org')) {
        const authorId = this.extractDBLPId(dblpUrl)
        if (authorId) {
          papers = await this.fetchFromDBLPByIdWithRetry(authorId)
          if (papers.length > 0) {
            this.cache.set(cacheKey, papers)
            return papers
          }
        }
      }

      // Method 2: Search by name (with retry)
      papers = await this.searchDBLPByNameWithRetry(professorName)
      this.cache.set(cacheKey, papers)
      return papers

    } catch (error) {
      console.error('[PublicationService] DBLP API error:', error)
      return []
    }
  }

  /**
   * Fetch from DBLP with retry mechanism
   */
  async fetchFromDBLPByIdWithRetry(authorId, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[PublicationService] Retry DBLP fetch (attempt ${attempt + 1}/${maxRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, DBLP_CONFIG.retryDelay * attempt))
        }
        
        return await this.fetchFromDBLPById(authorId)
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
      }
    }
  }

  /**
   * Search DBLP with retry mechanism
   */
  async searchDBLPByNameWithRetry(name, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[PublicationService] Retry DBLP search (attempt ${attempt + 1}/${maxRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, DBLP_CONFIG.retryDelay * attempt))
        }
        
        return await this.searchDBLPByName(name)
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
      }
    }
  }

  /**
   * Fetch publications from DBLP by author ID
   * @param {string} authorId - DBLP author ID (e.g., "01/2345")
   * @returns {Array} Paper objects
   */
  async fetchFromDBLPById(authorId) {
    try {
      // Apply rate limiting
      await this.rateLimitDBLP()
      
      const url = `${DBLP_CONFIG.pidAPI}${authorId}.xml`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), DBLP_CONFIG.timeout)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`DBLP API error: ${response.status}`)
      }

      const xmlText = await response.text()
      return this.parseDBLPXML(xmlText)

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[PublicationService] DBLP request timeout')
      }
      throw error
    }
  }

  /**
   * Search DBLP by author name
   * @param {string} name - Author name
   * @returns {Array} Paper objects
   */
  async searchDBLPByName(name) {
    try {
      // Apply rate limiting
      await this.rateLimitDBLP()
      
      const url = `${DBLP_CONFIG.searchAPI}?q=author:${encodeURIComponent(name)}&format=json&h=${DBLP_CONFIG.maxResults}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), DBLP_CONFIG.timeout)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`DBLP search error: ${response.status}`)
      }

      const data = await response.json()
      return this.parseDBLPSearchResponse(data)

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[PublicationService] DBLP search timeout')
      }
      throw error
    }
  }

  /**
   * Extract DBLP author ID from URL
   * @param {string} url - DBLP URL
   * @returns {string|null} Author ID
   */
  extractDBLPId(url) {
    if (!url) return null

    // Pattern: https://dblp.org/pid/01/2345.html or /pid/01/2345
    const patterns = [
      /\/pid\/([^\.]+)/,
      /dblp\.org\/pid\/([^\.]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Parse DBLP XML response
   * @param {string} xmlText - XML text
   * @returns {Array} Paper objects
   */
  parseDBLPXML(xmlText) {
    const papers = []
    
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      // Get all publication elements (article, inproceedings, etc.)
      const pubElements = xmlDoc.querySelectorAll('r > *')

      for (const pub of pubElements) {
        const titleElem = pub.querySelector('title')
        const yearElem = pub.querySelector('year')
        const venueElem = pub.querySelector('journal, booktitle')
        const authorElems = pub.querySelectorAll('author')

        if (!titleElem || !yearElem) continue

        const paper = {
          title: titleElem.textContent.trim(),
          year: parseInt(yearElem.textContent),
          venue: venueElem ? venueElem.textContent.trim() : '',
          authors: Array.from(authorElems).map(a => a.textContent.trim()),
          source: DataSource.DBLP_API
        }

        papers.push(paper)
      }

      // Sort by year (newest first)
      papers.sort((a, b) => b.year - a.year)

    } catch (error) {
      console.error('[PublicationService] XML parsing error:', error)
    }

    return papers
  }

  /**
   * Parse DBLP search JSON response
   * @param {Object} data - JSON response
   * @returns {Array} Paper objects
   */
  parseDBLPSearchResponse(data) {
    const papers = []

    try {
      const hits = data?.result?.hits?.hit || []

      for (const hit of hits) {
        const info = hit.info

        if (!info || !info.title || !info.year) continue

        const paper = {
          title: Array.isArray(info.title) ? info.title[0] : info.title,
          year: parseInt(info.year),
          venue: info.venue || info.journal || info.booktitle || '',
          authors: Array.isArray(info.authors?.author) 
            ? info.authors.author.map(a => a.text || a) 
            : [],
          source: DataSource.DBLP_API
        }

        papers.push(paper)
      }

      // Sort by year (newest first)
      papers.sort((a, b) => b.year - a.year)

    } catch (error) {
      console.error('[PublicationService] JSON parsing error:', error)
    }

    return papers
  }

  /**
   * Enrich local papers with DBLP titles
   * @param {Array} localPapers - Papers from CSRankings
   * @param {Array} dblpPapers - Papers from DBLP
   * @returns {Array} Enriched papers
   */
  enrichWithDBLP(localPapers, dblpPapers) {
    if (!Array.isArray(localPapers) || !Array.isArray(dblpPapers)) {
      console.warn('[PublicationService] Invalid input to enrichWithDBLP')
      return localPapers || []
    }
    
    return localPapers.map(localPaper => {
      try {
        // Try to match by venue and year
        const match = dblpPapers.find(dblpPaper => 
          dblpPaper && 
          dblpPaper.year === localPaper.year &&
          this.venueMatch(dblpPaper.venue, localPaper.venue)
        )

        if (match && match.title) {
          return {
            ...localPaper,
            title: match.title, // Replace with real DBLP title
            authors: (Array.isArray(match.authors) && match.authors.length > 0) ? match.authors : localPaper.authors,
            source: `${DataSource.CSRANKINGS_LOCAL}+${DataSource.DBLP_API}`
          }
        }
      } catch (error) {
        console.warn(`[PublicationService] Error enriching paper:`, error)
      }

      return localPaper
    })
  }

  /**
   * Check if venues match (fuzzy matching)
   * @param {string} dblpVenue - DBLP venue name
   * @param {string} localVenue - CSRankings venue code
   * @returns {boolean} Match result
   */
  venueMatch(dblpVenue, localVenue) {
    if (!dblpVenue || !localVenue) return false

    // Ensure both are strings
    const dblpStr = String(dblpVenue)
    const localStr = String(localVenue)
    
    const dblpLower = dblpStr.toLowerCase()
    const localLower = localStr.toLowerCase()

    // Direct match
    if (dblpLower.includes(localLower) || localLower.includes(dblpLower)) {
      return true
    }

    // Common venue mappings
    const venueMappings = {
      'siggraph': ['siggraph', 'sig graph'],
      'neurips': ['nips', 'neurips', 'neural information processing'],
      'icml': ['icml', 'international conference on machine learning'],
      'iclr': ['iclr', 'international conference on learning representations'],
      'cvpr': ['cvpr', 'computer vision and pattern recognition'],
      'eccv': ['eccv', 'european conference on computer vision'],
      'iccv': ['iccv', 'international conference on computer vision']
    }

    for (const [key, variations] of Object.entries(venueMappings)) {
      if (localLower === key) {
        return variations.some(v => dblpLower.includes(v))
      }
    }

    return false
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    console.log('[PublicationService] Cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }
}

// Export singleton instance
export const publicationService = new PublicationService()

export default publicationService

