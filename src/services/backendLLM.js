/**
 * Backend LLM Service - API client for vLLM backend
 * Replaces browser-based WebGPU inference
 */

import backendConfig from '@/config/backend.js'

class BackendLLMService {
  constructor() {
    this.baseURL = backendConfig.baseURL
    this.currentModel = null
    this.isReady = false
    
    console.log(`🔗 Backend API configured at: ${this.baseURL}`)
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
      })
      
      if (!res.ok) return false
      
      const data = await res.json()
      this.isReady = data.model_loaded
      this.currentModel = data.current_model
      
      return true
    } catch (error) {
      console.error('Backend health check failed:', error)
      return false
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    try {
      const res = await fetch(`${this.baseURL}/models`)
      
      if (!res.ok) {
        throw new Error(`Failed to fetch models: ${res.statusText}`)
      }
      
      const data = await res.json()
      return data.models
    } catch (error) {
      console.error('Failed to get models:', error)
      throw error
    }
  }

  /**
   * Load a model
   * @param {string} modelId - Model identifier (e.g., 'qwen-0.5b')
   * @param {function} onProgress - Progress callback (not implemented for now)
   */
  async loadModel(modelId, onProgress) {
    try {
      console.log(`Loading model: ${modelId}`)
      
      // Notify start
      if (onProgress) {
        onProgress({ progress: 0, status: 'starting' })
      }
      
      const res = await fetch(`${this.baseURL}/load_model`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ model_id: modelId })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || `Failed to load model: ${res.statusText}`)
      }
      
      const data = await res.json()
      
      // Update state
      this.currentModel = modelId
      this.isReady = true
      
      // Notify completion
      if (onProgress) {
        onProgress({ progress: 100, status: 'loaded' })
      }
      
      console.log(`✅ Model loaded: ${modelId}`)
      return data
    } catch (error) {
      console.error('Model loading failed:', error)
      this.isReady = false
      throw error
    }
  }

  /**
   * Unload current model
   */
  async unloadModel() {
    try {
      const res = await fetch(`${this.baseURL}/unload_model`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      })
      
      if (!res.ok) {
        throw new Error(`Failed to unload model: ${res.statusText}`)
      }
      
      this.currentModel = null
      this.isReady = false
      
      console.log('✅ Model unloaded')
      return await res.json()
    } catch (error) {
      console.error('Model unload failed:', error)
      throw error
    }
  }

  /**
   * Evaluate a batch of professors
   * @param {Array} professors - Array of professor objects
   * @param {string} researchDirection - Research direction description
   * @param {number} threshold - Match threshold (0-1)
   */
  async evaluateBatch(professors, researchDirection, threshold = 0.6) {
    if (!this.isReady) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }
    
    try {
      console.log(`Evaluating batch of ${professors.length} professors`)
      
      const res = await fetch(`${this.baseURL}/evaluate_batch`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          professors: professors.map(p => ({
            name: p.name,
            affiliation: p.affiliation,
            areas: p.areas || [],
            publicationList: p.publicationList || []
          })),
          research_direction: researchDirection,
          batch_size: professors.length,
          threshold: threshold
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || `Evaluation failed: ${res.statusText}`)
      }
      
      const data = await res.json()
      
      console.log(
        `✅ Batch evaluated: ${data.results.length} professors in ${data.processing_time.toFixed(2)}s`
      )
      
      return data
    } catch (error) {
      console.error('Batch evaluation failed:', error)
      throw error
    }
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      currentModel: this.currentModel,
      isReady: this.isReady
    }
  }
}

// Export singleton instance
export const backendLLM = new BackendLLMService()
export default backendLLM

