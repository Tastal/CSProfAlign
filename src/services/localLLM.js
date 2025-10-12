/**
 * Local LLM Service using Transformers.js
 * Allows running models entirely in the browser
 */

import { pipeline } from '@xenova/transformers'

export class LocalLLMService {
  constructor() {
    this.model = null
    this.isLoading = false
    this.loadingProgress = 0
    this.currentModel = null
  }

  /**
   * Load a model from HuggingFace
   */
  async loadModel(modelName = 'Xenova/LaMini-Flan-T5-783M', onProgress = null) {
    if (this.isLoading) {
      throw new Error('Model is already loading')
    }

    this.isLoading = true
    this.currentModel = modelName

    try {
      this.model = await pipeline('text2text-generation', modelName, {
        progress_callback: (progress) => {
          this.loadingProgress = progress.progress || 0
          if (onProgress) {
            onProgress(progress)
          }
        }
      })
      
      this.isLoading = false
      this.loadingProgress = 100
      return true
    } catch (error) {
      console.error('Failed to load model:', error)
      this.isLoading = false
      this.loadingProgress = 0
      throw error
    }
  }

  /**
   * Generate text using the loaded model
   */
  async generate(prompt, options = {}) {
    if (!this.model) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    const defaultOptions = {
      max_length: 512,
      temperature: 0.7,
      top_p: 0.95,
      num_return_sequences: 1
    }

    const mergedOptions = { ...defaultOptions, ...options }

    try {
      const result = await this.model(prompt, mergedOptions)
      
      if (Array.isArray(result)) {
        return result[0].generated_text
      } else if (result.generated_text) {
        return result.generated_text
      }
      
      return String(result)
    } catch (error) {
      console.error('Generation error:', error)
      throw error
    }
  }

  /**
   * Evaluate professor match using local model
   */
  async evaluateProfessor(professor, researchDirection) {
    const prompt = this.buildEvaluationPrompt(professor, researchDirection)
    const response = await this.generate(prompt, {
      max_length: 256,
      temperature: 0.3
    })
    
    return this.parseResponse(response)
  }

  /**
   * Build evaluation prompt
   */
  buildEvaluationPrompt(professor, researchDirection) {
    const recentAreas = professor.areas.slice(0, 5).join(', ')
    
    return `
Task: Evaluate research match

Professor: ${professor.name}
Research Areas: ${recentAreas}
Papers: ${professor.total_papers_recent}

Target Research: ${researchDirection}

Rate the match from 0.0 to 1.0 and explain briefly.
Format: Score: X.X | Reason: ...
`.trim()
  }

  /**
   * Parse local model response
   */
  parseResponse(response) {
    try {
      // Try to extract score
      const scoreMatch = response.match(/(?:Score|score)[:\s]+([0-9.]+)/i)
      let score = 0
      
      if (scoreMatch) {
        score = parseFloat(scoreMatch[1])
        score = Math.max(0, Math.min(1, score)) // Clamp to [0, 1]
      }
      
      // Extract reasoning
      const reasonMatch = response.match(/(?:Reason|reason|explanation)[:\s]+(.+)/i)
      const reasoning = reasonMatch ? reasonMatch[1].trim() : response
      
      return {
        score,
        reasoning: reasoning.substring(0, 200) // Limit length
      }
    } catch (error) {
      console.error('Error parsing response:', error)
      return {
        score: 0,
        reasoning: 'Failed to parse response'
      }
    }
  }

  /**
   * Check if model is ready
   */
  isReady() {
    return this.model !== null && !this.isLoading
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      currentModel: this.currentModel,
      isLoading: this.isLoading,
      loadingProgress: this.loadingProgress,
      isReady: this.isReady()
    }
  }

  /**
   * Unload model to free memory
   */
  unload() {
    this.model = null
    this.currentModel = null
    this.loadingProgress = 0
    this.isLoading = false
  }
}

/**
 * Recommended models for different use cases
 */
export const RECOMMENDED_MODELS = [
  {
    name: 'Xenova/LaMini-Flan-T5-783M',
    size: '783M',
    description: 'Balanced performance and speed',
    recommended: true
  },
  {
    name: 'Xenova/LaMini-Flan-T5-248M',
    size: '248M',
    description: 'Faster, smaller model'
  },
  {
    name: 'Xenova/flan-t5-small',
    size: '80M',
    description: 'Very fast, lightweight'
  }
]

// Singleton instance
export const localLLM = new LocalLLMService()

export default localLLM

