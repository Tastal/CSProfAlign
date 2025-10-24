/**
 * Request Queue - Manages concurrent requests with rate limiting
 * Supports dynamic configuration
 */

export class RequestQueue {
  constructor(maxConcurrent = 3, minInterval = 200) {
    this.maxConcurrent = maxConcurrent
    this.minInterval = minInterval
    this.baseDelay = minInterval
    this.currentDelay = minInterval
    this.activeRequests = 0
    this.lastRequestTime = 0
    this.totalRequests = 0
    this.successCount = 0
    this.errorCount = 0
    this.consecutiveErrors = 0
    this.lastErrorTime = null
  }

  /**
   * Update queue configuration at runtime
   * @param {number} maxConcurrent - Maximum concurrent requests
   * @param {number} minInterval - Minimum interval between requests (ms)
   */
  updateConfig(maxConcurrent, minInterval) {
    this.maxConcurrent = maxConcurrent
    this.minInterval = minInterval
    console.log(`[RequestQueue] Config updated: ${maxConcurrent} concurrent, ${minInterval}ms interval`)
  }

  /**
   * Execute a request with exponential backoff on rate limit errors
   * @param {Function} requestFn - Async function to execute
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise} Request result
   */
  async executeWithBackoff(requestFn, signal = null) {
    try {
      const result = await this.execute(requestFn, signal)
      
      // Success: gradually recover speed
      if (this.consecutiveErrors > 0) {
        this.consecutiveErrors = Math.max(0, this.consecutiveErrors - 1)
        this.currentDelay = this.baseDelay * Math.pow(2, this.consecutiveErrors)
        
        if (this.consecutiveErrors === 0) {
          console.log(`[RequestQueue] ✅ Recovered from rate limit, back to ${this.baseDelay}ms`)
        }
      }
      
      return result
    } catch (error) {
      // Check if it's a rate limit error (HTTP 429)
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        this.consecutiveErrors++
        this.lastErrorTime = Date.now()
        this.currentDelay = Math.min(5000, this.baseDelay * Math.pow(2, this.consecutiveErrors))
        
        console.warn(`[RequestQueue] ⚠️ Rate limit hit (${this.consecutiveErrors} consecutive), backing off to ${this.currentDelay}ms`)
        
        // Wait before rethrowing to let the system cool down
        await new Promise(resolve => setTimeout(resolve, this.currentDelay))
      }
      
      throw error
    }
  }

  /**
   * Execute a request with queue management
   * @param {Function} requestFn - Async function to execute
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise} Request result
   */
  async execute(requestFn, signal = null) {
    // Check if already aborted
    if (signal?.aborted) {
      throw new Error('Request aborted before execution')
    }

    // Wait for queue slot (with abort check)
    while (this.activeRequests >= this.maxConcurrent) {
      if (signal?.aborted) {
        throw new Error('Request aborted while waiting in queue')
      }
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Wait for rate limit (with abort check)
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    
    if (elapsed < this.minInterval) {
      const delay = this.minInterval - elapsed
      
      // Interruptible delay
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, delay)
        
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId)
            reject(new Error('Request aborted during rate limit delay'))
          }, { once: true })
        }
      })
    }

    // Final abort check before execution
    if (signal?.aborted) {
      throw new Error('Request aborted before execution')
    }

    // Execute request
    this.activeRequests++
    this.lastRequestTime = Date.now()
    this.totalRequests++

    try {
      const result = await requestFn()
      this.successCount++
      return result
    } catch (error) {
      this.errorCount++
      throw error
    } finally {
      this.activeRequests--
    }
  }

  /**
   * Get queue statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      maxConcurrent: this.maxConcurrent,
      minInterval: this.minInterval,
      activeRequests: this.activeRequests,
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      errorCount: this.errorCount,
      successRate: this.totalRequests > 0 ? this.successCount / this.totalRequests : 0
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.totalRequests = 0
    this.successCount = 0
    this.errorCount = 0
  }

  /**
   * Get current load
   * @returns {number} Load percentage (0-100)
   */
  getLoad() {
    return (this.activeRequests / this.maxConcurrent) * 100
  }
}

export default RequestQueue

