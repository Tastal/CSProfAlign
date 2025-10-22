/**
 * Prompt Service - Manages loading and rendering prompts from text files
 * All prompts are stored in public/prompts/ as .txt files
 */

class PromptService {
  constructor() {
    this.cache = new Map()
    this.baseURL = '/prompts'
  }

  /**
   * Load prompt from text file
   * @param {string} filename - Prompt filename (e.g., 'basic-user-prompt.txt')
   * @returns {Promise<string>} Prompt text
   */
  async loadPrompt(filename) {
    // Check cache first
    if (this.cache.has(filename)) {
      return this.cache.get(filename)
    }

    try {
      const response = await fetch(`${this.baseURL}/${filename}`)
      if (!response.ok) {
        throw new Error(`Failed to load prompt: ${filename}`)
      }

      const text = await response.text()
      this.cache.set(filename, text)
      return text
    } catch (error) {
      console.error(`[PromptService] Error loading ${filename}:`, error)
      throw error
    }
  }

  /**
   * Render prompt by replacing template variables
   * @param {string} template - Prompt template with {{variable}} placeholders
   * @param {Object} variables - Variables to replace
   * @returns {string} Rendered prompt
   */
  renderPrompt(template, variables) {
    let rendered = template

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      const replacement = String(value || '')
      rendered = rendered.replace(new RegExp(placeholder, 'g'), replacement)
    }

    return rendered
  }

  /**
   * Load and render a prompt in one call
   * @param {string} filename - Prompt filename
   * @param {Object} variables - Variables to replace
   * @returns {Promise<string>} Rendered prompt
   */
  async getPrompt(filename, variables = {}) {
    const template = await this.loadPrompt(filename)
    return this.renderPrompt(template, variables)
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Preload all prompts
   */
  async preloadAll() {
    const prompts = [
      'basic-user-prompt.txt',
      'basic-system-prompt.txt',
      'decision-tree-user-prompt.txt',
      'decision-tree-system-prompt.txt'
    ]

    await Promise.all(prompts.map(p => this.loadPrompt(p)))
    console.log('[PromptService] All prompts preloaded')
  }
}

// Export singleton instance
export const promptService = new PromptService()

export default promptService

