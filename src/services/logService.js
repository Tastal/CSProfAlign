/**
 * Log Service for real-time debug console
 * Manages logs, statistics, and pub-sub pattern for UI updates
 */

class LogService {
  constructor() {
    this.logs = []
    this.maxLogs = 1000
    this.listeners = []
    this.startTime = Date.now()
    this.stats = {
      data: { count: 0 },
      filter: { count: 0 },
      llm: { count: 0, started: 0, completed: 0 },
      dblp: { success: 0, failed: 0, cached: 0, total: 0 },
      progress: { processed: 0, total: 0, matched: 0, speed: 0 },
      errors: { count: 0, types: {} },
      scores: {}
    }
    this.interceptionSetup = false
    this.batchStartTime = null
  }

  /**
   * Add a log entry
   */
  log(category, level, message, data = null) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      category, // data/filter/llm/dblp/progress/results
      level, // info/success/warning/error
      message,
      data
    }

    this.logs.push(logEntry)

    // Trim logs if exceeded max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Update stats
    this.updateStats(logEntry)

    // Notify all listeners
    this.notifyListeners(logEntry)

    return logEntry.id
  }

  /**
   * Subscribe to log updates
   * Returns unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Notify all listeners of new log
   */
  notifyListeners(logEntry) {
    this.listeners.forEach(callback => {
      try {
        callback(logEntry)
      } catch (e) {
        console.error('Error in log listener:', e)
      }
    })
  }

  /**
   * Intercept console methods
   */
  interceptConsole() {
    if (this.interceptionSetup) return

    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args) => {
      this.parseAndLog(args, 'info')
      originalLog.apply(console, args)
    }

    console.warn = (...args) => {
      this.parseAndLog(args, 'warning')
      originalWarn.apply(console, args)
    }

    console.error = (...args) => {
      this.parseAndLog(args, 'error')
      originalError.apply(console, args)
    }

    this.interceptionSetup = true
  }

  /**
   * Parse console output and categorize
   */
  parseAndLog(args, level) {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg).substring(0, 100)
        } catch (e) {
          return '[Object]'
        }
      }
      return String(arg)
    }).join(' ')

    // Auto-categorize based on content
    let category = 'info'
    if (message.includes('Loading') || message.includes('Loaded') || message.includes('Data loaded')) {
      category = 'data'
    } else if (message.includes('Filter') || message.includes('After')) {
      category = 'filter'
    } else if (message.includes('LLM') || message.includes('Starting') || message.includes('Batch')) {
      category = 'llm'
    } else if (message.includes('DBLP') || message.includes('PublicationService') || message.includes('HTTP')) {
      category = 'dblp'
    } else if (message.includes('Processed') || message.includes('Speed') || message.includes('Progress')) {
      category = 'progress'
    } else if (message.includes('Matched') || message.includes('Score')) {
      category = 'results'
    }

    this.log(category, level, message, args.length > 1 ? args.slice(1) : null)
  }

  /**
   * Update statistics based on log
   */
  updateStats(logEntry) {
    const msg = logEntry.message

    // Count by category
    if (logEntry.category === 'data') this.stats.data.count++
    if (logEntry.category === 'filter') this.stats.filter.count++
    if (logEntry.category === 'llm') this.stats.llm.count++
    if (logEntry.category === 'dblp') this.stats.dblp.total++

    // Error counting
    if (logEntry.level === 'error') {
      this.stats.errors.count++
      const errorType = msg.split(':')[0]
      this.stats.errors.types[errorType] = (this.stats.errors.types[errorType] || 0) + 1
    }

    // Extract specific metrics from messages
    if (msg.includes('DBLP API')) {
      if (msg.includes('✅') || msg.includes('Success')) {
        this.stats.dblp.success++
      }
      if (msg.includes('❌') || msg.includes('Failed')) {
        this.stats.dblp.failed++
      }
      if (msg.includes('Cache') || msg.includes('Cached')) {
        this.stats.dblp.cached++
      }
    }

    // Progress tracking
    if (msg.includes('completed')) {
      const match = msg.match(/(\d+)\/(\d+)/)
      if (match) {
        this.stats.progress.processed = parseInt(match[1])
        this.stats.progress.total = parseInt(match[2])
      }

      const speedMatch = msg.match(/([\d.]+)\s*profs?\/sec/)
      if (speedMatch) {
        this.stats.progress.speed = parseFloat(speedMatch[1])
      }
    }

    // Matched professors
    if (msg.includes('Matched') && msg.includes('+')) {
      const match = msg.match(/\+(\d+)/)
      if (match) {
        this.stats.progress.matched += parseInt(match[1])
      }
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    const elapsedMs = Date.now() - this.startTime
    const elapsedSec = Math.floor(elapsedMs / 1000)
    const eta = this.stats.progress.speed > 0 && this.stats.progress.total > 0
      ? Math.ceil((this.stats.progress.total - this.stats.progress.processed) / this.stats.progress.speed)
      : 0

    return {
      ...this.stats,
      elapsed: elapsedSec,
      eta
    }
  }

  /**
   * Format time for display
   */
  formatTime(date) {
    if (!date) return ''
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs
  }

  /**
   * Get filtered logs
   */
  getFilteredLogs(filters = {}) {
    let filtered = this.logs

    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level)
    }

    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category)
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(search)
      )
    }

    return filtered
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = []
    this.stats = {
      data: { count: 0 },
      filter: { count: 0 },
      llm: { count: 0, started: 0, completed: 0 },
      dblp: { success: 0, failed: 0, cached: 0, total: 0 },
      progress: { processed: 0, total: 0, matched: 0, speed: 0 },
      errors: { count: 0, types: {} },
      scores: {}
    }
    this.startTime = Date.now()
    this.notifyListeners({ type: 'clear' })
  }

  /**
   * Export logs as text
   */
  exportAsText() {
    const lines = this.logs.map(log => {
      const time = this.formatTime(log.timestamp)
      const icon = this.getLogIcon(log.level)
      return `[${time}] ${icon} [${log.category}] ${log.message}`
    })
    return lines.join('\n')
  }

  /**
   * Export logs as JSON
   */
  exportAsJSON() {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      logs: this.logs
    }, null, 2)
  }

  /**
   * Get icon for log level
   */
  getLogIcon(level) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }
    return icons[level] || '•'
  }

  /**
   * Reset start time (useful for batch operations)
   */
  resetTimer() {
    this.startTime = Date.now()
  }
}

// Singleton instance
export const logService = new LogService()
export default logService
